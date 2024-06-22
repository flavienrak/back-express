const router = require("express").Router();
const messageController = require("../controllers/messageController");

router.post("/send", messageController.createMessage);
router.get("/get-all", messageController.getMessages);

module.exports = router;
