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

    serviceAmount: { type: Number, default: 150000 },
    totalAmount:   { type: Number },

    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue"],
      default: "unpaid",
    },
    paidAt: { type: Date, default: null },
    note:   { type: String, default: "" },
},
  {
    timestamps: true,
  }
);

invoiceSchema.pre("save", function (next) {
  this.electricAmount = (this.electricNew - this.electricOld) * this.electricPrice;
  this.waterAmount    = this.currentPeople * this.waterPerPerson;
  this.totalAmount    = this.rentAmount
                      + this.electricAmount
                      + this.waterAmount
                      + this.serviceAmount;
  next();
});

// Chặn đúng: cùng hợp đồng, cùng tháng, cùng năm
invoiceSchema.index({ contractId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);