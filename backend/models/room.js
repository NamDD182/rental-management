const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber:{type: Number, required: true, unique: true, trim: true},
  floor:     {type: Number, required: true},
  area:      {type: Number, required: true}, //m2
  price:     {type: Number, required: true}, // giá niêm yết từng tháng
  maxPeople: {type: Number, required: true, min: 1},
  status:    {type: String, enum:["empty", "occupied"], default: "empty"},
  amenities: {type: [String], default: []}, // tiện ích: ["điều hòa", "nóng lạnh", "ban công"]
  images:    {type: [String], default: []}, // ảnh phòng 
  note:      {type: String, default: ""},
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);