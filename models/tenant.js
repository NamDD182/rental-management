const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
    fullName:      {type: String, required: true},
    phone:         {type: String, required:true, trim: true},

    cccd:          {type: String, required: true, unique: true, trim: true},
    cccdDate:      {type: Date, required: true},
    cccdPlace:     {type: String, required: true},
    
    dob:           {type: Date},
    hometown:      {type: String},
    gender:        {type: String, enum: ["male", "female"]},
    roomId:        {type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true},
    vehicleNumber: {type: String, default: ""},
    active:        {type: Boolean, default:true},
    note:          {type: String, default:""}
},
 {
    timestamps: true,
 } 
);

module.exports = mongoose.model("Tenant", tenantSchema);