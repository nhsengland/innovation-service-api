import { Innovation, Organisation } from "@domain/index";
import { UserModel } from "./UserModel";

export interface TransactionResult {
  user: UserModel;
  organisation: Organisation;
  innovation?: Innovation;
}
