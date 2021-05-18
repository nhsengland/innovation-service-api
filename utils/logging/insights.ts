/* eslint-disable */ 
const appInsights = require("applicationinsights");

export const start = () => {
  appInsights
    .setup()
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();
};

export type CustomProperties = {
  properties: Object;
};

export const getInstance = () => appInsights;
