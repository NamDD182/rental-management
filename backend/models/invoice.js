const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  contractId:    { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
  roomId:        { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  month:         { type: Number, required: true },
  year:          { type: Number, required: true },

  rentAmount:    { type: Number, required: true },

  electricOld:   { type: Number, required: true },
  electricNew:   { type: Number, required: true },
  electricPrice: { type: Number, default: 3500 },
  electricAmount:{ type: Number },

  currentPeople: { type: Number, required: true },
  waterPerPerson:{ type: Number, default: 50000 },
  waterAmount:   { type: Number },

  serviceAmount: { type: Number, default: 150000 }, // wifi + vệ sinh
  vehicleFee:    { type: Number, default: 0 },       // phí xe
  otherFees: [                                       // phí phát sinh khác
    {
      name:   { type: String },
      amount: { type: Number, default: 0 },
    }
  ],

  totalAmount:   { type: Number },

  status: {
    type: String,
    enum: ["unpaid", "paid", "overdue"],
    default: "unpaid",
  },
  paymentMethod: { type: String, enum: ["cash", "bank_transfer"], default: null },
  transferImageUrl: { type: String, default: null }, // ảnh chuyển khoản
  paidAt:        { type: Date, default: null },
  note:          { type: String, default: "" },
},
  { timestamps: true }
);

invoiceSchema.pre("save", async function () {
  this.electricAmount = (this.electricNew - this.electricOld) * this.electricPrice;
  this.waterAmount    = this.currentPeople * this.waterPerPerson;

  const otherTotal = this.otherFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);

  this.totalAmount =
    this.rentAmount +
    this.electricAmount +
    this.waterAmount +
    this.serviceAmount +
    this.vehicleFee +   // ← thêm
    otherTotal;         // ← thêm
});

invoiceSchema.index({ contractId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);