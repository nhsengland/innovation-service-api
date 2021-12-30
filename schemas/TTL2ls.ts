import * as mongoose from "mongoose";

const ttl = process.env.TTL2LS ? parseInt(process.env.TTL2LS) : 300;

const TTL2lsSchema = new mongoose.Schema(
  {
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
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

TTL2lsSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttl });

export const TTL2ls =
  mongoose.models.TTL2ls || mongoose.model("TTL2ls", TTL2lsSchema);
