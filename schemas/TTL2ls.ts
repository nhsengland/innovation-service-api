import * as mongoose from "mongoose";

const TTL2lsSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.String,
  code: mongoose.Schema.Types.String,
  eventType: { type: String, enum: ["LOGIN", "ACTION"], default: "LOGIN" },
  createdAt: { type: Date, expires: process.env.TTL2LS },
});

export const TTL2ls =
  mongoose.models.TTL2ls || mongoose.model("TTL2ls", TTL2lsSchema);
