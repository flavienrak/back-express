const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

require("dotenv").config({ path: "./.env" });
require("./config/db");

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  return res.json("Welcome to express!");
});

app.listen(port, () => console.log(`App runing at: ${port}`));
