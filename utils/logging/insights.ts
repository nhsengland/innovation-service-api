/* eslint-disable */ 
const appInsights = require("applicationinsights");

export const start = () => {
  appInsights
    .setup()
    .start();
};

export type CustomProperties = {
  properties: Object;
};

export const getInstance = () => appInsights;
