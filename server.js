const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const port = 8000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json("hello");
});

app.listen(port, () => console.log(`App runing at: ${port}`));
