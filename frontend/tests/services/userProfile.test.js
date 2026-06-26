import createFetchMock from "vitest-fetch-mock";
import { describe, vi, expect, test } from "vitest";
import { getMyProfile, toggleSavedEvent } from "../../src/services/userProfile";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
createFetchMock(vi).enableMocks();

describe("userProfile services", () => {
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
});