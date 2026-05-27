const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: "http://localhost:3001", // URL frontend
}));

app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/upload", require("./routes/upload"));
app.use("/rooms", require("./routes/roomRouters"));
app.use("/tenants", require("./routes/tenants"));
app.use("/contracts", require("./routes/contract"));
app.use("/invoices", require("./routes/invoice"));

app.get("/test", (req, res) => {
  res.send("API OK");
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});

