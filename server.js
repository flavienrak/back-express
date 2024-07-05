const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

const { app, server } = require("./socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
require("./config/db");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  return res.json("Welcome to express!");
});

const port = process.env.PORT;
server.listen(port, () => console.log(`App runing at: ${port}`));
