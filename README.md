# NHS Innovation Service API
NHS Innovation Service API is the backend layer of the NHS Innovation Service. It will be used by the following user profiles: Unregistered Innovators, Registered innovators and Accessors.

## Dependencies
- Azure Functions Core Tools
- Node
- NPM

## Installation
### Set environment variables file
| Name                                | Required | Default            | Description                          |
| ----------------------------------- | :------: | :----------------: | :----------------------------------: |
| DB_HOST                             |   Yes    |  localhost         |                                      |
| DB_USER                             |   Yes    |  sa                |                                      |
| DB_PWD                              |   Yes    |  Pass@word         |                                      |
| DB_NAME                             |   Yes    |  innovationdb      |                                      |
| DB_TESTS_HOST                       |   Yes    |  localhost         |                                      |
| DB_TESTS_USER                       |   Yes    |  sa                |                                      |
| DB_TESTS_PWD                        |   Yes    |  Pass@word         |                                      |
| DB_TESTS_NAME                       |   Yes    |  tests             |                                      |
| AD_TENANT_NAME                      |   Yes    |                    |                                      |
| AD_CLIENT_ID                        |   Yes    |                    |                                      |
| AD_CLIENT_SECRET                    |   Yes    |                    |                                      |
| STORAGE_CONTAINER                   |          |  fileupload        |                                      |
| STORAGE_ACCOUNT                     |          |                    |                                      |
| STORAGE_BASE_URL                    |          |                    |                                      |
| STORAGE_KEY                         |          |                    |                                      |
| COSMOSDB_ACCOUNT                    |          |                    |                                      |
| COSMOSDB_DB                         |          |                    |                                      |
| COSMOSDB_HOST                       |          |                    |                                      |
| COSMOSDB_KEY                        |          |                    |                                      |
| COSMOSDB_PORT                       |          |                    |                                      |
| EMAIL_NOTIFICATION_API_ISSUER       |          |                    |                                      |
| EMAIL_NOTIFICATION_API_SECRET       |          |                    |                                      |
| EMAIL_NOTIFICATION_API_KEY_NAME     |          |                    |                                      |
| EMAIL_NOTIFICATION_API_BASE_URL     |          |                    |                                      |
| EMAIL_NOTIFICATION_API_EMAIL_PATH   |          |                    |                                      |
| CLIENT_WEB_BASE_URL                 |          |                    |                                      |

Create a new file "local.settings.json" file on the root's project with the above variables.


## Running the app
TODO