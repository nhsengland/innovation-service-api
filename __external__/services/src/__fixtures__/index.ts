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
import { getRepository } from "typeorm";
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

export const createInnovationSupportStatus = async () => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
  const userService = new UserService(process.env.DB_TESTS_NAME);
  const innovatorObj = new User();

  const fake = {
    innovatorId: uuid.v4(),
  };

  innovatorObj.id = fake.innovatorId;
  const innovator = await innovatorService.create(innovatorObj);

  const organisationObj = Organisation.new({
    name: faker.company.companyName(),
    type: OrganisationType.ACCESSOR,
    acronym: faker.company.companySuffix(),
  });
  const organisation = await organisationService.create(organisationObj);

  const unitObj = OrganisationUnit.new({
    name: faker.company.companyName(),
    organisation,
  });

  const unit = await organisationService.addOrganisationUnit(unitObj);

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

export const saveInnovationsWithAssessment = async (
  ...innovations: Innovation[]
) => {
  const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
  const assessmentService = new InnovationAssessmentService(
    process.env.DB_TESTS_NAME
  );
  const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
  const organisationService = new OrganisationService(
    process.env.DB_TESTS_NAME
  );

  const result = [];
  const assessmentUserId = uuid.v4();
  const fake = {
    innovatorId: uuid.v4(),
    assessmentUserId,
    assessment: {
      description: faker.lorem.sentence(),
      assignTo: assessmentUserId,
    },
  };

  const userService = new UserService(process.env.DB_TESTS_NAME);
  const innovator = new User();
  innovator.id = fake.innovatorId;

  await innovatorService.create(innovator);
  const assessmentUser = new User();
  assessmentUser.id = fake.assessmentUserId;
  assessmentUser.type = UserType.ASSESSMENT;
  await userService.create(assessmentUser);

  for (let index = 0; index < innovations.length; index++) {
    const element = innovations[index];

    const organisationObj = Organisation.new({
      name: faker.company.companyName(),
      type: OrganisationType.ACCESSOR,
      acronym: faker.company.companySuffix(),
    });

    const organisation = await organisationService.create(organisationObj);

    const unitObj = OrganisationUnit.new({
      name: faker.company.companyName(),
      organisation,
    });

    const unit = await organisationService.addOrganisationUnit(unitObj);

    const innovation = await innovationService.create(element);
    const assessmentObj = {
      ...fake.assessment,
      innovation,
      assignTo: fake.assessmentUserId,
    };

    const supportObj = InnovationSupport.new({
      status: InnovationSupportStatus.ENGAGING,
      innovation,
      organisationUnit: unit,
    });

    let supports;
    try {
      supports = await innovationService.addSupport(supportObj);
    } catch (error) {
      console.log(error);
      throw error;
    }

    const assessement = await assessmentService.create(
      fake.innovatorId,
      innovation.id,
      assessmentObj
    );

    result.push({
      ...innovation,
      assessments: [assessement],
      innovationSupports: [supports],
    });
  }

  return result;
};
