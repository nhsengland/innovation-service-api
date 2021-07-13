import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAction,
  InnovationSectionCatalogue,
  InnovationSupport,
  InnovationSupportStatus,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  User,
  UserType,
} from "@domain/index";
import { RequestUser } from "@services/models/RequestUser";
import { AccessorService } from "@services/services/Accessor.service";
import { InnovationService } from "@services/services/Innovation.service";
import { InnovationActionService } from "@services/services/InnovationAction.service";
import { InnovationAssessmentService } from "@services/services/InnovationAssessment.service";
import { InnovationSectionService } from "@services/services/InnovationSection.service";
import { InnovationSupportService } from "@services/services/InnovationSupport.service";
import { InnovatorService } from "@services/services/Innovator.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import * as faker from "faker";
import * as uuid from "uuid";

// ****************************
// Innovation
// ****************************
export const generateInnovation = (args?) => {
  return Innovation.new({
    surveyId: uuid.v4(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.sentence(),
    countryName: faker.address.countryCode(),
    ...args,
  });
};

export const saveInnovation = async (innovation: Innovation) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  return await innovationService.create(innovation);
};

export const saveInnovations = async (...innovations: Innovation[]) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  const result = [];
  for (let i = 0; i < innovations.length; i++) {
    result.push(await innovationService.create(innovations[i]));
  }

  return result;
};

export const createInnovationWithSupportStatus = async () => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  const innovator = await createInnovatorUser();
  const qAccessor = await createAccessorUser();

  const organisation = await createOrganisation(OrganisationType.ACCESSOR);
  const unit = await addUnitToOrganisation(organisation);
  const innovationObj = generateInnovation();

  innovationObj.owner = innovator;
  const innovation = await innovationService.create(innovationObj);

  const organisationUser = await addUserToOrganisation(
    qAccessor,
    organisation,
    AccessorOrganisationRole.QUALIFYING_ACCESSOR
  );
  const organisationUnitUser = await addOrganisationUserToOrganisationUnit(
    organisationUser,
    unit
  );

  await createSupportInInnovation(
    {
      id: qAccessor.id,
      type: UserType.ACCESSOR,
      organisationUser: {
        id: organisationUser.id,
        role: organisationUser.role,
        organisation: {
          id: organisation.id,
          name: organisation.name,
        },
      },
      organisationUnitUser: {
        id: unit.id,
        organisationUnit: {
          id: unit.id,
          name: unit.name,
        },
      },
    },
    innovation,
    organisationUnitUser.id
  );

  return innovation;
};

// ****************************
// USER CREATION
// ****************************
export const createAccessorUser = async () => {
  const qAccessor = new User();
  const accessorService = new AccessorService(process.env.DB_TESTS_NAME);
  qAccessor.type = UserType.ACCESSOR;
  qAccessor.id = uuid.v4();
  return await accessorService.create(qAccessor);
};

export const createInnovatorUser = async () => {
  const innovator = new User();
  const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
  innovator.id = uuid.v4();
  return await innovatorService.create(innovator);
};

export const createAssessmentUser = async () => {
  const usr = new User();
  const userService = new UserService(process.env.DB_TESTS_NAME);
  usr.id = uuid.v4();
  usr.type = UserType.ASSESSMENT;
  return await userService.create(usr);
};

// ****************************
// Organisation
// ****************************
export const createOrganisation = async (
  type: OrganisationType
): Promise<Organisation> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );
  const organisationObj = Organisation.new({
    name: faker.company.companyName(),
    acronym: faker.company.companySuffix(),
    type,
  });
  return await organisationService.create(organisationObj);
};

export const createOrganisationUnit = async (
  organisation: Organisation
): Promise<OrganisationUnit> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  const unitObj = OrganisationUnit.new({
    name: faker.company.companyName(),
    acronym: faker.company.companySuffix(),
    organisation,
  });

  return await organisationService.addOrganisationUnit(unitObj);
};

export const addUnitToOrganisation = async (
  organisation: Organisation
): Promise<OrganisationUnit> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  const unitObj = OrganisationUnit.new({
    name: faker.company.companyName(),
    organisation,
  });

  return await organisationService.addOrganisationUnit(unitObj);
};

export const addUserToOrganisation = async (
  user: User,
  organisation: Organisation,
  role: string
): Promise<OrganisationUser> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  return await organisationService.addUserToOrganisation(
    user,
    organisation,
    role
  );
};

export const addOrganisationUserToOrganisationUnit = async (
  organisationUser: OrganisationUser,
  organisationUnit: OrganisationUnit
): Promise<OrganisationUnitUser> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  return await organisationService.addUserToOrganisationUnit(
    organisationUser,
    organisationUnit
  );
};

export const findUserOrganisations = async (
  requestUser: RequestUser
): Promise<OrganisationUser[]> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  return await organisationService.findUserOrganisations(requestUser.id);
};

// ****************************
// Innovation Section
// ****************************
export const createSectionInInnovation = async (
  requestUser: RequestUser,
  innovation: Innovation,
  section: InnovationSectionCatalogue,
  data: any
) => {
  const innovationSectionService = new InnovationSectionService(
    process.env.DB_TESTS_NAME
  );

  return await innovationSectionService.saveSection(
    requestUser,
    innovation.id,
    section,
    data
  );
};

// ****************************
// Innovation Support
// ****************************
export const createSupportInInnovation = async (
  requestUser: RequestUser,
  innovation: Innovation,
  organisationUnitUserId: string
): Promise<InnovationSupport> => {
  const innovationSupportService = new InnovationSupportService(
    process.env.DB_TESTS_NAME
  );

  const supportObj = InnovationSupport.new({
    status: InnovationSupportStatus.ENGAGING,
    accessors: [organisationUnitUserId],
  });

  return await innovationSupportService.create(
    requestUser,
    innovation.id,
    supportObj
  );
};

// ****************************
// Innovation Action
// ****************************
export const createInnovationAction = async (
  requestUser: RequestUser,
  innovation: Innovation
): Promise<InnovationAction> => {
  const innovationActionService = new InnovationActionService(
    process.env.DB_TESTS_NAME
  );

  const actionObj = {
    section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
    description: faker.lorem.sentence(),
  };

  return await innovationActionService.create(
    requestUser,
    innovation.id,
    actionObj
  );
};

// ****************************
// Assessment
// ****************************
export const createAssessment = async (
  requestUser: RequestUser,
  innovation: Innovation
) => {
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );

  const fake = {
    assessment: {
      description: faker.lorem.sentence(),
      assignTo: requestUser.id,
    },
  };

  const assessmentObj = {
    ...fake.assessment,
    innovation,
    assignTo: requestUser.id,
  };

  return await assessmentService.create(
    requestUser,
    innovation.id,
    assessmentObj
  );
};

export const addSharesToAssessment = async (
  requestUser: RequestUser,
  id: string,
  innovationId: string,
  shares?: Organisation[]
) => {
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );

  const assessmentObj = {
    innovationId,
    isSubmission: true,
    organisations: shares.map((o) => o.id),
  };

  return await assessmentService.update(
    requestUser,
    id,
    innovationId,
    assessmentObj
  );
};

export const saveInnovationsWithAssessment = async (
  ...innovations: Innovation[]
) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  const result = [];

  const innovator = await createInnovatorUser();
  const assessmentUser = await createAssessmentUser();

  for (let index = 0; index < innovations.length; index++) {
    const element = innovations[index];
    element.owner = innovator;

    const innovation = await innovationService.create(element);

    const assessment = await createAssessment(
      {
        id: assessmentUser.id,
        type: UserType.ASSESSMENT,
      },
      innovation
    );

    result.push({
      ...innovation,
      assessments: [assessment],
      innovationSupports: [],
    });
  }

  return result;
};

// ****************************
// Request User
// ****************************
export const getRequestUser = (
  user: User,
  orgUser?: OrganisationUser,
  orgUnitUser?: OrganisationUnitUser
): RequestUser => {
  let organisationUser = null;
  let organisationUnitUser = null;

  if (orgUser) {
    organisationUser = {
      id: orgUser.id,
      role: orgUser.role,
      organisation: {
        id: orgUser.organisation.id,
        name: orgUser.organisation.name,
      },
    };
  }

  if (orgUnitUser) {
    organisationUnitUser = {
      id: orgUnitUser.id,
      organisationUnit: {
        id: orgUnitUser.organisationUnit.id,
        name: orgUnitUser.organisationUnit.name,
      },
    };
  }

  return {
    id: user.id,
    type: user.type,
    organisationUser,
    organisationUnitUser,
  };
};
