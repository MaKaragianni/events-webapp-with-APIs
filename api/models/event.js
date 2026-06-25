const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    artist: { type: String, required: true },
    tags: { type: [String], default: [] },
    date: { type: Date, required: true },
    time: { type: String },
    city: { type: String, required: true },
    venue: {
        name: String,
        address: String,
        postcode: String,
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: undefined, // prevents empty array being saved
            },
        },
    },
    images: [{
        url: { type: String, required: true },
        width: Number,
        height: Number,
    }],
    description: { type: String },
    ticketUrl: { type: String },
    ticketmasterId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

eventSchema.index({ date: 1 })
eventSchema.index({ city: 1, date: 1 })
eventSchema.index({ tags: 1 })
eventSchema.index({ "venue.location": "2dsphere" })

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;