const router = require("express").Router();
const messageController = require("../controllers/messageController");

router.get("/:id/get-all", messageController.getMessages);
router.get(
  "/:id/:userId/:messageId/delete-message",
  messageController.deleteMessage
);
router.get("/:id/:userId/view-all", messageController.viewAllMessages);
router.post("/:id/:userId/send-message", messageController.sendMessage);

module.exports = router;
