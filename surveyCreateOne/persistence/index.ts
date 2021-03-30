import { Survey } from "../../schemas/Survey";
import { Document } from "mongoose";

export const Save = async (data: any): Promise<Document<typeof Survey>> => {
  const survey = new Survey({
    answers: {
      ...data,
    },
  });

  return survey.save();
};

export const GetId = (doc: Document<typeof Survey>): string => {
  return doc.get("_id").toString();
};
