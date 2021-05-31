import {
  Innovation,
  InnovationSupport,
  InnovationSupportStatus,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  User,
  UserType,
} from "@domain/index";
import { InnovationService } from "@services/services/Innovation.service";
import { InnovationAssessmentService } from "@services/services/InnovationAssessment.service";
import { InnovatorService } from "@services/services/Innovator.service";
import { OrganisationService } from "@services/services/Organisation.service";
import { UserService } from "@services/services/User.service";
import * as faker from "faker";
import * as uuid from "uuid";

export const generateInnovation = (args?) => {
  return Innovation.new({
    surveyId: uuid.v4(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.sentence(),
    countryName: faker.address.countryCode(),
    ...args,
  });
};

export const saveInnovations = async (...innovations: Innovation[]) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  const result = [];
  for (let i = 0; i < innovations.length; i++) {
    result.push(await innovationService.create(innovations[i]));
  }

  return result;
};

export const createInnovator = async () => {
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

export const createOrganisationWithUnit = async (
  type: OrganisationType
): Promise<OrganisationUnit> => {
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );
  const organisation = await createOrganisation(type);
  const unitObj = OrganisationUnit.new({
    name: faker.company.companyName(),
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

export const createInnovationSupportStatus = async () => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  const innovator = await createInnovator();
  const organisation = await createOrganisation(OrganisationType.ACCESSOR);
  const unit = await addUnitToOrganisation(organisation);
  const innovationObj = generateInnovation();

  innovationObj.owner = innovator;
  const innovation = await innovationService.create(innovationObj);

  const supportObj = InnovationSupport.new({
    status: InnovationSupportStatus.ENGAGING,
    innovation,
    organisationUnit: unit,
  });

  return await innovationService.addSupport(supportObj);
};

export const addSupportsToInnovation = async (
  innovation: Innovation,
  organisationUnit: OrganisationUnit
) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  const supportObj = InnovationSupport.new({
    status: InnovationSupportStatus.ENGAGING,
    innovation,
    organisationUnit,
  });

  return await innovationService.addSupport(supportObj);
};

export const createAssessment = async (
  innovator: User,
  innovation: Innovation,
  assessmentUser: User
) => {
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );

  const fake = {
    assessment: {
      description: faker.lorem.sentence(),
      assignTo: assessmentUser.id,
    },
  };

  const assessmentObj = {
    ...fake.assessment,
    innovation,
    assignTo: assessmentUser.id,
  };

  return await assessmentService.create(
    innovator.id,
    innovation.id,
    assessmentObj
  );
};
export const saveInnovationsWithAssessment = async (
  ...innovations: Innovation[]
) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);

  const result = [];

  const innovator = await createInnovator();
  const assessmentUser = await createAssessmentUser();

  for (let index = 0; index < innovations.length; index++) {
    const element = innovations[index];
    element.owner = innovator;

    const organisation = await createOrganisation(OrganisationType.ACCESSOR);

    const unit = await addUnitToOrganisation(organisation);

    const innovation = await innovationService.create(element);

    const supports = await addSupportsToInnovation(innovation, unit);

    const assessment = await createAssessment(
      innovator,
      innovation,
      assessmentUser
    );

    result.push({
      ...innovation,
      assessments: [assessment],
      innovationSupports: [supports],
    });
  }

  return result;
};
