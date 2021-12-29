import * as mongoose from "mongoose";
import { setupConnection } from "@services/index";
import * as dotenv from "dotenv";

let isCosmosConnected = false;
let isSQLConnected = false;

dotenv.config();

export const setupCosmosDb = async () => {
  if (!isCosmosConnected) {
    const connectionString = `mongodb://${
      process.env.COSMOSDB_ACCOUNT
    }:${escape(process.env.COSMOSDB_KEY)}@${process.env.COSMOSDB_HOST}:${
      process.env.COSMOSDB_PORT
    }/${process.env.COSMOSDB_DB}?ssl=true&retryWrites=false`;
    await mongoose.connect(connectionString, {
      dbName: process.env.COSMOS_DB_NAME,
    });
    isCosmosConnected = true;
  }
};

// export const setupCosmosDb = async () => {
//   if (!isCosmosConnected) {
//     const connectionString = `mongodb://localhost`;
//     await mongoose.connect(connectionString, {
//       dbName: process.env.COSMOSDB_DB,
//     });
//     isCosmosConnected = true;
//   }
// };

export const closeTestsCosmosDb = async () => {
  if (isCosmosConnected) {
    await mongoose.disconnect();
    isCosmosConnected = false;
  }
};

export const setupSQLConnection = async () => {
  if (!isSQLConnected) {
    await setupConnection();
    isSQLConnected = true;
  }
};

export const setIsSQLConnected = (value: boolean) => {
  isSQLConnected = value;
};

export const setIsCosmosConnected = (value: boolean) => {
  isCosmosConnected = value;
};
