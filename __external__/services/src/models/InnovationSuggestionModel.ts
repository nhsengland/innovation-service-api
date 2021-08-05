import {
  InnovationActionStatus,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
} from "@domain/index";
import { OrganisationModel } from "./OrganisationModel";
import { OrganisationUnitModel } from "./OrganisationUnitModel";

interface InnovationSuggestionAccessor {
  organisationUnit?: OrganisationUnitModel;
  suggestedOrganisations?: OrganisationModel[];
}

export interface InnovationSuggestionModel {
  assessment?: {
    id?: string;
    suggestedOrganisations?: OrganisationModel[];
  };
  accessors?: InnovationSuggestionAccessor[];
}
