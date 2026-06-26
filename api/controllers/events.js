const Event = require("../models/event");
const { ensureEventsForCity } = require("../services/ticketmaster")
const CityCache = require("../models/cityCache");

const getCities = async (req, res) => {
    try {
        const cities = await CityCache.find({}).sort({ city: 1 });
        res.status(200).json({ cities: cities.map((c) => c.city) });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch cities" });
    }
};

const getEvents = async (req, res) => {
    try {
        // query parameters 
        const { city, from, to } = req.query
        // if there is a city given
        if (city) {
            try {
                // run cache check
                await ensureEventsForCity(city)
            } catch (err) {
                console.warn("Refresh failed, serving cached data:", err.message)
            }
        }

        // filtering set up
        const filter = {}
        if (city) filter.city = city
        if (from || to) {
            filter.date = {}
            if (from) filter.date.$gte = new Date(from)
            if (to) {
                const endOfDay = new Date(to)
                endOfDay.setHours(23, 59, 59, 999)
                filter.date.$lte = endOfDay
            }
        }
        // find the events with matches
        const events = await Event.find(filter).sort({ date: 1 })
        return res.status(200).json({ events })
    } catch (err) {
        console.error("getEvents error:", err)
        return res.status(500).json({ error: "Failed to fetch events" })
    }
}

// GET /events/:id
// Returns a signle event by its MongoDB _id
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(200).json({ event: event });
    } catch (err) {
        console.error("getEventById error:", err);
        // Mongoose throws a CastError (meaning failed to convert/cast a value) if the id string is not a valid ObjectId
        if (err.name === "CastError") {
            return res.status(400).json({ error: "Invalid event ID" });
        }
        res.status(500).json({ error: "Failed to fetch event" });
    }
};

module.exports = { getEvents, getEventById, getCities }