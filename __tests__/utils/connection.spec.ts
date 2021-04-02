import * as mongoose from "mongoose";
import { setupCosmosDb, setupSQLConnection } from "../../utils/connection";

import * as domain_services from "nhs-aac-domain-services";
import rewire = require("rewire");
const rewiredConnection = rewire("../../utils/connection");

describe("[Utils] Connection suite", () => {
  describe("Cosmos Connection", () => {
    it("should successfuly connect", async () => {
      // Arrange
      let err;
      spyOn(mongoose, "connect").and.returnValue(null);
      // Act
      try {
        await setupCosmosDb();
      } catch (error) {
        err = error;
      }
      // Assert
      expect(err).toBeUndefined();
    });

    it("should bypass connection when isCosmosConnected is true", async () => {
      // Arrange
      let err;
      rewiredConnection.isCosmosConnected = true;
      const spy = spyOn(mongoose, "connect").and.returnValue(null);
      // Act
      try {
        await setupCosmosDb();
      } catch (error) {
        err = error;
      }
      // Assert
      expect(err).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });
  describe("SQL Connection", () => {
    it("should successfuly connect", async () => {
      // Arrange
      let err;
      spyOn(domain_services, "setupConnection").and.returnValue(null);
      // Act
      try {
        await setupSQLConnection();
      } catch (error) {
        err = error;
      }
      // Assert
      expect(err).toBeUndefined();
    });

    it("should bypass connection when isSQLConnected is true", async () => {
      // Arrange
      let err;
      rewiredConnection.isSQLConnected = true;
      const spy = spyOn(domain_services, "setupConnection").and.returnValue(
        null
      );
      // Act
      try {
        await setupSQLConnection();
      } catch (error) {
        err = error;
      }
      // Assert
      expect(err).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
