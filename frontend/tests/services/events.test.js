import { describe, test, expect, beforeEach, vi } from "vitest"
import { getEventById, getEvents, getSingleEvent } from "../../src/services/events"

global.fetch = vi.fn()

const fakeEvents = [
    { name: "Arctic Monkeys Live", city: "Manchester" },
    { name: "Coldplay Live", city: "London" }
]

// Helper to mock fetch response
const mockFetch = (data, ok = true) => {
    fetch.mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data)
    })
}

describe("events service", () => {
    beforeEach(() => fetch.mockReset())

    describe("getEvents", () => {
    test("fetches events with no filters", async () => {
        mockFetch({ events: fakeEvents })
        await getEvents()
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/events"),
        { credentials: "include" }
        )
    })

    test("sends city filter", async () => {
        mockFetch({ events: fakeEvents })
        await getEvents({ city: "Manchester" })
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("city=Manchester"),
        { credentials: "include" }
        )
    })

    test("sends artist filter", async () => {
        mockFetch({ events: fakeEvents })
        await getEvents({ artist: "Coldplay" })
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("artist=Coldplay"),
        { credentials: "include" }
        )
    })

    test("sends date range filters", async () => {
        mockFetch({ events: fakeEvents })
        await getEvents({ from: "2025-08-01", to: "2025-12-31" })
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("from=2025-08-01"),
        { credentials: "include" }
        )
    })

    test("removes empty filters", async () => {
        mockFetch({ events: fakeEvents })
        await getEvents({ city: "Manchester", artist: "" })
        expect(fetch).toHaveBeenCalledWith(
        expect.not.stringContaining("artist="),
        { credentials: "include" }
        )
    })

    test("returns events from response", async () => {
        mockFetch({ events: fakeEvents })
        const result = await getEvents({ city: "Manchester" })
        expect(result).toEqual({ events: fakeEvents })
    })

    test("throws error if response not ok", async () => {
        mockFetch({}, false)
        await expect(getEvents()).rejects.toThrow("Failed to fetch events")
    })
    })

    // get single event tests
    describe("getEventById", () => {
    test("fetches event by id", async () => {
        mockFetch({ event: fakeEvents[0] })
        const result = await getEventById("123")
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/events/123"),
        { credentials: "include" }
        )
        expect(result).toEqual({ event: fakeEvents[0] })
    })

    test("throws if event not found", async () => {
        mockFetch({}, false)
        await expect(getEventById("123")).rejects.toThrow("Failed to fetch event")
    })
    })
})