import * as mongoose from "mongoose";

const TTL2lsSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.String,
  code: mongoose.Schema.Types.String,
  eventType: {
    type: String,
    enum: [
      "LOGIN",
      "ADMIN_HEALTH",
      "ADMIN_CREATE_USER",
      "ADMIN_LOCK_USER",
      "ADMIN_UNLOCK_USER",
    ],
    default: "LOGIN",
  },
  createdAt: { type: Date, expires: process.env.TTL2LS || 300 },
  validatedAt: { type: Date },
});

export const TTL2ls =
  mongoose.models.TTL2ls || mongoose.model("TTL2ls", TTL2lsSchema);
