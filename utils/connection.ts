import * as mongoose from "mongoose";
import { setupConnection } from "nhs-aac-domain-services";

let isCosmosConnected = false;
let isSQLConnected = false;

export const setupCosmosDb = async () => {
  if (!isCosmosConnected) {
    const connectionString = `mongodb://${process.env.COSMOSDB_ACCOUNT}:${process.env.COSMOSDB_KEY}@${process.env.COSMOSDB_HOST}:${process.env.COSMOSDB_PORT}/${process.env.COSMOSDB_DB}?ssl=true`;
    await mongoose.connect(connectionString, {
      dbName: process.env.COSMOS_DB_NAME,
    });
    isCosmosConnected = true;
  }
};

export const setupSQLConnection = async () => {
  if (!isSQLConnected) {
    await setupConnection();
    isSQLConnected = true;
  }
};
