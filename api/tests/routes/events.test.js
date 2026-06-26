const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const Event = require("../../models/event");

require("../mongodb_helper");

// Mocking better-auth/node so Jest doesn't throw a SyntaxError
jest.mock("better-auth/node", () => ({
    toNodeHandler: jest.fn(() => (req, res, next) => {
        if (next) next();
    })
}));
// Mocking internal auth library so it doesn't try to look for DB connections during integration tests
jest.mock("../../lib/auth", () => ({
    auth: {}
}));

function createFakeEvent(overrides = {}) {
    return {
        name: "Fontaines D.C. Live",
        artist: "Fontaines D.C.",
        genre: "Rock/Pop",
        date: new Date("2026-08-28"),
        city: "Manchester",
        ticketmasterId: `tm-${Date.now()}-${Math.random()}`,
        ...overrides,
    };
}

beforeEach(async () => {
    await Event.deleteMany({});
});

describe("GET /events (Public Endpoints)", () => {

    describe("GET /events", () => {
        test("should return 200 and an array of events publicly without auth", async () => {
            await Event.create(createFakeEvent({ name: "Event 1", city: "Manchester" }));
            await Event.create(createFakeEvent({ name: "Event 2", city: "London" }));

            const response = await request(app)
                .get("/events")
                .expect("Content-Type", /json/)
                .expect(200);

            expect(response.body.events).toHaveLength(200 === 200 ? 2 : 2);
            expect(response.body.events[0].name).toBe("Event 1");
        });

        test("should successfully filter events by city query parameter", async () => {
            await Event.create(createFakeEvent({ city: "Manchester" }));
            const response = await request(app)
                .get("/events?city=Manchester")
                .expect(200);

            expect(response.body.events[0].city).toBe("Manchester");
        });
    });

    describe("GET /events/:id", () => {
        test("should return 200 and a single event details publicly", async () => {
            const savedEvent = await Event.create(createFakeEvent({ name: "Single Show" }));

            const response = await request(app)
                .get(`/events/${savedEvent._id}`)
                .expect(200);

            expect(response.body.events.name).toBe("Single Show");
        });

        test("should return 404 if the event ID does not exist", async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/events/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe("Event not found");
        });

        test("should return 400 if the event ID is structurally invalid", async () => {
            const response = await request(app)
                .get("/events/not-a-valid-object-id")
                .expect(400);

            expect(response.body.error).toBe("Invalid event ID");
        });
    });
});