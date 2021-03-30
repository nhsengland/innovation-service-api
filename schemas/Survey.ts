import * as mongoose from "mongoose";

const SurveySchema = new mongoose.Schema(
  {
    id: mongoose.Schema.Types.ObjectId,
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Survey =
  mongoose.models.Survey || mongoose.model("Survey", SurveySchema);
