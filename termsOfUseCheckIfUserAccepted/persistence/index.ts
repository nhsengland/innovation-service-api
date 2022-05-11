import { UserType } from "@domain/index";
import { AccessorOrganisationRole } from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { CustomContext } from "../../utils/types";

const requser: RequestUser = {
  id: "BB51114B-EF06-44BC-943F-006FADBDA90E",
  externalId: "bb51114b-ef06-44bc-943f-006fadbda90e",
  type: UserType.ACCESSOR,
  organisationUser: {
    id: "C140C7E8-8AEF-EB11-A7AD-281878026472",
    role: AccessorOrganisationRole.QUALIFYING_ACCESSOR,
    organisation: {
      id: "F4394E00-86EF-EB11-A7AD-281878026472",
      name: "AHSN Network",
    },
  },
  organisationUnitUser: {
    id: "21866974-FB4D-EC11-94F6-0003FF0067B5",
    organisationUnit: {
      id: "F5394E00-86EF-EB11-A7AD-281878026472",
      name: "ORG UNIT FINAL",
    },
  },
};

export const termsOfUseCheckIfUserAccepted = async (context: CustomContext) => {
  const result = await context.services.TermsOfUseService.checkIfUserAccepted(
    requser
  );

  return result;
};
