const mongoose = require("mongoose");
const Event = require("../../models/event");
const CityCache = require("../../models/cityCache")
require("../mongodb_helper");

function validEvent(overrides = {}) {
    return {
        name: "Fontaines D.C. Live",
        artist: "Fontaines D.C.",
        tags: ["Rock", "Indie Rock"],
        date: new Date("2026-08-28"),
        time: "09:30",
        city: "Manchester",
        venue: {
            name: "Richfield Avenue",
            address: "123 Test St",
            postcode: "M1 1AA",
            location: {
                type: "Point",
                coordinates: [-2.244, 53.483],
            },
        },
        images: [
            { url: "https://example.com/image.jpg", ratio: "16_9", width: 1024, height: 576 },
        ],
        ticketUrl: "https://ticketmaster.com/event/123",
        ticketmasterId: `tm-${Date.now()}-${Math.random()}`,
        ...overrides,
    }
}

beforeEach(async () => {
    await Event.deleteMany({});
    await CityCache.deleteMany({})
});
describe("Event model", () => {

    describe("valid event", () => {
        test("saves successfully all fields", async () => {
            const event = new Event(validEvent());
            const saved = await event.save();
            expect(saved._id).toBeDefined()
            expect(saved.name).toBe("Fontaines D.C. Live")
            expect(saved.artist).toBe("Fontaines D.C.")
            expect(saved.city).toBe("Manchester")
            expect(saved.tags).toEqual(["Rock", "Indie Rock"])
            expect(saved.venue.name).toBe("Richfield Avenue")
            expect(saved.venue.location.coordinates).toEqual([-2.244, 53.483])
            expect(saved.images).toHaveLength(1)
        });
        test("adds createdAt and updatedAt timestamps automatically", async () => {
            const event = new Event(validEvent());
            const saved = await event.save();

            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
        test("defaults tags to an empty array when not provided", async () => {
            const event = new Event(validEvent({ tags: undefined }))
            const saved = await event.save()
            expect(saved.tags).toEqual([])
        })
        test("adds createdAt and updatedAt timestamps automatically", async () => {
            const event = new Event(validEvent())
            const saved = await event.save()
            expect(saved.createdAt).toBeDefined()
            expect(saved.updatedAt).toBeDefined()
        })
    });

    // fails without name / artist / city / genre / date (in one describe block)
    describe("required field validation", () => {
        test("fails wihtout name", async () => {
            const event = new Event(validEvent({ name: undefined }));
            // Expecting the promise to be rejected and throw an error:
            // name: checks the word "name" is in the error
            // .*: means any characters in between
            // required: checks that the word "required" is in the message
            // /i: makes the search case-insensitive
            await expect(event.save()).rejects.toThrow(/name.*required/i);
        });
        test("fails without artist", async () => {
            const event = new Event(validEvent({ artist: undefined }));
            await expect(event.save()).rejects.toThrow(/artist.*required/i);
        });
        test("fails without city", async () => {
            const event = new Event(validEvent({ city: undefined }));
            await expect(event.save()).rejects.toThrow(/city.*required/i);
        });
        test("fails without date", async () => {
            const event = new Event(validEvent({ date: undefined }));
            await expect(event.save()).rejects.toThrow(/date.*required/i);
        });
    });
    // test ticketmaster id is unique
    describe("ticketmasterId uniqueness", () => {
        test("rejects a duplicate ticketmasterId", async () => {
            const sharedId = "tm-duplicate-123"
            await new Event(validEvent({ ticketmasterId: sharedId })).save()

            const duplicate = new Event(
                validEvent({ name: "Another Event", ticketmasterId: sharedId })
            )
            await expect(duplicate.save()).rejects.toThrow(/duplicate key/i)
        })
    })

    describe("GeoJSON location", () => {
        test("stores location as a GeoJSON Point", async () => {
            const event = new Event(validEvent())
            const saved = await event.save()
            expect(saved.venue.location.type).toBe("Point")
            expect(saved.venue.location.coordinates).toHaveLength(2)
        })

        test("saves an event without venue coordinates", async () => {
            const event = new Event(validEvent({
                venue: { name: "Test Venue" }, // no location
            }))
            const saved = await event.save()
            expect(saved._id).toBeDefined()
        })
    })

    describe("images array", () => {
        test("stores multiple images", async () => {
            const event = new Event(validEvent({
                images: [
                    { url: "https://example.com/1.jpg", ratio: "16_9" },
                    { url: "https://example.com/2.jpg", ratio: "3_2" },
                ],
            }))
            const saved = await event.save()
            expect(saved.images).toHaveLength(2)
        })

        test("requires a URL on each image", async () => {
            const event = new Event(validEvent({
                images: [{ ratio: "16_9" }], // no URL
            }))
            await expect(event.save()).rejects.toThrow(/url.*required/i)
        })
    })

    describe("indexes", () => {
        test("syncs indexes successfully", async () => {
            // sanity check the 2dsphere index doesn't reject valid GeoJSON
            await Event.syncIndexes()
            const event = new Event(validEvent())
            await expect(event.save()).resolves.toBeDefined()
        })
    })
});