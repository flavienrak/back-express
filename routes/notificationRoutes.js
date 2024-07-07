const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

router.get("/:id/get-notifs", notificationController.getNotifs);
router.get("/:id/view-all", notificationController.viewAll);
router.get("/:id/post/view-all", notificationController.viewAllPosts);
router.get("/:id/message/view-all", notificationController.viewAllMessages);

module.exports = router;
