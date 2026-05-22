const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));

app.get("/test", (req, res) => {
  res.send("API OK");
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});

