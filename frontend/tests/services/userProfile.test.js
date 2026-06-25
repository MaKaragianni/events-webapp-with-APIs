import createFetchMock from "vitest-fetch-mock";
import { describe, vi, expect, test } from "vitest";
import { getMyProfile } from "../../src/services/userProfile";
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
                    homeLocation: {
                        city: "Manchester",
                        lat: 53.483959,
                        long: -2.244644
                    } 
                }
                
            }
            fetch.mockResponseOnce(
                JSON.stringify( mockResponseBody ),
                { status: 200 },
            );

            const profileData = await getMyProfile();

            expect(profileData).toEqual(mockResponseBody)
            
        })
        test("throws error when status not 200", async () => {
            fetch.mockResponseOnce(
                JSON.stringify({ profile: { _id: "abc" } }),
                { status: 404 },
            );

            await expect(getMyProfile()).rejects.toThrow("Unable to fetch user's profile");
        })
    });
});