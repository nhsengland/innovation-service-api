import { OrderByClauseType, OrderByCriteria } from "@services/types";

export const orderClauseMappings = {
  fields: {
    name: "innovation.name",
    submittedAt: "innovation.submittedAt",
    location: "innovation.countryName",
    mainCategory: "innovation.mainCategory",
    assessmentStartDate: "assessment.createdAt",
    assessmentDate: "assessment.finishedAt",
    engagingEntities: "organisation.name",
    updatedAt: "innovation.updatedAt",
  },
  defaults: {
    field: "innovation.updatedAt",
    direction: "ASC",
  },
};
