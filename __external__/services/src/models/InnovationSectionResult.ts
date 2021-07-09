import { InnovationSectionModel } from "./InnovationSectionModel";

export interface InnovationSectionResult {
  id: string;
  name: string;
  status: string;
  sections: InnovationSectionModel[];
}
