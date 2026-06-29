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