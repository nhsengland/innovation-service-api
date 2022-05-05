import { ActivityLog, UserRole } from "@domain/index";
import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Innovation } from "../entity/innovation/Innovation.entity";
import { InnovationAction } from "../entity/innovation/InnovationAction.entity";
import { InnovationSection } from "../entity/innovation/InnovationSection.entity";
import { InnovationSupport } from "../entity/innovation/InnovationSupport.entity";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUnit } from "../entity/organisation/OrganisationUnit.entity";
import { User } from "../entity/user/User.entity";
import {
  InnovationActionStatus,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStatus,
  InnovationSupportStatus,
} from "../enums/innovation.enums";
import { OrganisationType } from "../enums/organisation.enums";
import { UserType } from "../enums/user.enums";

describe("Innovation Action Test Suite", () => {
  let innovationSectionRepo: Repository<InnovationSection>;
  let innovationActionRepo: Repository<InnovationAction>;
  let userRepo: Repository<User>;
  let innovationRepo: Repository<Innovation>;

  let organisationRepo: Repository<Organisation>;
  let organisationUnitRepo: Repository<OrganisationUnit>;
  let innovationSupportRepo: Repository<InnovationSupport>;

  beforeAll(async () => {
    innovationSectionRepo = getRepository(
      InnovationSection,
      process.env.DB_TESTS_NAME
    );
    innovationActionRepo = getRepository(
      InnovationAction,
      process.env.DB_TESTS_NAME
    );
    innovationRepo = getRepository(Innovation, process.env.DB_TESTS_NAME);
    userRepo = getRepository(User, process.env.DB_TESTS_NAME);

    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    organisationUnitRepo = getRepository(
      OrganisationUnit,
      process.env.DB_TESTS_NAME
    );
    innovationSupportRepo = getRepository(
      InnovationSupport,
      process.env.DB_TESTS_NAME
    );
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(UserRole).execute();
    await query.from(ActivityLog).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
    await query.from(Innovation).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(Organisation).execute();
    await query.from(User).execute();
  });

  describe("InnovationAction Suite", () => {
    it("should create an Innovation Action with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(InnovationAction);

      const userObj = User.new({
        id: "C7095D87-C3DF-46F6-A503-001B083F4630",
        name: "userDummy",
        type: UserType.INNOVATOR,
      });
      const user = await userRepo.save(userObj);

      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "My innovation description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });
      const innovation = await innovationRepo.save(innovationObj);

      const innovationSectionObj = InnovationSection.new({
        innovation,
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        status: InnovationSectionStatus.NOT_STARTED,
      });
      const innovationSection = await innovationSectionRepo.save(
        innovationSectionObj
      );

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const organisationUnitObj = OrganisationUnit.new({
        organisation,
        name: "New Unit",
      });
      const organisationUnit = await organisationUnitRepo.save(
        organisationUnitObj
      );

      const innovationSupportObj = InnovationSupport.new({
        organisationUnit,
        innovation,
        status: InnovationSupportStatus.UNASSIGNED,
      });
      const innovationSupport = await innovationSupportRepo.save(
        innovationSupportObj
      );

      const innovationActionObj = InnovationAction.new({
        description: "myNewInnovationAction",
        innovationSection,
        innovationSupport,
        status: InnovationActionStatus.REQUESTED,
        assignTo: user,
      });
      const innovationAction = await innovationActionRepo.save(
        innovationActionObj
      );

      const actual = await innovationActionRepo.findOne(innovationAction.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });

    it("should create an Innovation Action with a description of 500 characters", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(InnovationAction);

      const userObj = User.new({
        id: "D7095D87-C3DF-46F6-A503-001B083F4630",
        name: "userDummy",
        type: UserType.INNOVATOR,
      });
      const user = await userRepo.save(userObj);

      const maxLength = 500;
      const description = new Array(maxLength + 1).join("R");

      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "Innovation A Description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      const innovation = await innovationRepo.save(innovationObj);

      const innovationSectionObj = InnovationSection.new({
        innovation,
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        status: InnovationSectionStatus.NOT_STARTED,
      });
      const innovationSection = await innovationSectionRepo.save(
        innovationSectionObj
      );

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const organisationUnitObj = OrganisationUnit.new({
        organisation,
        name: "New Unit",
      });
      const organisationUnit = await organisationUnitRepo.save(
        organisationUnitObj
      );

      const innovationSupportObj = InnovationSupport.new({
        organisationUnit,
        innovation,
        status: InnovationSupportStatus.UNASSIGNED,
      });
      const innovationSupport = await innovationSupportRepo.save(
        innovationSupportObj
      );

      const innovationActionObj = InnovationAction.new({
        description,
        innovationSection,
        innovationSupport,
        status: InnovationActionStatus.REQUESTED,
        assignTo: user,
      });
      const innovationAction = await innovationActionRepo.save(
        innovationActionObj
      );

      const actual = await innovationActionRepo.findOne(innovationAction.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });

    it("should throw with a description larger than 500 characters", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(InnovationAction);

      const userObj = User.new({
        id: "F7095D87-C3DF-46F6-A503-001B083F4630",
        name: "userDummy",
        type: UserType.INNOVATOR,
      });
      const user = await userRepo.save(userObj);

      const maxLength = 500;
      const description = new Array(maxLength + 2).join("R");

      const innovationObj = Innovation.new({
        name: "Innovation A",
        description: "Innovation A Description",
        countryName: "Wales",
        surveyId: "abc",
        owner: user,
        status: InnovationStatus.WAITING_NEEDS_ASSESSMENT,
      });

      const innovation = await innovationRepo.save(innovationObj);

      const innovationSectionObj = InnovationSection.new({
        innovation,
        section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        status: InnovationSectionStatus.NOT_STARTED,
      });
      const innovationSection = await innovationSectionRepo.save(
        innovationSectionObj
      );

      const organisationObj = Organisation.new({
        name: "AccessorOrg",
        size: "huge",
        type: OrganisationType.ACCESSOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const organisationUnitObj = OrganisationUnit.new({
        organisation,
        name: "New Unit",
      });
      const organisationUnit = await organisationUnitRepo.save(
        organisationUnitObj
      );

      const innovationSupportObj = InnovationSupport.new({
        organisationUnit,
        innovation,
        status: InnovationSupportStatus.UNASSIGNED,
      });
      const innovationSupport = await innovationSupportRepo.save(
        innovationSupportObj
      );

      const innovationActionObj = InnovationAction.new({
        description,
        innovationSection,
        innovationSupport,
        status: InnovationActionStatus.REQUESTED,
        assignTo: user,
      });

      let err;
      try {
        await innovationActionRepo.save(innovationActionObj);
      } catch (error) {
        err = error;
      }

      // Assert
      expect(err).toBeDefined();
    });
  });
});
