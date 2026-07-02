const UserProfile = require("../models/userProfile")
const Event = require("../models/event")

// Helper to pick the best image from an event's images array for card display
function pickBestImage(images = []) {
    if (!images || images.length === 0) return null
    const targetRatio = 16 / 9
    const minWidth = 640
 
    const sixteenNine = images
        .filter(img => img.width && img.height && Math.abs(img.width / img.height - targetRatio) < 0.05)
        .sort((a, b) => a.width - b.width)
 
    const best = (
        sixteenNine.find(img => img.width >= minWidth) ??
        sixteenNine.at(-1) ??
        images.slice().sort((a, b) => (b.width || 0) - (a.width || 0))[0]
    )
 
    return best ? { url: best.url, width: best.width, height: best.height } : null
}

const getMyProfile = async (req, res) => {
    try {
        // find the userprofile by the auth id
        const profile = await UserProfile.findOne({ authUserId: req.user.id })

        //if no profile found
        if (!profile) {
            return res.status(404).json({ error: "User's profile not found" })
        }
        return res.json({ profile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

const toggleFavouriteArtists = async (req, res) => {
    try {
        // take artists of req body
        const { artist } = req.body

        // if no artists provided
        if (!artist) {
            return res.status(400).json({ error: "Artist is required" })
        }
        
        //1. find the current profile
        const profile = await UserProfile.findOne({ authUserId: req.user.id })

        const isFollowing = profile.favouriteArtists.includes(artist)

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { authUserId: req.user.id },
            // If already following, remove artist ($pull). If not following, add artist ($addToSet) 
            // $pull & $addToSet are MongoDB operators
            isFollowing ? { $pull: {favouriteArtists: artist}} : { $addToSet: {favouriteArtists: artist}},
            { new: true }
        )        
        return res.json({ profile: updatedProfile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

// Toggle save: if the event is already saved, remove it.
// If not saved yet, look up the event and embed a rich snapshot
// so the profile page can display images + metadata without extra queries.
const toggleSavedEvent = async (req, res) => {
    try {
        const { eventId } = req.body
 
        if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" })
        }
 
        const profile = await UserProfile.findOne({ authUserId: req.user.id })
 
        if (!profile) {
            return res.status(404).json({ error: "User's profile not found" })
        }
 
        const alreadySaved = profile.savedEvents.some(e => e.eventId === eventId)
 
        let updatedProfile
        if (alreadySaved) {
            // Remove the saved event snapshot
            updatedProfile = await UserProfile.findOneAndUpdate(
                { authUserId: req.user.id },
                { $pull: { savedEvents: { eventId } } },
                { new: true }
            )
        } else {
            // Fetch the full event to embed the rich snapshot
            const event = await Event.findById(eventId)
            if (!event) {
                return res.status(404).json({ error: "Event not found" })
            }
 
            const snapshot = {
                eventId:   event._id.toString(),
                name:      event.name,
                artist:    event.artist,
                date:      event.date,
                city:      event.city,
                venue:     event.venue?.name || "TBC",
                image:     pickBestImage(event.images),
                ticketUrl: event.ticketUrl || null,
                tags:      event.tags || [],
            }
 
            updatedProfile = await UserProfile.findOneAndUpdate(
                { authUserId: req.user.id },
                { $addToSet: { savedEvents: snapshot } },
                { new: true }
            )
        }
 
        return res.json({ profile: updatedProfile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

// Returns the user's saved event snapshots (no extra DB query needed).
const getSavedEvents = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ authUserId: req.user.id })
        if (!profile) {
            return res.status(404).json({ error: "User's profile not found" })
        }
 
        const now = new Date()
        const savedEvents = profile.savedEvents.map(e => ({
            ...e.toObject(),
            isPast: new Date(e.date) < now,
        }))
 
        return res.json({ savedEvents })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

const updateLocation = async (req, res) => {
    try {
        const { homeLocation } = req.body
        if (!homeLocation) {
            return res.status(400).json({ error: "User must provide a new location" })
        }
        const profile = await UserProfile.findOneAndUpdate(
            { authUserId: req.user.id },
            { homeLocation, hasSetHomeLocation: true },
            { new: true }
        )
        return res.json({ profile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}
/**
 * POST /profile/me/bookings
 * Adds an event ID to the user's bookings list (idempotent — won't add duplicates).
 * Body: { eventId: string }
 */
const addBooking = async (req, res) => {
    try {
        const { eventId } = req.body
 
        if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" })
        }
 
        const profile = await UserProfile.findOne({ authUserId: req.user.id })
 
        if (!profile) {
            return res.status(404).json({ error: "User's profile not found" })
        }
 
        // Prevent double-booking the same event
        if (profile.bookings.includes(eventId)) {
            return res.status(409).json({ error: "Event already booked" })
        }
 
        const updatedProfile = await UserProfile.findOneAndUpdate(
            { authUserId: req.user.id },
            { $addToSet: { bookings: eventId } },
            { new: true }
        )
 
        return res.status(201).json({ profile: updatedProfile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}
 
/**
 * GET /profile/me/bookings
 * Returns booking details (artist, venue, date, time) by looking up each event.
 */
const getMyBookings = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ authUserId: req.user.id })
 
        if (!profile) {
            return res.status(404).json({ error: "User's profile not found" })
        }
 
        if (!profile.bookings.length) {
            return res.json({ bookings: [] })
        }

        // Select name, artist, venue, date, time, images, ticketUrl
        const events = await Event.find({ _id: { $in: profile.bookings } })
            .select("name artist venue date time images ticketUrl tags city")
 
        // Preserve booking order and tag upcoming vs past
        const now = new Date()
        const bookings = profile.bookings.map((id) => {
            const event = events.find((e) => e._id.toString() === id)
            if (!event) return null
            return {
                _id: event._id,
                name: event.name,
                artist: event.artist,
                city: event.city,
                venue: event.venue?.name ?? event.venue ?? "",
                date: event.date,
                time: event.time,
                image: pickBestImage(event.images),
                ticketUrl: event.ticketUrl || null,
                tags: event.tags || [],
                isPast: new Date(event.date) < now,
            }
        }).filter(Boolean)
 
        return res.json({ bookings })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

const updateIsFirstLogin = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ authUserId: req.user.id })

        if (!profile) {
            return res.status(404).json({ error: "Could not update login session details - user not found" })
        }

        await UserProfile.findOneAndUpdate(
            { authUserId: req.user.id },
            { isFirstLogin: false },
            { new: true }
        )

        return res.status(204).json()
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Could not update login session details" })
    }
}

module.exports = {
    updateLocation,
    getMyProfile,
    toggleFavouriteArtists,
    toggleSavedEvent,
    getSavedEvents,
    addBooking,
    getMyBookings,
    updateIsFirstLogin,
}