import {
  AccessorOrganisationRole,
  Innovation,
  InnovationAction,
  InnovationSectionCatalogue,
  InnovationStatus,
  InnovationSupport,
  InnovationSupportStatus,
  InnovatorOrganisationRole,
  MaturityLevelCatalogue,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  Role,
  User,
  UserRole,
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
import { NotificationService } from "@services/services/Notification.service";
import { InAppNotificationService } from "@services/services/InAppNotification.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import * as faker from "faker";
import { getRepository } from "typeorm";
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
      externalId: qAccessor.externalId,
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
  qAccessor.id = uuid.v4().toUpperCase();
  qAccessor.externalId = uuid.v4();
  return await accessorService.create(qAccessor);
};

export const createInnovatorUser = async () => {
  const innovator = new User();
  const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
  innovator.id = uuid.v4().toUpperCase();
  innovator.externalId = uuid.v4();
  innovator.firstTimeSignInAt = new Date();
  return await innovatorService.create(innovator);
};

export const createAssessmentUser = async (lockedAt?: Date) => {
  const usr = new User();
  const userService = new UserService(process.env.DB_TESTS_NAME);
  usr.id = uuid.v4().toUpperCase();
  usr.externalId = uuid.v4();
  usr.type = UserType.ASSESSMENT;
  usr.lockedAt = lockedAt;
  return await userService.create(usr);
};

export const createAdminUser = async () => {
  const admin = new User();
  const userService = new UserService(process.env.DB_TESTS_NAME);
  admin.type = UserType.ADMIN;
  admin.id = uuid.v4().toUpperCase();
  admin.externalId = uuid.v4();
  const role = await createAdminRole();

  const userRole = UserRole.new({
    role,
  });

  admin.serviceRoles = [userRole];
  try {
    return await userService.create(admin);
  } catch (error) {
    throw error;
  }
};

export const createAdminRole = async () => {
  const roleObj = Role.new({
    name: "ADMIN",
  });

  const roleRepo = getRepository(Role, process.env.DB_TESTS_NAME);

  return await roleRepo.save(roleObj);
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
  organisation: Organisation,
  inactivatedAt?: Date,
): Promise<OrganisationUnit> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  const unitObj = OrganisationUnit.new({
    name: faker.company.companyName(),
    acronym: faker.company.companySuffix(),
    organisation,
    inactivatedAt,
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

export const createSupportInInnovationMultipleAccessors = async (
  requestUser: RequestUser,
  innovation: Innovation,
  organisationUnitUserIds: string[]
): Promise<InnovationSupport> => {
  const innovationSupportService = new InnovationSupportService(
    process.env.DB_TESTS_NAME
  );

  const supportObj = InnovationSupport.new({
    status: InnovationSupportStatus.ENGAGING,
    accessors: organisationUnitUserIds,
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

export const addSuggestionsToAssessment = async (
  requestUser: RequestUser,
  id: string,
  innovationId: string,
  shares?: OrganisationUnit[]
) => {
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );

  const assessmentObj = {
    innovationId,
    isSubmission: true,
    organisationUnits: shares.map((o) => o.id),
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
        externalId: assessmentUser.externalId,
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
    externalId: user.externalId,
    type: user.type,
    organisationUser,
    organisationUnitUser,
  };
};

export const generateInnovatorWithOrganisation = async (): Promise<{
  user: User;
  organisation: Organisation;
}> => {
  const innovatorUser = await createInnovatorUser();
  const innovatorOrganisation = await createOrganisation(
    OrganisationType.INNOVATOR
  );
  await addUserToOrganisation(
    innovatorUser,
    innovatorOrganisation,
    InnovatorOrganisationRole.INNOVATOR_OWNER
  );

  return {
    user: innovatorUser,
    organisation: innovatorOrganisation,
  };
};

export const generateAccessorWithOrganisation = async (
  userRole: AccessorOrganisationRole,
  organisation?: Organisation
): Promise<{
  user: User;
  organisation: Organisation;
  organisationUser: OrganisationUser;
  organisationUnitUser: OrganisationUnitUser;
}> => {
  const user = await createAccessorUser();
  let accessorOrganisation;

  if (organisation) {
    accessorOrganisation = organisation;
  } else {
    accessorOrganisation = await createOrganisation(OrganisationType.ACCESSOR);
  }

  const organisationUser = await addUserToOrganisation(
    user,
    accessorOrganisation,
    userRole
  );

  const organisationUnit = await createOrganisationUnit(accessorOrganisation);
  const organisationUnitUser = await addOrganisationUserToOrganisationUnit(
    organisationUser,
    organisationUnit
  );

  return {
    user,
    organisation: accessorOrganisation,
    organisationUser: organisationUser,
    organisationUnitUser: organisationUnitUser,
  };
};

export const setupCompleteInnovation = async (
  withSupport = false,
  innovationPartial?: any
): Promise<{
  innovation: Innovation;
  accessorOrganisation: Organisation;
  users: {
    qualifyingAccessor: RequestUser;
    accessor: RequestUser;
    innovator: RequestUser;
    assessmentUser: RequestUser;
  };
  supports: InnovationSupport[];
}> => {
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );
  const supportService = new InnovationSupportService(
    process.env.DB_TESTS_NAME
  );

  const innovatorFixture = await generateInnovatorWithOrganisation();
  const qAccessorFixture = await generateAccessorWithOrganisation(
    AccessorOrganisationRole.QUALIFYING_ACCESSOR
  );
  const assessmentUser = await createAssessmentUser();
  const accessorOrganisation = qAccessorFixture.organisation;

  const accessorFixture = await generateAccessorWithOrganisation(
    AccessorOrganisationRole.ACCESSOR,
    accessorOrganisation
  );

  const accessor2 = await generateAccessorWithOrganisation(
    AccessorOrganisationRole.ACCESSOR,
    accessorOrganisation
  );
  const accessor2RequestUser = await getRequestUser(
    accessor2.user,
    accessor2.organisationUser,
    accessor2.organisationUnitUser
  );

  const accessor3 = await generateAccessorWithOrganisation(
    AccessorOrganisationRole.ACCESSOR,
    accessorOrganisation
  );
  const accessor3RequestUser = await getRequestUser(
    accessor3.user,
    accessor3.organisationUser,
    accessor3.organisationUnitUser
  );

  const innovatorRequestUser = getRequestUser(innovatorFixture.user);
  const qAccessorRequestUser = getRequestUser(
    qAccessorFixture.user,
    qAccessorFixture.organisationUser,
    qAccessorFixture.organisationUnitUser
  );
  const accessorRequestUser = getRequestUser(
    accessorFixture.user,
    accessorFixture.organisationUser,
    accessorFixture.organisationUnitUser
  );

  const assessmentRequestUser = getRequestUser(assessmentUser);

  const innovation = generateInnovation({
    ...innovationPartial,
    owner: { id: innovatorRequestUser.id },
    organisationShares: [{ id: accessorOrganisation.id }],
    status: InnovationStatus.IN_PROGRESS,
  });

  await saveInnovations(innovation);

  const assessmentMock = {
    assessment: {
      description: "Assessment Desc",
    },
  };

  const assessmentObj = {
    ...assessmentMock.assessment,
    innovation: innovation.id,
    assignTo: assessmentRequestUser.id,
  };

  const assessment = await assessmentService.create(
    assessmentRequestUser,
    innovation.id,
    assessmentObj
  );

  const updAssessment = {
    maturityLevel: MaturityLevelCatalogue.ADVANCED,
    isSubmission: true,
    test: "test",
    organisationUnits: [
      qAccessorRequestUser.organisationUnitUser.organisationUnit.id,
    ],
  };

  await assessmentService.update(
    assessmentRequestUser,
    assessment.id,
    innovation.id,
    updAssessment
  );

  let supports;

  if (withSupport) {
    const supportObj1 = {
      status: InnovationSupportStatus.ENGAGING,
      accessors: [accessorRequestUser.organisationUnitUser.id],
      comment: "test comment",
    };

    const support1 = await supportService.create(
      qAccessorRequestUser,
      innovation.id,
      supportObj1
    );
  }

  return {
    innovation: innovation,
    accessorOrganisation: accessorOrganisation,
    users: {
      qualifyingAccessor: qAccessorRequestUser,
      accessor: accessorRequestUser,
      innovator: innovatorRequestUser,
      assessmentUser: assessmentRequestUser,
    },
    supports: supports,
  };
};
