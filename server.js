const express = require("express");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/rooms", require("./routes/roomRouters"));
app.use("/tenants", require("./routes/tenants"));

app.get("/test", (req, res) => {
  res.send("API OK");
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});

