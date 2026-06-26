const express = require("express");

const userProfileController = require("../controllers/userProfile");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, userProfileController.getMyProfile);
router.put("/me/location", requireAuth, userProfileController.updateLocation);
router.put("/me/favourite-artists", requireAuth, userProfileController.toggleFavouriteArtists);
router.put("/me/saved-events", requireAuth, userProfileController.toggleSavedEvent);

module.exports = router;