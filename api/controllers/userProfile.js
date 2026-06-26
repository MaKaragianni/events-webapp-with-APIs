const UserProfile = require("../models/userProfile")

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
 
        const isSaved = profile.savedEvents.includes(eventId)
 
        const updatedProfile = await UserProfile.findOneAndUpdate(
            { authUserId: req.user.id },
            isSaved
                ? { $pull: { savedEvents: eventId } }
                : { $addToSet: { savedEvents: eventId } },
            { new: true }
        )
 
        return res.json({ profile: updatedProfile })
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
            { homeLocation },
            { new: true }
        )
        return res.json({ profile })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Something went wrong" })
    }
}

module.exports = { updateLocation, getMyProfile, toggleFavouriteArtists, toggleSavedEvent }