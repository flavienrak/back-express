const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*", credentials: true, preflightContinue: false }));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["*"],
  },
});

const allUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.id;

  if (userId != "undefined") {
    allUsers[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(allUsers));

  socket.on("disconnect", () => {
    delete allUsers[userId];
    io.emit("getOnlineUsers", Object.keys(allUsers));
  });
});

function getReceiverSocketId(id) {
  return allUsers[id];
}
module.exports = { app, io, server, getReceiverSocketId };
