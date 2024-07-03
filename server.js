const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const messageRoutes = require("./routes/messageRoutes");

require("dotenv").config({ path: "./.env" });
require("./config/db");

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  return res.json("Welcome to express!");
});

app.listen(port, () => console.log(`App runing at: ${port}`));
