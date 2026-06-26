require('dotenv').config()
const Event = require("../models/event")

const CityCache = require("../models/cityCache")

// if no api key
if (!process.env.TICKETMASTER_API_KEY) {
    throw new Error("Missing API key")
}

// interval for freshness
const SIX_HOURS = 6 * 60 * 60 * 1000

// checks the events for a city 
const ensureEventsForCity = async (city) => {
    // find the events for the city
    const cacheEntry = await CityCache.findOne({ city })

    // check for age and exisitance
    const isStale = !cacheEntry || (Date.now() - cacheEntry.lastRefreshed > SIX_HOURS)

    // if not stale and does exisit return out
    if (!isStale) {
        return { city, refreshed: false, reason: "fresh" }
    }

    // after conditional logic ^ means it IS stale or does not exisit 
    const result = await fetchAndStoreEventsForCity(city)

    // update the cache with the new city / refreshed city 
    await CityCache.updateOne(
        { city },
        { lastRefreshed: new Date() },
        { upsert: true }
    )

    // return the outcome
    return { city, refreshed: true, ...result }
}

const fetchAndStoreEventsForCity = async (city) => {

    // search parameters
    const params = new URLSearchParams({
        apikey: process.env.TICKETMASTER_API_KEY,
        city,
        sort: "date,asc",
        size: "20",
        classificationName: "Music",
    })

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
    const response = await fetch(url)


    //  error for bad response 
    if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // error for nothing fetched
    if (!data._embedded?.events) {
        return { city, fetched: 0, upserted: 0, modified: 0, skipped: 0 }
    }

    const events = data._embedded.events

    // create the new document for an event based on the schema 
    const eventDocs = events.map((e) => {
        const v = e._embedded?.venues?.[0]
        const loc = v?.location

        return {
            name: e.name,
            artist: e._embedded?.attractions?.[0]?.name || e.name,
            tags: [
                e.classifications?.[0]?.genre?.name,
                e.classifications?.[0]?.subGenre?.name,
            ].filter(Boolean),
            date: e.dates?.start?.localDate
                ? new Date(`${e.dates.start.localDate}T${e.dates.start.localTime || "00:00:00"}`)
                : null,
            time: e.dates?.start?.localTime,
            city: v?.city?.name,
            venue: {
                name: v?.name,
                address: v?.address?.line1,
                postcode: v?.postalCode,
                location: loc?.longitude && loc?.latitude ? {
                    type: "Point",
                    coordinates: [Number(loc.longitude), Number(loc.latitude)],
                } : undefined,
            },
            images: (e.images || []).map((img) => ({
                url: img.url,
                width: img.width,
                height: img.height,
            })),
            description: e.description || e.pleaseNote,
            ticketUrl: e.url,
            ticketmasterId: e.id,
        }
    })

    // validate entries
    const validEvents = eventDocs.filter(
        (e) => e.name && e.artist && e.date && e.city
    )

    // check fot skipped 
    const skipped = eventDocs.length - validEvents.length

    //bulk write to db
    const result = await Event.bulkWrite(
        validEvents.map((event) => ({
            updateOne: {
                filter: { ticketmasterId: event.ticketmasterId },
                update: { $set: event },
                upsert: true,
            },
        }))
    )

    // return the outcome 
    return {
        city,
        fetched: events.length,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        skipped,
    }
}


module.exports = { fetchAndStoreEventsForCity, ensureEventsForCity }