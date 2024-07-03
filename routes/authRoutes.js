const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/sign-in", authController.signIn);
router.post("/sign-up", authController.signUp);

module.exports = router;
