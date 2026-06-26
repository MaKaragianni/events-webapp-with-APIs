// tests/services/ticketmaster.test.js
const Event = require("../../models/event")
const CityCache = require("../../models/cityCache")
const {
    fetchAndStoreEventsForCity,
    ensureEventsForCity,
} = require("../../services/ticketmaster")

require("../mongodb_helper")

// A reusable Ticketmaster response — tweak per-test for edge cases
function ticketmasterResponse(overrides = {}) {
    return {
        _embedded: {
            events: [
                {
                    id: "tm-event-1",
                    name: "Test Event",
                    url: "https://example.com",
                    dates: { start: { localDate: "2026-07-15", localTime: "20:00:00" } },
                    classifications: [{ genre: { name: "Rock" }, subGenre: { name: "Indie Rock" } }],
                    images: [
                        { url: "https://example.com/1.jpg", ratio: "16_9", width: 1024, height: 576 },
                    ],
                    _embedded: {
                        attractions: [{ name: "Test Artist" }],
                        venues: [{
                            name: "Test Venue",
                            address: { line1: "1 Test St" },
                            postalCode: "M1 1AA",
                            city: { name: "Manchester" },
                            location: { longitude: "-2.244", latitude: "53.483" },
                        }],
                    },
                },
            ],
        },
        ...overrides,
    }
}

function mockFetch(response, ok = true) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        statusText: ok ? "OK" : "Internal Server Error",
        json: async () => response,
    })
}

beforeEach(async () => {
    await Event.deleteMany({})
    await CityCache.deleteMany({})
    jest.clearAllMocks()
})

afterEach(() => {
    delete global.fetch
})


describe("fetchAndStoreEventsForCity", () => {
    test("stores events in the DB", async () => {
        mockFetch(ticketmasterResponse())

        const result = await fetchAndStoreEventsForCity("Manchester")

        expect(result.upserted).toBe(1)
        const events = await Event.find({})
        expect(events).toHaveLength(1)
        expect(events[0].name).toBe("Test Event")
    })

    test("calls Ticketmaster with the correct city", async () => {
        mockFetch(ticketmasterResponse())

        await fetchAndStoreEventsForCity("Manchester")

        const calledUrl = global.fetch.mock.calls[0][0]
        expect(calledUrl).toContain("city=Manchester")
        expect(calledUrl).toContain("classificationName=Music")
    })

    test("builds tags from genre and subGenre", async () => {
        mockFetch(ticketmasterResponse())
        await fetchAndStoreEventsForCity("Manchester")

        const event = await Event.findOne({})
        expect(event.tags).toEqual(["Rock", "Indie Rock"])
    })

    test("filters out empty values from tags", async () => {
        const response = ticketmasterResponse()
        response._embedded.events[0].classifications = [{ genre: { name: "Rock" } }]
        // no subGenre
        mockFetch(response)

        await fetchAndStoreEventsForCity("Manchester")
        const event = await Event.findOne({})
        expect(event.tags).toEqual(["Rock"])
    })

    test("stores GeoJSON coordinates in [lng, lat] order", async () => {
        mockFetch(ticketmasterResponse())
        await fetchAndStoreEventsForCity("Manchester")

        const event = await Event.findOne({})
        expect(event.venue.location.type).toBe("Point")
        expect(event.venue.location.coordinates).toEqual([-2.244, 53.483])
    })

    test("skips events missing required fields", async () => {
        const response = ticketmasterResponse()
        response._embedded.events.push({
            id: "tm-broken",
            name: "Broken Event",
            // missing dates, venue, etc.
        })
        mockFetch(response)

        const result = await fetchAndStoreEventsForCity("Manchester")

        expect(result.skipped).toBe(1)
        expect(result.upserted).toBe(1) // only the good one
        const events = await Event.find({})
        expect(events).toHaveLength(1)
    })

    test("deduplicates on ticketmasterId across runs", async () => {
        mockFetch(ticketmasterResponse())
        await fetchAndStoreEventsForCity("Manchester")
        await fetchAndStoreEventsForCity("Manchester")

        const events = await Event.find({})
        expect(events).toHaveLength(1)
    })

    test("returns 0 fetched when API returns no events", async () => {
        mockFetch({ _embedded: undefined })

        const result = await fetchAndStoreEventsForCity("Atlantis")

        expect(result.fetched).toBe(0)
        expect(result.upserted).toBe(0)
    })

    test("throws on non-2xx API response", async () => {
        mockFetch({}, false)

        await expect(fetchAndStoreEventsForCity("Manchester")).rejects.toThrow(
            /Ticketmaster API error/
        )
    })
})
describe("ensureEventsForCity", () => {
    test("fetches when no cache entry exists", async () => {
        mockFetch(ticketmasterResponse())

        const result = await ensureEventsForCity("Manchester")

        expect(result.refreshed).toBe(true)
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test("creates a cache entry after successful fetch", async () => {
        mockFetch(ticketmasterResponse())

        await ensureEventsForCity("Manchester")

        const cache = await CityCache.findOne({ city: "Manchester" })
        expect(cache).not.toBeNull()
        expect(cache.lastRefreshed).toBeInstanceOf(Date)
    })

    test("skips fetch when cache is fresh", async () => {
        mockFetch(ticketmasterResponse())
        await ensureEventsForCity("Manchester") // first call — fetches
        global.fetch.mockClear()

        const result = await ensureEventsForCity("Manchester") // second call

        expect(result.refreshed).toBe(false)
        expect(global.fetch).not.toHaveBeenCalled()
    })

    test("re-fetches when cache is stale", async () => {
        mockFetch(ticketmasterResponse())
        await ensureEventsForCity("Manchester")

        // backdate the cache to 7 hours ago
        await CityCache.updateOne(
            { city: "Manchester" },
            { lastRefreshed: new Date(Date.now() - 7 * 60 * 60 * 1000) }
        )

        global.fetch.mockClear()
        const result = await ensureEventsForCity("Manchester")

        expect(result.refreshed).toBe(true)
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })
})