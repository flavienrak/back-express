const router = require("express").Router();
const userController = require("../controllers/userController");

router.post("/sign-up", userController.signUp); // POST http://localhost:8000/api/user/sign-up
router.get("/get-all", userController.getUsers); // GET http://localhost:8000/api/user/get-all

module.exports = router;
