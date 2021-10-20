import { EmailTemplate } from "@services/services/Email.service";

export const getTemplates = (): EmailTemplate[] => [
  {
    id: "382c29d3-2263-43dd-b7d7-1e6be73ea098",
    code: "ACCESSORS_ACTION_TO_REVIEW",
    path: {
      url: "accessor/innovations/:innovationId/action-tracker/:contextId",
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
      url: "accessor/innovations/:contextId",
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
      url: "innovator/innovations/:innovationId/action-tracker/:contextId",
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
      url: "accessor/innovations/:contextId",
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
      url: "transfers/:contextId",
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
      url: "transfers/:contextId",
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
      url: "innovator/innovations/:innovationId/comments/:contextId",
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
    props: {
      display_name: "",
      innovation_name: "",
      needs_assessment_url: "",
    },
  },
];
