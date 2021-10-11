/* eslint-disable */
import * as appInsights from "applicationinsights";

export const start = () => {
  appInsights
    .setup()
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();
};

export type CustomProperties = {
  properties: Object;
};

export const getInstance: any = () => appInsights;
export const getInstanceAndDefault = () => appInsights.defaultClient;