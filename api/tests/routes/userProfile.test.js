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

beforeEach(async () => {
    await userProfile.deleteMany({});
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
        await userProfile.create(createFakeUserProfile({ savedEvents: [] }));
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({ eventId: "event-abc" });
 
        expect(response.status).toBe(200);
        expect(response.body.profile.savedEvents).toContain("event-abc");
    });
 
    test("should remove an already-saved event (toggle off)", async () => {
        await userProfile.create(createFakeUserProfile({ savedEvents: ["event-abc"] }));
 
        const response = await request(app)
            .put("/profile/me/saved-events")
            .send({ eventId: "event-abc" });
 
        expect(response.status).toBe(200);
        expect(response.body.profile.savedEvents).not.toContain("event-abc");
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