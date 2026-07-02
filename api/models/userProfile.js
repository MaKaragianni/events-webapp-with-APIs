const mongoose = require("mongoose")

const savedEventSchema = new mongoose.Schema({
    eventId:  { type: String, required: true },
    name:     { type: String, required: true },
    artist:   { type: String, required: true },
    date:     { type: Date,   required: true },
    city:     { type: String, required: true },
    venue:    { type: String, default: "TBC" },
    image:    {
        url:    { type: String },
        width:  { type: Number },
        height: { type: Number },
    },
    ticketUrl: { type: String },
    tags:     { type: [String], default: [] },
}, { _id: false })

const UserProfileSchema = new mongoose.Schema({
    authUserId: {
        type: String,
        required: true,
        unique: true,
    },
    isFirstLogin: {type: Boolean, default: true},
    // Tracks whether the user has ever explicitly chosen a home location
    // (either at signup or afterwards), as opposed to still sitting on the
    // "Manchester" placeholder default below. Used to decide whether the
    // "set your home city" pop-up should be shown.
    hasSetHomeLocation: { type: Boolean, default: false },
    favouriteArtists: { type: [String], default: [] },
    savedEvents: { type: [savedEventSchema], default: [] }, 
    homeLocation: {
        city: { type: String, default: "Manchester" },
        lat: { type: Number, default: 53.483959},
        long: { type: Number, default: -2.244644},
    },
    bookings: { type: [String], default: [] },
})

const UserProfile = mongoose.model("UserProfile", UserProfileSchema)

module.exports = UserProfile