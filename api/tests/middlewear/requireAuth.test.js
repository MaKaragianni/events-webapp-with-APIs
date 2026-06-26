// api/tests/middleware/requireAuth.test.js

// Mock dependencies BEFORE any require()
jest.mock("../../lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn()
    }
  }
}))

jest.mock("better-auth/node", () => ({
  fromNodeHeaders: jest.fn((headers) => headers)
}))

jest.mock("../../models/userProfile", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}))

const requireAuth = require("../../middleware/requireAuth")
const { auth } = require("../../lib/auth")
const UserProfile = require("../../models/userProfile")

describe("requireAuth middleware", () => {
  let req, res, next

  beforeEach(() => {
    // fresh fakes for each test
    req = { headers: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()

    // reset all mocks
    auth.api.getSession.mockReset()
    UserProfile.findOne.mockReset()
    UserProfile.create.mockReset()
  })

  describe("when no session exists", () => {
    test("responds with 401", async () => {
      auth.api.getSession.mockResolvedValue(null)

      await requireAuth(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    test("does not call next", async () => {
      auth.api.getSession.mockResolvedValue(null)

      await requireAuth(req, res, next)

      expect(next).not.toHaveBeenCalled()
    })

    test("does not touch UserProfile", async () => {
      auth.api.getSession.mockResolvedValue(null)

      await requireAuth(req, res, next)

      expect(UserProfile.findOne).not.toHaveBeenCalled()
      expect(UserProfile.create).not.toHaveBeenCalled()
    })
  })

  describe("when a valid session exists and a profile already exists", () => {
    const fakeSession = {
      user: { id: "user-123", email: "test@test.com", name: "Test" },
      session: { id: "session-abc" }
    }
    const existingProfile = {
      authUserId: "user-123",
      favouriteArtists: ["Fontaines D.C."]
    }

    beforeEach(() => {
      auth.api.getSession.mockResolvedValue(fakeSession)
      UserProfile.findOne.mockResolvedValue(existingProfile)
    })

    test("calls next", async () => {
      await requireAuth(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    test("attaches user to req", async () => {
      await requireAuth(req, res, next)
      expect(req.user).toEqual(fakeSession.user)
    })
  })

  describe("when a valid session exists but no profile exists yet", () => {
    const fakeSession = {
      user: { id: "user-456", email: "new@test.com", name: "New User" },
      session: { id: "session-xyz" }
    }
    const newProfile = {
      authUserId: "user-456",
      favouriteArtists: []
    }

    beforeEach(() => {
      auth.api.getSession.mockResolvedValue(fakeSession)
      UserProfile.findOne.mockResolvedValue(null)
      UserProfile.create.mockResolvedValue(newProfile)
    })

    test("calls next", async () => {
      await requireAuth(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })
})