require('dotenv').config()

const UserProfile = require("../models/userProfile")
const { setLastResetLink } = require("./devResetLinkStore")

const { mongodbAdapter } = require('better-auth/adapters/mongodb')
const { createAuthMiddleware } = require("better-auth/api")
const { betterAuth } = require('better-auth')

const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MONGODB_URL)
const db = client.db()

const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // This is not wired up to a real email provider. For now,
      // the reset link is stashed in memory so the frontend can
      // show it in a pop-up (see api/lib/devResetLinkStore.js).
      console.log(`Password reset requested for ${user.email}`)
      console.log(`Reset link: ${url}`)
      setLastResetLink(url)
    },
  },
  trustedOrigins: ["http://localhost:5173"],
 
 
  // custom hook for after auth is complete
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // check path is for sign up and or log in
      if (ctx.path === "/sign-up/email" || ctx.path === "/sign-in/email") {
        try {
          // pluck off user id
          const userId = ctx.context.newSession?.user?.id;
          // attempt to find a profile with that id 
          let profile = await UserProfile.findOne({ authUserId: userId })
          // if there is a user id and no profile for it -> create one
          if (userId && !profile) {
            await UserProfile.create({
              authUserId: userId,
            })
            console.log("UserProfile created for:", userId)
          }
        } catch (err) {
          console.error("Failed to create UserProfile:", err)
        }
      }
    }
    )
  }
})
 
module.exports = { auth }