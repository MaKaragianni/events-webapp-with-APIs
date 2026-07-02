import createFetchMock from "vitest-fetch-mock";
import { describe, vi, expect, test } from "vitest";
import {
    getMyProfile,
    toggleSavedEvent,
    addBooking,
    getMyBookings,
    updateHomeLocation,
    updateIsFirstLogin,
} from "../../src/services/userProfile";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
createFetchMock(vi).enableMocks();

describe("userProfile services", () => {
    beforeEach(() => {
        fetch.resetMocks();
    });

    describe("getMyProfile", () => {
        test("fetches /me with credentials", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ profile: { _id: "abc" } }),
                { status: 200 },
            );

            await getMyProfile();

            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me`);
            expect(options.method).toEqual("GET");
            expect(options.credentials).toEqual("include");
        });

        test("returns user profile data on 200", async () => {
            const mockResponseBody = {
                profile: {
                    authUserId: "abc",
                    favouriteArtists: [],
                    savedEvents: [],
                    homeLocation: {
                        city: "Manchester",
                        lat: 53.483959,
                        long: -2.244644
                    }
                }
            };
            fetch.mockResponseOnce(JSON.stringify(mockResponseBody), { status: 200 });

            const profileData = await getMyProfile();

            expect(profileData).toEqual(mockResponseBody);
        });

        test("throws error when status not 200", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ profile: { _id: "abc" } }),
                { status: 404 },
            );

            await expect(getMyProfile()).rejects.toThrow("Unable to fetch user's profile");
        });
    });

    describe("toggleSavedEvent", () => {
        test("sends PUT to /profile/me/saved-events with eventId", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ profile: { savedEvents: ["event-abc"] } }),
                { status: 200 }
            );

            await toggleSavedEvent("event-abc");

            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me/saved-events`);
            expect(options.method).toEqual("PUT");
            expect(options.credentials).toEqual("include");
            expect(JSON.parse(options.body)).toEqual({ eventId: "event-abc" });
        });

        test("returns updated profile data on 200", async () => {
            const mockResponse = { profile: { savedEvents: ["event-abc"] } };
            fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

            const result = await toggleSavedEvent("event-abc");

            expect(result).toEqual(mockResponse);
        });

        test("throws error when status not 200", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ error: "Something went wrong" }),
                { status: 500 }
            );

            await expect(toggleSavedEvent("event-abc")).rejects.toThrow("Unable to toggle saved event");
        });
    });

    describe("addBooking", () => {
        test("sends POST to /profile/me/bookings with eventId", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ profile: { bookings: ["event-abc"] } }),
                { status: 201 }
            );
 
            await addBooking("event-abc");
 
            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me/bookings`);
            expect(options.method).toEqual("POST");
            expect(options.credentials).toEqual("include");
            expect(JSON.parse(options.body)).toEqual({ eventId: "event-abc" });
        });
 
        test("returns updated profile data on 201", async () => {
            const mockResponse = { profile: { bookings: ["event-abc"] } };
            fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 201 });
            const result = await addBooking("event-abc");
            expect(result).toEqual(mockResponse);
        });
 
        test("throws 'already_booked' error on 409", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ error: "Event already booked" }),
                { status: 409 }
            );
            await expect(addBooking("event-abc")).rejects.toThrow("already_booked");
        });
 
        test("throws generic error on other failure status", async () => {
            fetch.mockResponseOnce(JSON.stringify({ error: "Server error" }), { status: 500 });
            await expect(addBooking("event-abc")).rejects.toThrow("Unable to add booking");
        });
    });
  
    describe("updateHomeLocation", () => {
        test("sends PUT to /profile/me/location with the homeLocation payload", async () => {
            const mockResponse = {
                profile: { homeLocation: { city: "Bristol", lat: 51.4545, long: -2.5879 } },
            };
            fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

            await updateHomeLocation({ city: "Bristol", lat: 51.4545, long: -2.5879 });

            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me/location`);
            expect(options.method).toEqual("PUT");
            expect(options.credentials).toEqual("include");
            expect(JSON.parse(options.body)).toEqual({
                homeLocation: { city: "Bristol", lat: 51.4545, long: -2.5879 },
            });
        });

        test("returns just the updated city on 200", async () => {
            const mockResponse = {
                profile: { homeLocation: { city: "Bristol", lat: 51.4545, long: -2.5879 } },
            };
            fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

            const result = await updateHomeLocation({ city: "Bristol", lat: 51.4545, long: -2.5879 });

            expect(result).toEqual("Bristol");
        });

        test("throws error when status not 200", async () => {
            fetch.mockResponseOnce(JSON.stringify({ error: "Something went wrong" }), { status: 500 });

            await expect(
                updateHomeLocation({ city: "Bristol", lat: 51.4545, long: -2.5879 })
            ).rejects.toThrow("Unable to update your home location");
        });
    });

    describe("updateIsFirstLogin", () => {
        test("sends PUT to /profile/me/complete-first-login with credentials", async () => {
            fetch.mockResponseOnce(null, { status: 204 });

            await updateIsFirstLogin();

            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me/complete-first-login`);
            expect(options.method).toEqual("PUT");
            expect(options.credentials).toEqual("include");
        });

        test("throws error when status not 204", async () => {
            fetch.mockResponseOnce(JSON.stringify({ error: "Something went wrong" }), { status: 500 });

            await expect(updateIsFirstLogin()).rejects.toThrow("Unable to update session info");
        });
    });

    describe("getMyBookings", () => {
        test("sends GET to /profile/me/bookings with credentials", async () => {
            fetch.mockResponseOnce(JSON.stringify({ bookings: [] }), { status: 200 });
            await getMyBookings();
            const [url, options] = fetch.mock.lastCall;
            expect(url).toEqual(`${BACKEND_URL}/profile/me/bookings`);
            expect(options.method).toEqual("GET");
            expect(options.credentials).toEqual("include");
        });
 
        test("returns enriched bookings on 200", async () => {
            const mockResponse = {
                bookings: [
                    {
                        _id: "event-abc",
                        name: "Test Show",
                        artist: "Test Artist",
                        venue: "O2 Arena",
                        date: "2026-08-01T19:00:00.000Z",
                        time: "19:00",
                        isPast: false
                    }
                ]
            };
            fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });
            const result = await getMyBookings();
            expect(result).toEqual(mockResponse);
        });
 
        test("throws error when status not 200", async () => {
            fetch.mockResponseOnce(JSON.stringify({ error: "Not found" }), { status: 404 });
            await expect(getMyBookings()).rejects.toThrow("Unable to fetch bookings");
        });
    });
});