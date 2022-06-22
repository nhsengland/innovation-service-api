import { ConnectionOptions, createConnection, getConnection } from "typeorm";
import { entities } from "@services/entities/index";

export {
  initializeAllServices,
  initializeServices,
  Services,
} from "../src/services";
export { AccessorService } from "../src/services/Accessor.service";
export { CommentService } from "../src/services/Comment.service";
export { FileService } from "../src/services/File.service";
export { InnovatorService } from "../src/services/Innovator.service";
export { InnovationActionService } from "../src/services/InnovationAction.service";
export { InnovationAssessmentService } from "../src/services/InnovationAssessment.service";
export { InnovationService } from "../src/services/Innovation.service";
export { InnovationEvidenceService } from "../src/services/InnovationEvidence.service";
export { InnovationSectionService } from "../src/services/InnovationSection.service";
export { InnovationSuggestionService } from "../src/services/InnovationSuggestion.service";
export { InnovationSupportService } from "../src/services/InnovationSupport.service";
export { InnovationSupportLogService } from "../src/services/InnovationSupportLog.service";
export { InnovationTransferService } from "../src/services/InnovationTransfer.service";
export { OrganisationService } from "../src/services/Organisation.service";
export { ActivityLogService } from "../src/services/ActivityLog.service";
export { TermsOfUseService } from "../src/services/TermsOfUse.service";

export { BaseService } from "../src/services/Base.service";
export { UserService } from "../src/services/User.service";
export {
  Innovation,
  InnovationAction,
  InnovationArea,
  InnovationAssessment,
  InnovationCareSetting,
  InnovationCategory,
  InnovationClinicalArea,
  InnovationDeploymentPlan,
  InnovationEnvironmentalBenefit,
  InnovationPatientsCitizensBenefit,
  InnovationEvidence,
  InnovationStandard,
  InnovationGeneralBenefit,
  InnovationRevenue,
  InnovationSection,
  InnovationSubgroup,
  InnovationSubgroupBenefit,
  InnovationSupport,
  InnovationSupportLog,
  InnovationSupportType,
  InnovationTransfer,
  InnovationTransferStatus,
  InnovationUserTest,
  Organisation,
  OrganisationUnit,
  OrganisationUnitUser,
  OrganisationUser,
  Comment,
  Notification,
  NotificationUser,
  NotificationPreference,
  User,
  YesOrNoCatalogue,
  CarePathwayCatalogue,
  PatientRangeCatalogue,
  CostComparisonCatalogue,
  EvidenceTypeCatalogue,
  ClinicalEvidenceTypeCatalogue,
  StandardMetCatalogue,
  MainPurposeCatalogue,
  HasMarketResearchCatalogue,
  HasPatentsCatalogue,
  HasRegulationKnowledegeCatalogue,
  InnovationPathwayKnowledgeCatalogue,
  HasTestsCatalogue,
  HasKnowledgeCatalogue,
  HasFundingCatalogue,
  HasResourcesToScaleCatalogue,
  InnovationCategoryCatalogue,
  InnovationAreaCatalogue,
  InnovationClinicalAreaCatalogue,
  InnovationCareSettingCatalogue,
  InnovationRevenueTypeCatalogue,
  InnovationCertificationCatalogue,
  InnovationStatus,
  InnovationActionStatus,
  InnovationSectionStatus,
  InnovationSupportStatus,
  InnovationSectionCatalogue,
  InnovationSectionAliasCatalogue,
  OrganisationType,
  AccessorOrganisationRole,
  InnovatorOrganisationRole,
  OrganisationUserRole,
  UserType,
  ServiceRole,
  ActivityLog,
  UserRole,
  Role,
} from "@domain/index";

const getDefaultConnection = (): ConnectionOptions => ({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  name: "default",
  type: "mssql",
  synchronize: false,
  extra: {
    options: {
      enableArithAbort: true,
    },
  },
});

const getTestsConnection = (): ConnectionOptions => ({
  host: process.env.DB_TESTS_HOST,
  username: process.env.DB_TESTS_USER,
  password: process.env.DB_TESTS_PWD,
  database: process.env.DB_TESTS_NAME || "tests",
  name: "tests",
  type: "mssql",
  synchronize: false,
  extra: {
    options: {
      enableArithAbort: true,
    },
  },
});

export const setupConnection = async () => {
  await createConnection({
    ...getDefaultConnection(),
    entities: entities,
  });
};

export const setupTestsConnection = async () => {
  await createConnection({
    ...getTestsConnection(),
    entities: entities,
  });
};

export const closeConnection = () => {
  getConnection("default").close();
};

export const closeTestsConnection = () => {
  getConnection("tests").close();
};
