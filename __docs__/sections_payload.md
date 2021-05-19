************************************************************
** 1.1 - INNOVATION_DESCRIPTION
************************************************************
{
	"section": "INNOVATION_DESCRIPTION",
	"data": {
		"id": "string",
		"description": "string",
		"hasFinalProduct": "YesOrNoCatalogue",
		"categories": [InnovationCategoryCatalogue],
		"mainCategory": "InnovationCategoryCatalogue",
		"otherCategoryDescription": "string",
		"areas": [InnovationAreaCatalogue],
		"clinicalAreas": [InnovationClinicalAreaCatalogue],
		"careSettings": [InnovationCareSettingCatalogue],
		"mainPurpose": "string",
		"supportTypes": [InnovationSupportTypeCatalogue]
	}
}

************************************************************
** 1.2 - VALUE_PROPOSITION
************************************************************
{
	"section": "VALUE_PROPOSITION",
	"data": {
		"id": "string",
		"hasProblemTackleKnowledge": "HasProblemTackleKnowledgeCatalogue",
		"problemsTackled": "string",
		"problemsConsequences": "string",
		"intervention": "string",		
		"interventionImpact": "string"
	}
}

************************************************************
** 2.1
************************************************************
{
	"section": "UNDERSTANDING_OF_NEEDS",
	"data": {
		"hasSubgroups": "HasSubgroupsCatalogue",
		"subgroups": [
			{
				"id": "string?",
				"name": "string",
				"conditions": "string"
			}
		],
	}
}

************************************************************
** 2.2
************************************************************
{
	"section": "UNDERSTANDING_OF_BENEFITS",
	"data": {
		"hasBenefits": "HasBenefitsCatalogue",
		"subgroups": [
			{
				"id": "string",
				"name": "string",
				"benefits": "string"
			}
		],
		"benefits": "string"
	}
}

************************************************************
** 2.3 - EVIDENCE_OF_EFFECTIVENESS
************************************************************
{
	"section": "EVIDENCE_OF_EFFECTIVENESS",
	"data": {
		"hasEvidence": "HasEvidenceCatalogue",
		"evidence": [
			{
				"id": "string?",
				"evidenceType": "EvidenceTypeCatalogue",
				"clinicalEvidenceType": "ClinicalEvidenceTypeCatalogue",
				"description": "string",
				"summary": "string"
				"files": ["string"]
			}
		]
	}
}

************************************************************
** 3.1 - MARKET_RESEARCH
************************************************************
{
	"section": "MARKET_RESEARCH",
	"data": {
		"id": "string",
		"marketResearch": "string",
		"hasMarketResearch": "HasMarketResearchCatalogue"
	}
}

************************************************************
** 3.2 - INTELLECTUAL_PROPERTY
************************************************************
{
	"section": "INTELLECTUAL_PROPERTY",
	"data": {
		"id": "string",
		"hasPatents": "HasPatentsCatalogue",
		"hasOtherIntellectual": "YesOrNoCatalogue",
		"otherIntellectual": "string"
	}
}

************************************************************
** 4.1 - REGULATIONS_AND_STANDARDS
************************************************************
{
	"section": "REGULATIONS_AND_STANDARDS",
	"data": {
		"id": "string",
		"hasRegulationKnowledge": "HasRegulationKnowledegeCatalogue",
		"otherRegulationDescription": "string",
		"standards": [
			{
				"id": "string",
				"type": "InnovationStandardCatologue",
				"hasMet": "StandardMetCatalogue"
			}
		],
		"files": ["string"]
	}
}

************************************************************
** 5.1 - CURRENT_CARE_PATHWAY
************************************************************
{
	"section": "CURRENT_CARE_PATHWAY",
	"data": {
		"id": "string",
		"hasUKPathwayKnowledge": "YesOrNoCatalogue",
		"innovationPathwayKnowledge": "InnovationPathwayKnowledgeCatalogue",
		"potentialPathway": "string",
		"subgroups": [
			{
				"id": "string",
				"carePathway": "CarePathwayCatalogue"
			}
		]
	}
}

************************************************************
** 5.2 - TESTING_WITH_USERS
************************************************************
{
	"section": "TESTING_WITH_USERS",
	"data": {
		"id": "string",
		"hasTests": "HasTestsCatalogue",
		"userTests": [
			{
				"id": "string",
				"kind": "string",
				"feedback": "string"
			}
		],
		"files": ["string"]
	}
}

************************************************************
** 6.1 - COST_OF_INNOVATION
************************************************************
{
	"section": "COST_OF_INNOVATION",
	"data": {
		"id": "string",
		"hasCostKnowledge": "HasTestsCatalogue",
		"subgroups": [
			{
				"id": "string",
				"costDescription": "string",
				"patientsRange": "PatientRangeCatalogue",
				"sellExpectations": "string",
				"usageExpectations": "string"
			}
		]
	}
}

************************************************************
** 6.2 - COMPARATIVE_COST_BENEFIT
************************************************************
{
	"section": "COMPARATIVE_COST_BENEFIT",
	"data": {
		"id": "string",
		"hasCostSavingKnowledge": "HasKnowledgeCatalogue",
		"hasCostCareKnowledge": "HasKnowledgeCatalogue",
		"subgroups": [
			{
				"id": "string",
				"costComparison": "CostComparisonCatalogue"
			}
		]
	}
}

************************************************************
** 7.1 - REVENUE_MODEL
************************************************************
{
	"section": "REVENUE_MODEL",
	"data": {
		"id": "string",
		"hasRevenueModel": "YesOrNoCatalogue",
		"payingOrganisations": "string",
		"benefittingOrganisations": "string",
		"hasFunding": "HasFundingCatalogue",
		"fundingDescription": "string",
		"otherRevenueDescription": "string",
		"revenues": [InnovationRevenueTypeCatalogue]
	}
}

************************************************************
** 8.1 - IMPLEMENTATION_PLAN
************************************************************
{
	"section": "IMPLEMENTATION_PLAN",
	"data": {
		"id": "string",
		"hasDeployPlan": "YesOrNoCatalogue",
		"isDeployed": "YesOrNoCatalogue",
		"hasResourcesToScale", "HasResourcesToScaleCatalogue",
		"deploymentPlans": [
			{
				"id": "string",
				"name": "string",
				"commercialBasis": "string",
				"orgDeploymentAffect": "string"
			}
		],
		"files": ["string"]
	}
}