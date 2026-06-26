const mongoose = require("mongoose")

const UserProfileSchema = new mongoose.Schema({
    authUserId: {
        type: String,
        required: true,
        unique: true,
    },
    favouriteArtists: { type: [String], default: [] },
    savedEvents: { type: [String], default: [] }, 
    homeLocation: {
        city: { type: String, default: "Manchester" },
        lat: { type: Number, default: 53.483959},
        long: { type: Number, default: -2.244644},
    },
    bookings: { type: [String], default: [] },
})

const UserProfile = mongoose.model("UserProfile", UserProfileSchema)

module.exports = UserProfile