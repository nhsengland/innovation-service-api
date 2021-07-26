import {
  AccessorOrganisationRole,
  ClinicalEvidenceTypeCatalogue,
  Comment,
  EvidenceTypeCatalogue,
  HasRegulationKnowledegeCatalogue,
  Innovation,
  InnovationAction,
  InnovationArea,
  InnovationAreaCatalogue,
  InnovationCareSetting,
  InnovationCategory,
  InnovationCategoryCatalogue,
  InnovationClinicalArea,
  InnovationDeploymentPlan,
  InnovationEvidence,
  InnovationFile,
  InnovationRevenue,
  InnovationSection,
  InnovationSectionCatalogue,
  InnovationSectionStatus,
  InnovationStandard,
  InnovationCertificationCatalogue,
  InnovationStatus,
  InnovationSubgroup,
  InnovationSupport,
  InnovationUserTest,
  Notification,
  NotificationUser,
  Organisation,
  OrganisationType,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  StandardMetCatalogue,
  User,
  UserType,
  YesOrNoCatalogue,
  InnovationSubgroupBenefit,
  InnovationGeneralBenefit,
  InnovationEnvironmentalBenefit,
  GeneralBenefitCatalogue,
  EnvironmentalBenefitCatalogue,
  SubgroupBenefitCatalogue,
} from "@domain/index";
import {
  InnovationNotFoundError,
  InvalidParamsError,
  SectionNotFoundError,
} from "@services/errors";
import { InnovationSectionModel } from "@services/models/InnovationSectionModel";
import { RequestUser } from "@services/models/RequestUser";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import { FileService } from "../services/File.service";
import { InnovationSectionService } from "../services/InnovationSection.service";
import * as fixtures from "../__fixtures__";
import * as helpers from "../helpers";
import { EmailNotificationTemplate } from "@domain/enums/email-notifications.enum";
import * as engines from "@engines/index";
import { NotificationService } from "@services/services/Notification.service";
import { LoggerService } from "@services/services/Logger.service";
import * as dotenv from "dotenv";
import * as path from "path";
describe("Innovation Section Service Suite", () => {
  let fileService: FileService;
  let innovationSectionService: InnovationSectionService;

  let innovatorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    fileService = new FileService(process.env.DB_TESTS_NAME);
    innovationSectionService = new InnovationSectionService(
      process.env.DB_TESTS_NAME
    );

    const innovatorUser = await fixtures.createInnovatorUser();

    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);

    spyOn(engines, "emailEngines").and.returnValue([
      {
        key: EmailNotificationTemplate.ACCESSORS_ACTION_TO_REVIEW,
        handler: async function () {
          return [];
        },
      },
      {
        key: EmailNotificationTemplate.ACCESSORS_ASSIGNED_TO_INNOVATION,
        handler: async function () {
          return [];
        },
      },
      {
        key: EmailNotificationTemplate.INNOVATORS_ACTION_REQUEST,
        handler: async function () {
          return [];
        },
      },
    ]);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(User).execute();
    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(NotificationUser).execute();
    await query.from(Notification).execute();
    await query.from(Comment).execute();
    await query.from(InnovationGeneralBenefit).execute();
    await query.from(InnovationEnvironmentalBenefit).execute();
    await query.from(InnovationDeploymentPlan).execute();
    await query.from(InnovationRevenue).execute();
    await query.from(InnovationUserTest).execute();
    await query.from(InnovationStandard).execute();
    await query.from(InnovationFile).execute();
    await query.from(InnovationArea).execute();
    await query.from(InnovationCareSetting).execute();
    await query.from(InnovationCategory).execute();
    await query.from(InnovationClinicalArea).execute();
    await query.from(InnovationEvidence).execute();
    await query.from(InnovationSubgroupBenefit).execute();
    await query.from(InnovationSubgroup).execute();
    await query.from(InnovationAction).execute();
    await query.from(InnovationSection).execute();
    await query.from(InnovationSupport).execute();
    await query.from(OrganisationUnitUser).execute();
    await query.from(OrganisationUnit).execute();
    await query.from(OrganisationUser).execute();
    await query.from(Organisation).execute();
    await query.from(Innovation).execute();
  });

  it("should instantiate the innovation section service", async () => {
    expect(innovationSectionService).toBeDefined();
  });

  it("should find all innovation sections with all properties", async () => {
    const sectionObj = InnovationSection.new({
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      status: InnovationSectionStatus.DRAFT,
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      surveyId: "abc",
      sections: [sectionObj],
      status: InnovationStatus.IN_PROGRESS,
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    const result = await innovationSectionService.findAllInnovationSections(
      innovatorRequestUser,
      innovation.id
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.sections.length).toEqual(14);
  });

  it("should throw when id is null in findAllInnovationSections()", async () => {
    let err;
    try {
      await innovationSectionService.findAllInnovationSections(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain(
      "Invalid parameters. You must define the innovation id and the userId."
    );
  });

  it("should throw when user id or innovator id are invalid in findAllInnovationSections()", async () => {
    let err;
    try {
      await innovationSectionService.findAllInnovationSections(
        {
          id: ":id",
          type: UserType.INNOVATOR,
        },
        "D58C433E-F36B-1410-80E0-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
    expect(err.message).toContain(
      "Invalid parameters. Innovation not found for the user."
    );
  });

  it("should get a specific innovation section with all dependencies", async () => {
    const category = InnovationCategory.new({
      type: InnovationCategoryCatalogue.AI,
      deletedAt: new Date(),
    });

    const category2 = InnovationCategory.new({
      type: InnovationCategoryCatalogue.EDUCATION,
    });

    const subgroup = InnovationSubgroup.new({
      name: "subgroup test",
      conditions: "subgroup conditions",
    });

    const evidence = InnovationEvidence.new({
      name: "evidence test",
      summary: "summary",
      evidenceType: EvidenceTypeCatalogue.CLINICAL,
      clinicalEvidenceType: ClinicalEvidenceTypeCatalogue.OTHER,
      description: "other description",
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      surveyId: "abc",
      impactPatients: true,
      impactClinicians: true,
      status: InnovationStatus.IN_PROGRESS,
      subgroups: [subgroup],
      evidence: [evidence],
      categories: [category, category2],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    const result = await innovationSectionService.findSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.UNDERSTANDING_OF_BENEFITS
    );

    // Assert
    expect(result).toBeDefined();
  });

  it("should get a specific innovation section with all types", async () => {
    const category = InnovationCategory.new({
      type: InnovationCategoryCatalogue.AI,
      deletedAt: new Date(),
    });

    const category2 = InnovationCategory.new({
      type: InnovationCategoryCatalogue.EDUCATION,
    });

    const subgroup = InnovationSubgroup.new({
      name: "subgroup test",
      conditions: "subgroup conditions",
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      surveyId: "abc",
      impactPatients: true,
      impactClinicians: true,
      status: InnovationStatus.IN_PROGRESS,
      subgroups: [subgroup],
      categories: [category, category2],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const file = await fileService.getUploadUrl(
      "test.txt",
      innovation.id,
      "INNOVATION_EVIDENCE"
    );

    await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS,
      {
        hasEvidence: YesOrNoCatalogue.YES,
        evidence: [
          {
            evidenceType: EvidenceTypeCatalogue.CLINICAL,
            clinicalEvidenceType: ClinicalEvidenceTypeCatalogue.OTHER,
            description: "other description",
            summary: "my summary",
            files: [file.id],
          },
        ],
      }
    );

    // Act
    const result = await innovationSectionService.findSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );

    // Assert
    expect(result).toBeDefined();
  });

  it("should throw when id is null in findSection()", async () => {
    let err;
    try {
      await innovationSectionService.findSection(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when innovation id invalid in findSection()", async () => {
    let err;
    try {
      await innovationSectionService.findSection(
        innovatorRequestUser,
        "C435433E-F36B-1410-8105-0032FE5B194B",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
  });

  it("should throw when section code is invalid in findSection()", async () => {
    let err;
    try {
      await innovationSectionService.findSection(
        innovatorRequestUser,
        "T85C433E-F36B-1410-80E0-0032FE5B194B",
        "invalid"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(SectionNotFoundError);
    expect(err.message).toContain("Invalid parameters. Section not found.");
  });

  it("should save UNDERSTANDING_OF_NEEDS section with correct properties", async () => {
    const sectionObj = InnovationSection.new({
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      status: InnovationSectionStatus.DRAFT,
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: false,
      impactClinicians: false,
      status: InnovationStatus.IN_PROGRESS,
      sections: [sectionObj],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    const result = await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.UNDERSTANDING_OF_NEEDS,
      {
        impactPatients: true,
        impactClinicians: false,
        cliniciansImpactDetails: ":cliniciansImpactDetails",
        subgroups: [
          InnovationSubgroup.new({
            name: "subgroup test",
            conditions: "subgroup conditions",
          }),
        ],
        name: "should not update name",
      }
    );

    const sections = await result.sections;
    const subgroups = await result.subgroups;

    // Assert
    expect(sections.length).toEqual(2);
    expect(subgroups.length).toEqual(1);
    expect(result.name).toEqual("My Innovation");
    expect(result.impactPatients).toBeTruthy();
    expect(result.impactClinicians).toBeFalsy();
    expect(subgroups[0].name).toEqual("subgroup test");
  });

  it("should save UNDERSTANDING_OF_BENEFITS section with correct properties", async () => {
    const subgroup = InnovationSubgroup.new({
      name: "subgroup test",
      conditions: "subgroup conditions",
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: true,
      impactClinicians: true,
      hasBenefits: YesOrNoCatalogue.YES,
      status: InnovationStatus.IN_PROGRESS,
      subgroups: [subgroup],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);
    let subgroups = await innovation.subgroups;

    await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.UNDERSTANDING_OF_BENEFITS,
      {
        hasBenefits: YesOrNoCatalogue.YES,
        accessibilityImpactDetails: ":accessibilityImpactDetails",
        accessibilityStepsDetails: ":accessibilityStepsDetails",
        generalBenefits: [GeneralBenefitCatalogue.OTHER],
        environmentalBenefits: [EnvironmentalBenefitCatalogue.OTHER],
        otherGeneralBenefit: ":otherGeneralBenefit",
        otherEnvironmentalBenefit: ":otherEnvironmentalBenefit",
        subgroups: [
          {
            id: subgroups[0].id,
            conditions: "subgroup conditions",
            benefits: [SubgroupBenefitCatalogue.OTHER],
            otherBenefit: "other benefits",
          },
        ],
        name: "should not update name",
      }
    );

    // Act
    const result = await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.UNDERSTANDING_OF_BENEFITS,
      {
        hasBenefits: YesOrNoCatalogue.YES,
        accessibilityImpactDetails: ":accessibilityImpactDetails",
        accessibilityStepsDetails: ":accessibilityStepsDetails",
        generalBenefits: [GeneralBenefitCatalogue.OTHER],
        environmentalBenefits: [EnvironmentalBenefitCatalogue.OTHER],
        otherGeneralBenefit: ":otherGeneralBenefit",
        otherEnvironmentalBenefit: ":otherEnvironmentalBenefit",
        subgroups: [
          {
            id: subgroups[0].id,
            conditions: "subgroup conditions",
            benefits: [SubgroupBenefitCatalogue.PREVENTS_CONDITION_OCCURRING],
            otherBenefit: "other benefits",
          },
        ],
        name: "should not update name",
      }
    );

    const sections = await result.sections;
    subgroups = await result.subgroups;

    // Assert
    expect(result.name).toEqual("My Innovation");
    expect(subgroups[0].otherBenefit).toEqual("other benefits");
    expect(sections.length).toEqual(1);
    expect(subgroups.length).toEqual(1);
  });

  it("should save EVIDENCE_OF_EFFECTIVENESS section with correct properties", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: true,
      impactClinicians: true,
      hasEvidence: YesOrNoCatalogue.NO,
      status: InnovationStatus.IN_PROGRESS,
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    const result = await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS,
      {
        hasEvidence: YesOrNoCatalogue.YES,
      }
    );

    const sections = await result.sections;

    // Assert
    expect(result.name).toEqual("My Innovation");
    expect(result.hasEvidence).toEqual(YesOrNoCatalogue.YES);
    expect(sections.length).toEqual(1);
  });

  it("should save INNOVATION_DESCRIPTION section with correct properties", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      hasFinalProduct: YesOrNoCatalogue.NO,
      impactPatients: true,
      impactClinicians: true,
      hasEvidence: YesOrNoCatalogue.NO,
      status: InnovationStatus.IN_PROGRESS,
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    const result = await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      {
        name: "should not update name",
        description: "description save",
        hasFinalProduct: YesOrNoCatalogue.YES,
        categories: [InnovationCategoryCatalogue.OTHER],
        otherCategoryDescription: "Other",
        areas: [InnovationAreaCatalogue.COVID_19],
        clinicalAreas: [],
        careSettings: [],
        mainPurpose: "main purpose",
      }
    );

    const categories = await result.categories;
    const areas = await result.areas;

    // Assert
    expect(result.name).toEqual("My Innovation");
    expect(result.hasFinalProduct).toEqual(YesOrNoCatalogue.YES);
    expect(categories.length).toEqual(1);
    expect(areas.length).toEqual(1);
  });

  it("should save REGULATIONS_AND_STANDARDS section with correct properties", async () => {
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      hasFinalProduct: YesOrNoCatalogue.NO,
      impactPatients: true,
      impactClinicians: true,
      hasEvidence: YesOrNoCatalogue.NO,
      status: InnovationStatus.IN_PROGRESS,
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const file = await fileService.getUploadUrl(
      "test.txt",
      innovation.id,
      "INNOVATION_EVIDENCE"
    );

    // Act
    await innovationSectionService.saveSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.REGULATIONS_AND_STANDARDS,
      {
        hasRegulationKnowledge: HasRegulationKnowledegeCatalogue.YES_ALL,
        hasOtherIntellectual: "cenas variadas",
        standards: [
          {
            type: InnovationCertificationCatalogue.CE_UKCA_CLASS_I,
            hasMet: StandardMetCatalogue.IN_PROGRESS,
          },
        ],
        files: [file.id],
      }
    );

    // Act
    const result = await innovationSectionService.findSection(
      innovatorRequestUser,
      innovation.id,
      InnovationSectionCatalogue.REGULATIONS_AND_STANDARDS
    );

    // Assert
    expect(result).toBeDefined();
  });

  it("should throw when id is null in saveSection()", async () => {
    let err;
    try {
      await innovationSectionService.saveSection(null, null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid parameters.");
  });

  it("should throw when innovation id invalid in saveSection()", async () => {
    let err;
    try {
      await innovationSectionService.saveSection(
        innovatorRequestUser,
        "D58C433E-F36B-1410-80E0-0032FE5B194B",
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
    expect(err.message).toContain(
      "Invalid parameters. Innovation not found for the user."
    );
  });

  it("should throw when section code is invalid in saveSection()", async () => {
    let err;
    try {
      await innovationSectionService.saveSection(
        innovatorRequestUser,
        "D58C433E-F36B-1410-80E0-0032FE5B194B",
        "invalid",
        {}
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(SectionNotFoundError);
    expect(err.message).toContain("Invalid parameters. Section not found.");
  });

  it("should submmit sections with correct properties without actions", async () => {
    const sectionObj = InnovationSection.new({
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      status: InnovationSectionStatus.DRAFT,
    });

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: false,
      impactClinicians: false,
      status: InnovationStatus.IN_PROGRESS,
      sections: [sectionObj],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    // Act
    await innovationSectionService.submitSections(
      innovatorRequestUser,
      innovation.id,
      [
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        InnovationSectionCatalogue.UNDERSTANDING_OF_NEEDS,
      ]
    );

    const result = await innovationSectionService.findAllInnovationSections(
      innovatorRequestUser,
      innovation.id
    );
    const count = result.sections.reduce(
      (counter: number, obj: InnovationSectionModel) => {
        if (obj.status === InnovationSectionStatus.SUBMITTED) counter += 1;
        return counter;
      },
      0
    );

    // Assert
    expect(count).toEqual(2);
  });

  it("should submmit sections with correct properties with actions", async () => {
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "example@bjss.com",
        },
      ],
    });

    const sectionObj = InnovationSection.new({
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      status: InnovationSectionStatus.DRAFT,
    });

    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qAccessorUserOrganisation = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationQuaAccessorUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      qAccessorUserOrganisation,
      organisationUnit
    );

    const qAccessorRequestUser: RequestUser = {
      id: qualAccessorUser.id,
      type: UserType.ACCESSOR,
      organisationUser: {
        id: qAccessorUserOrganisation.id,
        role: qAccessorUserOrganisation.role,
        organisation: {
          id: accessorOrganisation.id,
          name: accessorOrganisation.name,
        },
      },
      organisationUnitUser: {
        id: organisationQuaAccessorUnitUser.id,
        organisationUnit: {
          id: organisationUnit.id,
          name: organisationUnit.name,
        },
      },
    };

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: false,
      impactClinicians: false,
      status: InnovationStatus.IN_PROGRESS,
      sections: [sectionObj],
      organisationShares: [accessorOrganisation],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovation,
      organisationQuaAccessorUnitUser.id
    );
    await fixtures.createInnovationAction(qAccessorRequestUser, innovation);

    // Act
    await innovationSectionService.submitSections(
      innovatorRequestUser,
      innovation.id,
      [
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        InnovationSectionCatalogue.UNDERSTANDING_OF_NEEDS,
      ]
    );

    const result = await innovationSectionService.findAllInnovationSections(
      innovatorRequestUser,
      innovation.id
    );
    const count = result.sections.reduce(
      (counter: number, obj: InnovationSectionModel) => {
        if (obj.status === InnovationSectionStatus.SUBMITTED) counter += 1;
        return counter;
      },
      0
    );

    // Assert
    expect(count).toEqual(2);
  });

  it("should submmit sections with correct properties with actions even when notifications fail", async () => {
    spyOn(helpers, "getUserFromB2C").and.returnValue({
      displayName: "Q Accessor A",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: "example@bjss.com",
        },
      ],
    });

    spyOn(NotificationService.prototype, "create").and.throwError("error");

    const spy = spyOn(LoggerService.prototype, "error");

    const sectionObj = InnovationSection.new({
      section: InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
      status: InnovationSectionStatus.DRAFT,
    });

    const qualAccessorUser = await fixtures.createAccessorUser();
    const accessorOrganisation = await fixtures.createOrganisation(
      OrganisationType.ACCESSOR
    );
    const qAccessorUserOrganisation = await fixtures.addUserToOrganisation(
      qualAccessorUser,
      accessorOrganisation,
      AccessorOrganisationRole.QUALIFYING_ACCESSOR
    );
    const organisationUnit = await fixtures.createOrganisationUnit(
      accessorOrganisation
    );
    const organisationQuaAccessorUnitUser = await fixtures.addOrganisationUserToOrganisationUnit(
      qAccessorUserOrganisation,
      organisationUnit
    );

    const qAccessorRequestUser: RequestUser = {
      id: qualAccessorUser.id,
      type: UserType.ACCESSOR,
      organisationUser: {
        id: qAccessorUserOrganisation.id,
        role: qAccessorUserOrganisation.role,
        organisation: {
          id: accessorOrganisation.id,
          name: accessorOrganisation.name,
        },
      },
      organisationUnitUser: {
        id: organisationQuaAccessorUnitUser.id,
        organisationUnit: {
          id: organisationUnit.id,
          name: organisationUnit.name,
        },
      },
    };

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorRequestUser.id,
      name: "My Innovation",
      surveyId: "abc",
      impactPatients: false,
      impactClinicians: false,
      status: InnovationStatus.IN_PROGRESS,
      sections: [sectionObj],
      organisationShares: [accessorOrganisation],
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    await fixtures.createSupportInInnovation(
      qAccessorRequestUser,
      innovation,
      organisationQuaAccessorUnitUser.id
    );
    await fixtures.createInnovationAction(qAccessorRequestUser, innovation);

    // Act
    await innovationSectionService.submitSections(
      innovatorRequestUser,
      innovation.id,
      [
        InnovationSectionCatalogue.INNOVATION_DESCRIPTION,
        InnovationSectionCatalogue.UNDERSTANDING_OF_NEEDS,
      ]
    );

    const result = await innovationSectionService.findAllInnovationSections(
      innovatorRequestUser,
      innovation.id
    );
    const count = result.sections.reduce(
      (counter: number, obj: InnovationSectionModel) => {
        if (obj.status === InnovationSectionStatus.SUBMITTED) counter += 1;
        return counter;
      },
      0
    );

    // Assert
    expect(count).toEqual(2);
    expect(spy).toHaveBeenCalled();
  });
  it("should throw when id is null in submitSections()", async () => {
    let err;
    try {
      await innovationSectionService.submitSections(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
    expect(err.message).toContain("Invalid parameters.");
  });

  it("should throw when innovation id invalid in submitSections()", async () => {
    let err;
    try {
      await innovationSectionService.submitSections(
        innovatorRequestUser,
        "D58C433E-F36B-1410-80E0-0032FE5B194B",
        [InnovationSectionCatalogue.INNOVATION_DESCRIPTION]
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationNotFoundError);
    expect(err.message).toContain(
      "Invalid parameters. Innovation not found for the user."
    );
  });
});
