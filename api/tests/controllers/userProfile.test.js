jest.mock("../../models/userProfile")
jest.mock("../../models/event")

const UserProfile = require("../../models/userProfile")
const Event = require("../../models/event")
const profileController = require("../../controllers/userProfile")

describe("profile controller", () => {
    let req, res

    // set up req and res for mocking http calls
    beforeEach(() => {
        req = {
            user: { id: "user-123" },
            body: {},
            params: {}
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        // Reset all mock methods before each test
        UserProfile.findOne.mockReset?.()
        UserProfile.findOneAndUpdate.mockReset?.()
        Event.find?.mockReset?.()
    })

    describe("getMyProfile", () => {
        test("returns the user's profile", async () => {
            // set up the profile
            const fakeProfile = {
                authUserId: "user-123",
                favouriteArtists: ["Idles"]
            }
            //1. Program the scenario — method findOne , result should = fakeProfile
            UserProfile.findOne.mockResolvedValue(fakeProfile)

            // 2. Run the controller
            await profileController.getMyProfile(req, res)
            
            // 3. Assert what happened

            //expect it was called with an authUserId
            expect(UserProfile.findOne).toHaveBeenCalledWith({ authUserId: "user-123" })
            //expect the response (res), to return the profile we asked for 
            expect(res.json).toHaveBeenCalledWith({ profile: fakeProfile })
        })
        test('should return 404 if no user profile is found', async () => {
            //1. Program the scenario — method fineOne -> given no authUserId to find with
            UserProfile.findOne.mockResolvedValue(null)
            // 2. Run the controller
            await profileController.getMyProfile(req, res)
            // res . status for code 
            expect(res.status).toHaveBeenCalledWith(404)
            // res.json for response object.
            expect(res.json).toHaveBeenCalledWith({ error: "User's profile not found" })
        });
    })
    
    describe('toggleFavouriteArtists', () => {
    test('adds artist to favourites if not already following', async () => {
        const existingProfile = {
            authUserId: "user-123",
            favouriteArtists: ["Beyonce"] // Idles not in here
        }
        const updatedProfile = {
            authUserId: "user-123",
            favouriteArtists: ["Beyonce", "Idles"] // Idles added
        }

        // mock findOne to return existing profile
        UserProfile.findOne.mockResolvedValue(existingProfile)
        // mock findOneAndUpdate to return updated profile
        UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)

        req.body = { artist: "Idles" }

        await profileController.toggleFavouriteArtists(req, res)

        expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
            { authUserId: "user-123" },
            { $addToSet: { favouriteArtists: "Idles" } },
            { new: true }
        )
        expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
    })

    test('removes artist from favourites if already following', async () => {
        const existingProfile = {
            authUserId: "user-123",
            favouriteArtists: ["Beyonce", "Idles"] // Idles already in here
        }
        const updatedProfile = {
            authUserId: "user-123",
            favouriteArtists: ["Beyonce"] // Idles removed
        }

        UserProfile.findOne.mockResolvedValue(existingProfile)
        UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)

        req.body = { artist: "Idles" }

        await profileController.toggleFavouriteArtists(req, res)

        expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
            { authUserId: "user-123" },
            { $pull: { favouriteArtists: "Idles" } },
            { new: true }
        )
        expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
    })

    test('returns 400 if no artist provided', async () => {
        req.body = {}

        await profileController.toggleFavouriteArtists(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: "Artist is required" })
    })
})

    describe("toggleSavedEvent", () => {
        test("saves an event if not already saved", async () => {
            const existingProfile = { authUserId: "user-123", savedEvents: [] }
            const updatedProfile  = { authUserId: "user-123", savedEvents: [{ eventId: "64b0c1a2e13f4c001d8b4567", name: "Test Show" }] }
            
            const fakeEvent = {
                _id: "64b0c1a2e13f4c001d8b4567",
                name: "Test Show",
                artist: "Test Artist",
                date: new Date(),
                city: "London",
                venue: { name: "O2 Arena" },
                images: [],
                tags: []
            }

            UserProfile.findOne.mockResolvedValue(existingProfile)
            Event.findById = jest.fn().mockResolvedValue(fakeEvent)
            UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)
            req.body = { eventId: "64b0c1a2e13f4c001d8b4567" }
 
            await profileController.toggleSavedEvent(req, res)
 
            expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
                { authUserId: "user-123" },
                {
                    $addToSet: {
                        savedEvents: expect.objectContaining({ eventId: "64b0c1a2e13f4c001d8b4567" })
                    }
                },    
                { new: true }
            )
            expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
        })
 
        test("removes a saved event if already saved", async () => {
            const existingProfile = { authUserId: "user-123", savedEvents: [{ eventId: "event-abc" }] }
            const updatedProfile  = { authUserId: "user-123", savedEvents: [] }
 
            UserProfile.findOne.mockResolvedValue(existingProfile)
            UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)
            req.body = { eventId: "event-abc" }
 
            await profileController.toggleSavedEvent(req, res)
 
            expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
                { authUserId: "user-123" },
                { $pull: { savedEvents: { eventId: "event-abc" } } },
                { new: true }
            )
            expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
        })
 
        test("returns 400 if no eventId provided", async () => {
            req.body = {}
 
            await profileController.toggleSavedEvent(req, res)
 
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" })
        })
 
        test("returns 404 if profile not found", async () => {
            UserProfile.findOne.mockResolvedValue(null)
            req.body = { eventId: "event-abc" }
 
            await profileController.toggleSavedEvent(req, res)
 
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ error: "User's profile not found" })
        })
    })

    describe('updateLocation', () => {
        test('should update the homeLocation object', async () => {
            //updated profile for testing
            const updatedProfile = {
                authUserId: "user-123",
                homeLocation: {
                    city: "London",
                    lat: 51.5072,
                    long: 0.1276
                },
                hasSetHomeLocation: true
            }

            //1. Program the scenario — "the DB has this profile for this user"

            // Translation: "Hey fake findOneAndUpdate — next time you're called, 
            //               return a promise that resolves to updatedProfile"
            UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)

            // set up req body for what the update will be.
            req.body = {
                homeLocation: {
                    city: "London",
                    lat: 51.5072,
                    long: 0.1276
                }
            }

            await profileController.updateLocation(req, res)
            // Internally, the controller does:
            //   const profile = await UserProfile.findOneAndUpdate(...)
            //   ^ this hits the fake, which gives back updatedProfile
            //   So profile === updatedProfile now

            // 3. Assert what the controller did with that data
            expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
                { authUserId: "user-123" },
                {
                    homeLocation: {
                        city: "London",
                        lat: 51.5072,
                        long: 0.1276
                    },
                    hasSetHomeLocation: true
                },
                { new: true })

            // Verify the controller responded with the updated profile
            expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
        });
        test('should return a 400 if the user does not provide a location to update', async () => {
            //updated profile for testing
            const updatedProfile = {
                authUserId: "user-123",
                homeLocation: {
                    city: "Manchester",
                    lat: 53.483959,
                    long: -2.244644
                }
            }
            UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)
            await profileController.updateLocation(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "User must provide a new location" })
        });
    });

    describe("addBooking", () => {
        test("adds event to bookings and returns 201 with updated profile", async () => {
            const existingProfile = { authUserId: "user-123", bookings: [] }
            const updatedProfile  = { authUserId: "user-123", bookings: ["event-abc"] }
 
            UserProfile.findOne.mockResolvedValue(existingProfile)
            UserProfile.findOneAndUpdate.mockResolvedValue(updatedProfile)
            req.body = { eventId: "event-abc" }
 
            await profileController.addBooking(req, res)
 
            expect(UserProfile.findOneAndUpdate).toHaveBeenCalledWith(
                { authUserId: "user-123" },
                { $addToSet: { bookings: "event-abc" } },
                { new: true }
            )
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith({ profile: updatedProfile })
        })
 
        test("returns 409 if event is already booked", async () => {
            const existingProfile = { authUserId: "user-123", bookings: ["event-abc"] }
            UserProfile.findOne.mockResolvedValue(existingProfile)
            req.body = { eventId: "event-abc" }
 
            await profileController.addBooking(req, res)
 
            expect(res.status).toHaveBeenCalledWith(409)
            expect(res.json).toHaveBeenCalledWith({ error: "Event already booked" })
            expect(UserProfile.findOneAndUpdate).not.toHaveBeenCalled()
        })
 
        test("returns 400 if no eventId provided", async () => {
            req.body = {}
            await profileController.addBooking(req, res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" })
        })
 
        test("returns 404 if profile not found", async () => {
            UserProfile.findOne.mockResolvedValue(null)
            req.body = { eventId: "event-abc" }
            await profileController.addBooking(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ error: "User's profile not found" })
        })
    })
  
    describe("getMyBookings", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days ahead
        const pastDate   = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
 
        test("returns booking details", async () => {
            const profile = { authUserId: "user-123", bookings: ["event-abc"] }
            const fakeEvents = [
                {
                    _id: { toString: () => "event-abc" },
                    name: "Test Show",
                    artist: "Test Artist",
                    venue: { name: "O2 Arena" },
                    date: futureDate,
                    time: "19:00",
                }
            ]
 
            UserProfile.findOne.mockResolvedValue(profile)
            Event.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(fakeEvents)
            })
 
            await profileController.getMyBookings(req, res)
 
            expect(res.json).toHaveBeenCalledWith({
                bookings: [
                    {
                        _id: fakeEvents[0]._id,
                        name: "Test Show",
                        artist: "Test Artist",
                        venue: "O2 Arena",
                        date: fakeEvents[0].date,
                        time: "19:00",
                        city: undefined,
                        image: null,
                        tags: [],
                        ticketUrl: null,
                        isPast: false
                    }
                ]
            })
        })
 
        test("returns empty array if no bookings", async () => {
            const profile = { authUserId: "user-123", bookings: [] }
            UserProfile.findOne.mockResolvedValue(profile)
 
            await profileController.getMyBookings(req, res)
 
            expect(res.json).toHaveBeenCalledWith({ bookings: [] })
        })
 
        test("marks past events with isPast: true", async () => {
            const profile = { authUserId: "user-123", bookings: ["event-old"] }
            const fakeEvents = [
                {
                    _id: { toString: () => "event-old" },
                    name: "Old Show",
                    artist: "Old Artist",
                    venue: { name: "Brixton Academy" },
                    date: pastDate,
                    time: "20:00",
                }
            ]
 
            UserProfile.findOne.mockResolvedValue(profile)
            Event.find = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(fakeEvents)
            })
 
            await profileController.getMyBookings(req, res)
 
            const result = res.json.mock.calls[0][0]
            expect(result.bookings[0].isPast).toBe(true)
        })
 
        test("returns 404 if profile not found", async () => {
            UserProfile.findOne.mockResolvedValue(null)
            await profileController.getMyBookings(req, res)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith({ error: "User's profile not found" })
        })
    })
    describe("updateIsFirstLogin", () => {
        test("returns 204 when successful", async () => {
            const profile = { authUserId: "user-123" };
            UserProfile.findOne.mockResolvedValue(profile);
            UserProfile.findOneAndUpdate.mockResolvedValue(profile);

            await profileController.updateIsFirstLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
        })
        test("returns 404 if profile not found", async () => {
            UserProfile.findOne.mockResolvedValue(null);

            await profileController.updateIsFirstLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Could not update login session details - user not found" });
        })
    })
})