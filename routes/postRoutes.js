const router = require("express").Router();
const postController = require("../controllers/postController");

const multer = require("multer");
const upload = multer();

router.get("/:id/get-all", postController.getAllPosts);
router.get("/:id/get-my-posts", postController.getMyPosts);
router.get("/:id/:postId/get-post", postController.getPost);
router.get("/:id/:postId/like-post", postController.likePost);
router.get(
  "/:id/:postId/:commentId/delete-comment",
  postController.deleteComment
);
router.get("/:id/:postId/reject-post", postController.rejectPost);
router.get("/:id/:postId/delete-post", postController.deletePost);
router.post("/:id/:postId/comment-post", postController.commentPost);
router.post(
  "/:id/create-post",
  upload.single("file"),
  postController.createPost
);

module.exports = router;
