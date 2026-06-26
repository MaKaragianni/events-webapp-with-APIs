const mongoose = require("mongoose")
const CityCache = require("../../models/cityCache")

require("../mongodb_helper")

function validCacheEntry(overrides = {}) {
  return {
    city: "Manchester",
    lastRefreshed: new Date(),
    ...overrides,
  }
}

beforeEach(async () => {
  await CityCache.deleteMany({})
})

describe("CityCache model", () => {
  describe("valid entry", () => {
    test("saves successfully with all fields", async () => {
      const entry = new CityCache(validCacheEntry())
      const saved = await entry.save()

      expect(saved._id).toBeDefined()
      expect(saved.city).toBe("Manchester")
      expect(saved.lastRefreshed).toBeInstanceOf(Date)
    })

    test("adds createdAt and updatedAt timestamps automatically", async () => {
      const entry = new CityCache(validCacheEntry())
      const saved = await entry.save()

      expect(saved.createdAt).toBeDefined()
      expect(saved.updatedAt).toBeDefined()
    })
  })

  describe("required field validation", () => {
    test("fails without city", async () => {
      const entry = new CityCache(validCacheEntry({ city: undefined }))
      await expect(entry.save()).rejects.toThrow(/city.*required/i)
    })

    test("fails without lastRefreshed", async () => {
      const entry = new CityCache(validCacheEntry({ lastRefreshed: undefined }))
      await expect(entry.save()).rejects.toThrow(/lastRefreshed.*required/i)
    })
  })

  describe("city uniqueness", () => {
    test("rejects a duplicate city", async () => {
      await CityCache.syncIndexes() // ensure unique index is built before the test runs

      await new CityCache(validCacheEntry({ city: "Manchester" })).save()

      const duplicate = new CityCache(validCacheEntry({ city: "Manchester" }))
      await expect(duplicate.save()).rejects.toThrow(/duplicate key/i)
    })

    test("allows different cities", async () => {
      await new CityCache(validCacheEntry({ city: "Manchester" })).save()
      await new CityCache(validCacheEntry({ city: "London" })).save()

      const count = await CityCache.countDocuments({})
      expect(count).toBe(2)
    })
  })

  describe("upsert behaviour", () => {
    test("updates lastRefreshed on upsert", async () => {
      const first = new Date("2026-01-01")
      const second = new Date("2026-06-01")

      await CityCache.updateOne(
        { city: "Manchester" },
        { lastRefreshed: first },
        { upsert: true }
      )

      await CityCache.updateOne(
        { city: "Manchester" },
        { lastRefreshed: second },
        { upsert: true }
      )

      const entries = await CityCache.find({ city: "Manchester" })
      expect(entries).toHaveLength(1)
      expect(entries[0].lastRefreshed).toEqual(second)
    })
  })
})