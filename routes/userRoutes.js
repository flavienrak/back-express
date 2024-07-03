const router = require("express").Router();
const userController = require("../controllers/userController");
const multer = require("multer");
const upload = multer();

router.get("/:id/get-all", userController.getUsers);
router.get("/:id/get-user", userController.getUser);
router.get("/:id/:userId/view-profil", userController.viewProfil);
router.get("/:id/:userId/follow-user", userController.followUser);
router.get("/:id/:userId/reject-user", userController.rejectUser);
router.post("/:id/search", userController.search);
router.post(
  "/:id/edit-profil",
  upload.single("file"),
  userController.editProfil
);

module.exports = router;
