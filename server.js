const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.get("/test", (req, res) => {
  res.send("API OK");
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});

