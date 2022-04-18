import { EmailTemplate } from "@services/services/Email.service";

export const getTemplates = (): EmailTemplate[] => [
  {
    id: "382c29d3-2263-43dd-b7d7-1e6be73ea098",
    code: "ACCESSORS_ACTION_TO_REVIEW",
    path: {
      url:
        "transactional/accessor/innovations/:innovationId/action-tracker/:contextId",
      params: {
        innovationId: "",
        contextId: "",
      },
    },
    props: {
      display_name: "",
      innovator_name: "",
      innovation_name: "",
      action_url: "",
    },
  },
  {
    id: "f63b1459-c1ee-48b3-b0da-12bb19863d19",
    code: "ACCESSORS_ASSIGNED_TO_INNOVATION",
    path: {
      url: "transactional/accessor/innovations/:contextId",
      params: {
        contextId: "",
      },
    },
    props: {
      display_name: "",
      qa_name: "",
      innovation_url: "",
    },
  },
  {
    id: "384ab7ad-6c0c-4e5d-9b0c-e4502bf07c7e",
    code: "INNOVATORS_ACTION_REQUEST",
    path: {
      url:
        "transactional/innovator/innovations/:innovationId/action-tracker/:contextId",
      params: {
        innovationId: "",
        contextId: "",
      },
    },
    props: {
      display_name: "",
      accessor_name: "",
      unit_name: "",
      action_url: "",
    },
  },
  {
    id: "078070fd-832a-4df2-8f7b-ad616654cbbd",
    code: "QA_ORGANISATION_SUGGESTED",
    path: {
      url:
        "transactional/accessor/innovations/:innovationId/assessments/:contextId",
      params: {
        innovationId: "",
        contextId: "",
      },
    },
    props: {
      display_name: "",
      innovation_url: "",
    },
  },
  {
    id: "94cab12f-7fb9-40f4-bb36-2f54dc96c801",
    code: "INNOVATORS_TRANSFER_OWNERSHIP_NEW_USER",
    path: {
      url: "transactional/transfers/:contextId",
      params: {
        contextId: "",
      },
    },
    props: {
      innovator_name: "",
      innovation_name: "",
      transfer_url: "",
    },
  },
  {
    id: "756c062e-d7c3-490b-99fe-6a57e809c32e",
    code: "INNOVATORS_TRANSFER_OWNERSHIP_EXISTING_USER",
    path: {
      url: "transactional/transfers/:contextId",
      params: {
        contextId: "",
      },
    },
    props: {
      innovator_name: "",
      innovation_name: "",
      transfer_url: "",
    },
  },
  {
    id: "b8814f94-f067-4549-aba0-4f0ff435ca38",
    code: "INNOVATORS_TRANSFER_OWNERSHIP_CONFIRMATION",
    props: {
      innovator_name: "",
      innovation_name: "",
      new_innovator_name: "",
      new_innovator_email: "",
    },
  },
  {
    id: "fa1bda41-8022-42cb-b66a-2db6de23c07d",
    code: "ACCESSORS_INNOVATION_ARCHIVAL_UPDATE",
    props: {
      display_name: "",
      innovation_name: "",
    },
  },
  {
    id: "62486954-b235-4aa6-8b8d-960191fc6e69",
    code: "INNOVATORS_ACCOUNT_CREATED",
    props: {
      innovation_service_url: "",
    },
  },
  {
    id: "f34dd5fd-815b-4cc5-841d-46623ee85ad6",
    code: "INNOVATORS_NEEDS_ASSESSMENT_SUBMITED",
    props: {
      display_name: "",
      innovation_name: "",
    },
  },
  {
    id: "20555202-3ee0-4d98-8434-fb86b6f59e26",
    code: "ASSESSMENT_USERS_INNOVATION_SUBMITED",
    path: {
      url: "transactional/assessment/innovations/:contextId",
      params: {
        contextId: "",
      },
    },
    props: {
      display_name: "",
      innovation_name: "",
      innovation_url: "",
    },
  },
  {
    id: "fc3a50df-ee25-46e4-a51d-33e98406b124",
    code: "INNOVATORS_COMMENT_RECEIVED",
    path: {
      url: "transactional/innovator/innovations/:innovationId/comments",
      params: {
        innovationId: "",
        contextId: "",
      },
    },
    props: {
      display_name: "",
      accessor_name: "",
      unit_name: "",
      comment_url: "",
    },
  },
  {
    id: "cb032a3a-ff63-4794-97fe-c951a54c31dc",
    code: "INNOVATORS_NEEDS_ASSESSMENT_COMPLETED",
    path: {
      url:
        "transactional/innovator/innovations/:innovationId/assessments/:contextId",
      params: {
        contextId: "",
        innovationId: "",
      },
    },
    props: {
      display_name: "",
      innovation_name: "",
      needs_assessment_url: "",
    },
  },
  {
    id: "002cd16a-97da-43b5-836f-8631dbbcca84",
    code: "INNOVATORS_SUPPORT_STATUS_UPDATE",
    path: {
      url: "transactional/innovator/innovations/:innovationId/support",
      params: {
        contextId: "",
        innovationId: "",
      },
    },
    props: {
      display_name: "",
      innovation_name: "",
      organisation_name: "",
      support_url: "",
    },
  },
  {
    id: "93dd9c64-1914-4fa3-b5f3-27e33f2770d5",
    code: "ADMINS_LOGIN_VALIDATION",
    props: {
      display_name: "",
      code: "",
    },
  },
  {
    id: "bea1d925-1fa9-47c2-9fa2-6d630779e06b",
    code: "ACCESSORS_COMMENT_RECEIVED",
    path: {
      url: "transactional/accessor/innovations/:innovationId/comments",
      params: {
        innovationId: "",
        contextId: "",
      },
    },
    props: {
      display_name: "",
      comment_url: "",
      innovation_name: "",
    },
  },
  {
    id: "1ad73192-dc28-4606-a4f3-9dd73aedfd42",
    code: "USER_ACCOUNT_LOCKED",
    props: {
      display_name: "",
    },
  },
  {
    id: "29d6e362-5ecd-4bac-8707-a4d92e9e6762",
    code: "ACCESSORS_UNIT_CHNAGE",
    props: {
      display_name: "",
      old_unit: "",
      old_organisation: "",
      new_unit: "",
      new_organisation: "",
    },
  },
  {
    id: "ab928347-750a-4493-b6b2-df070141727a",
    code: "NEW_QUALIFYING_ACCESSORS_UNIT_CHANGE",
    props: {
      display_name: "",
      user_name: "",
      new_unit: "",
    },
  },
  {
    id: "ac1c44d2-f65c-49cf-bbbf-d1263a7666d9",
    code: "OLD_QUALIFYING_ACCESSORS_UNIT_CHANGE",
    props: {
      display_name: "",
      user_name: "",
      old_unit: "",
    },
  },
];
