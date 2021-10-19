import { LoggerService } from "@services/services/Logger.service";
import * as dotenv from "dotenv";
import * as path from "path";

describe("Logger Service Suite", () => {
  let loggerService: LoggerService;
  beforeAll(() => {
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    loggerService = new LoggerService();
  });
  it("should intantiate the logger service", () => {
    expect(loggerService).toBeDefined();
  });

  it("should log an error with an error object", () => {
    const error = new Error("a test error");
    const spy = jest.spyOn(loggerService, "error");
    const message = "A test error";
    let err;
    try {
      loggerService.error(message, error);
    } catch (error) {
      err = error;
    }

    expect(spy).toHaveBeenCalledWith(message, error);
    expect(err).toBeUndefined();
  });

  it("should log a log message", () => {
    const spy = jest.spyOn(loggerService, "log");
    const message = "A test error";
    const params = { some: "additional prop", and: "another prop" };
    let err;
    try {
      loggerService.log(message, 1, params);
    } catch (error) {
      err = error;
    }

    expect(spy).toHaveBeenCalledWith(message, 1, params);
    expect(err).toBeUndefined();
  });
});
