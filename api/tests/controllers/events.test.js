jest.mock("../../models/event")
jest.mock("../../services/ticketmaster", () => ({
    ensureEventsForCity: jest.fn().mockResolvedValue({ refreshed: false }),
}))

const Event = require("../../models/event")
const { ensureEventsForCity } = require("../../services/ticketmaster")
const { getEvents, getEventById } = require("../../controllers/events")

// Fake events shaped to match the current Event schema (tags, not genre)
const fakeEvents = [
    {
        _id: "event-id-1",
        name: "Coldplay Live",
        artist: "Coldplay",
        city: "Manchester",
        date: new Date("2026-08-01"),
        tags: ["Britpop", "Rock"],
    },
    {
        _id: "event-id-2",
        name: "The Cure Live",
        artist: "The Cure",
        city: "London",
        date: new Date("2026-10-01"),
        tags: ["Rock", "Post-Punk"],
    },
]

// Helper to build req/res mocks for each test
function makeReqRes(query = {}, params = {}) {
    const req = { query, params }
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    }
    return { req, res }
}

// Helper to mock Event.find().sort() chain
function mockFind(returnValue) {
    Event.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(returnValue),
    })
}

describe("getEvents", () => {
    beforeAll(() => {
        jest.spyOn(console, "warn").mockImplementation(() => { })
        jest.spyOn(console, "error").mockImplementation(() => { })
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })
    beforeEach(() => {
        jest.clearAllMocks()
        // Default mock — tests can override
        ensureEventsForCity.mockResolvedValue({ refreshed: false })
    })

    test("returns 200 and events for the requested city", async () => {
        mockFind([fakeEvents[0]])

        const { req, res } = makeReqRes({ city: "Manchester" })
        await getEvents(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ events: [fakeEvents[0]] })
    })

    test("calls ensureEventsForCity with the requested city", async () => {
        mockFind([fakeEvents[0]])

        const { req, res } = makeReqRes({ city: "Manchester" })
        await getEvents(req, res)

        expect(ensureEventsForCity).toHaveBeenCalledWith("Manchester")
        expect(ensureEventsForCity).toHaveBeenCalledTimes(1)
    })

    test("still returns events if ensureEventsForCity throws", async () => {
        ensureEventsForCity.mockRejectedValueOnce(new Error("Ticketmaster down"))
        mockFind([fakeEvents[0]])

        const { req, res } = makeReqRes({ city: "Manchester" })
        await getEvents(req, res)

        // Refresh failed, but we still serve cached data
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ events: [fakeEvents[0]] })
    })

    test("passes a city filter when city query param is provided", async () => {
        mockFind([fakeEvents[0]])

        const { req, res } = makeReqRes({ city: "Manchester" })
        await getEvents(req, res)

        const filterArg = Event.find.mock.calls[0][0]
        expect(filterArg.city).toBe("Manchester")
    })

    test("passes a date range filter when from and to are provided", async () => {
        mockFind(fakeEvents)

        const { req, res } = makeReqRes({
            city: "Manchester",
            from: "2026-08-01",
            to: "2026-10-01",
        })
        await getEvents(req, res)

        const filterArg = Event.find.mock.calls[0][0]
        expect(filterArg.date.$gte).toEqual(new Date("2026-08-01"))
        expect(filterArg.date.$lte).toBeDefined()
        // If you added the end-of-day fix, $lte will be later than midnight
        expect(filterArg.date.$lte.getTime()).toBeGreaterThanOrEqual(
            new Date("2026-10-01").getTime()
        )
    })

    test("passes only $gte when only from is provided", async () => {
        mockFind(fakeEvents)

        const { req, res } = makeReqRes({ city: "Manchester", from: "2026-08-01" })
        await getEvents(req, res)

        const filterArg = Event.find.mock.calls[0][0]
        expect(filterArg.date.$gte).toBeDefined()
        expect(filterArg.date.$lte).toBeUndefined()
    })

    test("passes only $lte when only to is provided", async () => {
        mockFind(fakeEvents)

        const { req, res } = makeReqRes({ city: "Manchester", to: "2026-10-01" })
        await getEvents(req, res)

        const filterArg = Event.find.mock.calls[0][0]
        expect(filterArg.date.$gte).toBeUndefined()
        expect(filterArg.date.$lte).toBeDefined()
    })

    test("returns 500 when the database throws", async () => {
        Event.find.mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error("DB connection lost")),
        })

        const { req, res } = makeReqRes({ city: "Manchester" })
        await getEvents(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch events" })
    })
})

describe("getEventById", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("returns 200 and the event when found", async () => {
        Event.findById.mockResolvedValue(fakeEvents[0])

        const { req, res } = makeReqRes({}, { id: "event-id-1" })
        await getEventById(req, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ events: fakeEvents[0] })
    })

    test("returns 404 when no event matches the id", async () => {
        Event.findById.mockResolvedValue(null)

        const { req, res } = makeReqRes({}, { id: "non-existent-id" })
        await getEventById(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ error: "Event not found" })
    })

    test("returns 400 when the id is not a valid ObjectId", async () => {
        const castError = new Error("Cast to ObjectId failed")
        castError.name = "CastError"
        Event.findById.mockRejectedValue(castError)

        const { req, res } = makeReqRes({}, { id: "not-an-objectId" })
        await getEventById(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid event ID" })
    })

    test("returns 500 when the database throws an unexpected error", async () => {
        Event.findById.mockRejectedValue(new Error("Unexpected DB error"))

        const { req, res } = makeReqRes({}, { id: "event-id-1" })
        await getEventById(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch event" })
    })
})