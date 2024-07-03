const router = require("express").Router();
const tokenController = require("../controllers/tokenController");

router.get("/:token/verify", tokenController.verifyToken);

module.exports = router;
