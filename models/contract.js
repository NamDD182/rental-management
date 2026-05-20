const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  roomId:    {type: mongoose.Schema.Types.ObjectId, ref: "Room", required:true},
  tenantId:  {type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required:true},
  startDate: {type: Date, required: true},
  endDate:   {type: Date, default: null},
  rentPrice: {type: Number, required: true},
  deposit:   {type: Number, default: 0},
  status:    {type: String, enum: ["active", "ended"], default: "active"},
  note:      {type:String, default: ""}
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contract", contractSchema);