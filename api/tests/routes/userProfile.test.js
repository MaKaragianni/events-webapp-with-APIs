const request = require("supertest");
const mongoose = require("mongoose");

// Mocking better-auth/node so Jest doesn't throw a SyntaxError
jest.mock("better-auth/node", () => ({
    toNodeHandler: jest.fn(() => (req, res, next) => {
        if (next) next();
    }),
    fromNodeHeaders: jest.fn((headers) => headers)
}));

// Mocking internal auth library to provide a fake authenticated session for middleware
jest.mock("../../lib/auth", () => ({
    auth: {
        api: {
            getSession: jest.fn().mockResolvedValue({
                user: {
                    id: "fakeUserId",
                    email: "test@example.com"
                }
            })
        }
    }
}));

const app = require("../../app");
const userProfile = require("../../models/userProfile");
const Event = require("../../models/event");
const { auth } = require("../../lib/auth"); 

require("../mongodb_helper");

function createFakeUserProfile(overrides = {}) {
    return {
        authUserId: "fakeUserId",
        favouriteArtists: ["Beyonce", "Mariah Carey"],
        homeLocation: {
            city: "London",
            lat: 51.5072,
            long: 0.1276
        },
        ...overrides,
    };
}

async function createFakeEvent(overrides = {}) {
    return Event.create({
        name: "Test Show",
        artist: "Test Artist",
        city: "London",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days ahead
        time: "19:00",
        venue: { name: "O2 Arena" },
        ...overrides,
    });
}

beforeEach(async () => {
    await userProfile.deleteMany({});
    await Event.deleteMany({});
});

describe("GET /profile/me", () => {
    
    test("should return 200 and user information", async () => {
        // Create and save a profile to the db with matching ID
        const fakeProfile = createFakeUserProfile();
        await userProfile.create(fakeProfile);

        const response = await request(app)
            .get("/profile/me");

        expect(response.status).toBe(200);
        expect(response.body.profile.authUserId).toBe("fakeUserId");
        expect(response.body.profile.homeLocation).toEqual({
            city: "London",
            lat: 51.5072,
            long: 0.1276
        });
        expect(response.body.profile.favouriteArtists).toEqual(["Beyonce", "Mariah Carey"]);
        expect(response.body.profile.savedEvents).toEqual([]);
    });

    test("should return 401 if user is not authenticated", async () => {
        // Mock getSession to return no session
        auth.api.getSession.mockResolvedValueOnce(null);

        const response = await request(app)
            .get("/profile/me");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});

describe("PUT /profile/me/location", () => {
    test("should update user location and return 200", async () => {
        const fakeProfile = createFakeUserProfile();
        await userProfile.create(fakeProfile);

        const newLocation = {
            city: "Manchester",
            lat: 53.4808,
            long: -2.2426
        };

        const response = await request(app)
            .put("/profile/me/location")
            .send({ homeLocation: newLocation });

        expect(response.status).toBe(200);
        expect(response.body.profile.homeLocation).toEqual(newLocation);
    });

    test("should return 400 if homeLocation is missing", async () => {
        const fakeProfile = createFakeUserProfile();
        await userProfile.create(fakeProfile);

        const response = await request(app)
            .put("/profile/me/location")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("User must provide a new location");
    });

    test("should return 401 if user is not authenticated", async () => {
        auth.api.getSession.mockResolvedValueOnce(null);

        const response = await request(app)
            .put("/profile/me/location")
            .send({ homeLocation: { city: "Manchester", lat: 53.4808, long: -2.2426 } });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});

describe("PUT /profile/me/favourite-artists", () => {
    test("should update user favourite artists and return 200", async () => {
        await userProfile.create(createFakeUserProfile());

        const response = await request(app)
            .put("/profile/me/favourite-artists")
            .send({ artist: "Taylor Swift" });

        expect(response.status).toBe(200);
        expect(response.body.profile.favouriteArtists).toContain("Taylor Swift");
    });

    test("should return 400 if artist is missing", async () => {
        await userProfile.create(createFakeUserProfile());

        const response = await request(app)
            .put("/profile/me/favourite-artists")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Artist is required");
    });

    test("should return 401 if user is not authenticated", async () => {
        auth.api.getSession.mockResolvedValueOnce(null);

        const response = await request(app)
            .put("/profile/me/favourite-artists")
            .send({ artists: ["Taylor Swift", "Kendrick Lamar"] });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});

describe("PUT /profile/me/saved-events", () => {
    test("should save an event and return 200 with updated savedEvents", async () => {
        const fakeEvent = await createFakeEvent();
        await userProfile.create(createFakeUserProfile());
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({ eventId: fakeEvent._id.toString() });
 
        expect(response.status).toBe(200);
    });
 
    test("should remove an already-saved event (toggle off)", async () => {
        await userProfile.create(createFakeUserProfile({
            savedEvents: [
                {
                    eventId: "event-abc",
                    name: "Test Show",
                    artist: "Test Artist",
                    city: "London",
                    date: new Date(),
                    venue: "O2 Arena",
                    tags: []
                }
            ]
        }));
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({ eventId: "event-abc" });
 
        expect(response.status).toBe(200);
        expect(response.body.profile.savedEvents).toEqual([]);
    });
 
    test("should return 400 if eventId is missing", async () => {
        await userProfile.create(createFakeUserProfile());
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({});
 
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Event ID is required");
    });
 
    test("should return 401 if user is not authenticated", async () => {
        auth.api.getSession.mockResolvedValueOnce(null);
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({ eventId: "event-abc" });
 
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});

describe("POST /profile/me/bookings", () => {
    test("should add a booking and return 201 with updated bookings list", async () => {
        await userProfile.create(createFakeUserProfile({ bookings: [] }));
        const fakeEvent = await createFakeEvent();
 
        const response = await request(app)
            .post("/profile/me/bookings")
            .send({ eventId: fakeEvent._id.toString() });
 
        expect(response.status).toBe(201);
        expect(response.body.profile.bookings).toContain(fakeEvent._id.toString());
    });
 
    test("should return 409 if event is already booked", async () => {
        const fakeEvent = await createFakeEvent();
        await userProfile.create(createFakeUserProfile({ bookings: [fakeEvent._id.toString()] }));
 
        const response = await request(app)
            .post("/profile/me/bookings")
            .send({ eventId: fakeEvent._id.toString() });
 
        expect(response.status).toBe(409);
        expect(response.body.error).toBe("Event already booked");
    });
 
    test("should return 400 if eventId is missing", async () => {
        await userProfile.create(createFakeUserProfile({ bookings: [] }));
 
        const response = await request(app)
            .post("/profile/me/bookings")
            .send({});
 
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Event ID is required");
    });
 
    test("should return 401 if user is not authenticated", async () => {
        auth.api.getSession.mockResolvedValueOnce(null);
 
        const response = await request(app)
            .post("/profile/me/bookings")
            .send({ eventId: "some-event-id" });
 
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});
  
describe("GET /profile/me/bookings", () => {
    test("should return enriched booking details", async () => {
        const fakeEvent = await createFakeEvent();
        await userProfile.create(createFakeUserProfile({ bookings: [fakeEvent._id.toString()] }));
 
        const response = await request(app).get("/profile/me/bookings");
 
        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(1);
        const booking = response.body.bookings[0];
        expect(booking.artist).toBe("Test Artist");
        expect(booking.venue).toBe("O2 Arena");
        expect(booking.name).toBe("Test Show");
        expect(booking.isPast).toBe(false);
    });
 
    test("should return empty array if no bookings", async () => {
        await userProfile.create(createFakeUserProfile({ bookings: [] }));
 
        const response = await request(app).get("/profile/me/bookings");
 
        expect(response.status).toBe(200);
        expect(response.body.bookings).toEqual([]);
    });
 
    test("should return 401 if user is not authenticated", async () => {
        auth.api.getSession.mockResolvedValueOnce(null);
 
        const response = await request(app).get("/profile/me/bookings");
 
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Not authenticated");
    });
});
