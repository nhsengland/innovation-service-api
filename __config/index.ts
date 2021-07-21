const convict = require("convict");

export default convict({
  clients: {
    web: {
      doc: 'The base url for the web client',
      type: String,
      default:'http://localhost:4200',
      env:'CLIENT_WEB_BASE_URL'
    }
  },
  email: {
    replyToId: {
      doc:
        "This is an email address specified by you to receive replies from your users. You must add at least one reply-to email address before your service can go live.",
      type: String,
      default: "",
      env: "EMAIL_NOTIFICATION_REPLY_TO_ID",
    },
    credentials: {
      doc: "email notification service credentials",
      format: String,
      default: "",
      env: "EMAIL_NOTIFICATION_API_KEY",
    },
    api_key_name: {
      doc: "the api key name. Used to extract ISS and Secret from key",
      type: String,
      default: "",
      env: "EMAIL_NOTIFICATION_API_KEY_NAME",
    },
    api_base_url: {
      doc: "the email notification api base url",
      type: String,
      default: "",
      env: "EMAIL_NOTIFICATION_API_BASE_URL",
    },
    api_email_path: {
      doc: "the email notification api base url",
      type: String,
      default: "",
      env: "EMAIL_NOTIFICATION_API_EMAIL_PATH",
    },
    templates: {
      doc: "email notification templates",
      format: Array,
      default: [
        {
          id: "382c29d3-2263-43dd-b7d7-1e6be73ea098",
          code: "ACCESSORS_ACTION_TO_REVIEW",
          path: {
            url: 'accessor/innovations/:innovationId/action-tracker/:contextId',
            params: {
              innovationId: String,
              contextId: String,
            }
          },
          props: {
            "display_name": String,
            "innovator_name": String,
            "innovation_name": String,
            "action_url": String,
          },
        },
        {
          id: "f63b1459-c1ee-48b3-b0da-12bb19863d19",
          code: "ACCESSORS_ASSIGNED_TO_INNOVATION",
          path: {
            url: 'accessor/innovations/:contextId',
            params: {
              contextId: String,
            }
          },
          props: {
            "display_name": String,
            "qa_name": String,
            "innovation_url": String,
          },
        },
        {
          id: "384ab7ad-6c0c-4e5d-9b0c-e4502bf07c7e",
          code: "INNOVATORS_ACTION_REQUEST",
          path: {
            url: 'innovator/innovations/:innovationId/action-tracker/:contextId',
            params: {
              innovationId: String,
              contextId: String,
            }
          },
          props: {
            "display_name": String,
            "accessor_name": String,
            "unit_name": String,
            "action_url": String,
          },
        },
        {
          id: "078070fd-832a-4df2-8f7b-ad616654cbbd",
          code: "QA_ORGANISATION_SUGGESTED",
          path: {
            url: 'accessor/innovations/:contextId',
            params: {
              innovationId: String,
              contextId: String,
            }
          },
          props: {
            "display_name": String,
            "innovation_url": String,
          },
        },
      ],
    },
  },
});
