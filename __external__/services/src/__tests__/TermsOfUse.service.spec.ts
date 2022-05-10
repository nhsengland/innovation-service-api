import { closeTestsConnection, setupTestsConnection, UserType } from "..";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { TermsOfUseService } from "@services/services/TermsOfUse.service";
import {
  InvalidParamsError,
  InvalidUserTypeError,
  UniqueKeyError,
} from "@services/errors";
import { TouType } from "@domain/index";
const dummy = {
  email: "email@email.com",
  requestUser: {
    id: "test",
    type: UserType.ADMIN,
  },
};
describe("[Terms Of Use suite", () => {
  let touService: TermsOfUseService;
  beforeAll(async () => {
    // await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    touService = new TermsOfUseService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
  });

  afterAll(async () => {
    // await closeTestsConnection();
  });

  it("should throw when creating with invalid params", async () => {
    let err: InvalidParamsError;
    try {
      await touService.createTermsOfUse(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when createUser with invalid requestUser type params", async () => {
    const requestUser = {
      id: ":user_id",
      type: UserType.ASSESSMENT,
    };
    let err: InvalidUserTypeError;
    try {
      await touService.createTermsOfUse(requestUser, {
        name: "TERMS OF USE 1",
        summary: "TEST",
        touType: TouType.INNOVATOR,
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserTypeError);
  });

  it("Should create terms and use ", async () => {
    const result = await touService.createTermsOfUse(dummy.requestUser, {
      name: "TERMS OF USE 2",
      summary: "TEST",
      touType: TouType.SUPPORT_ORGANISATION,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("Should throw error when creating terms and use with same name ", async () => {
    let err: UniqueKeyError;
    try {
      await touService.createTermsOfUse(dummy.requestUser, {
        name: "TERMS OF USE 2",
        summary: "TEST",
        touType: TouType.INNOVATOR,
      });
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(UniqueKeyError);
    expect(err.message.toLocaleLowerCase()).toBe(
      "violation of unique key constraint"
    );
  });

  it("should throw when updating with invalid params", async () => {
    let err: InvalidParamsError;
    try {
      await touService.updateTermsOfUse(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when updating with invalid requestUser type params", async () => {
    const requestUser = {
      id: ":user_id",
      type: UserType.ASSESSMENT,
    };
    let err: InvalidUserTypeError;
    try {
      await touService.updateTermsOfUse(
        requestUser,
        {
          name: "TERMS OF USE 1",
          summary: "TEST",
          touType: TouType.INNOVATOR,
        },
        "Test"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidUserTypeError);
  });

  it("Should throw error when update terms and use ", async () => {
    let err: Error;
    try {
      const result = await touService.updateTermsOfUse(
        dummy.requestUser,
        {
          name: "TERMS OF USE 4",
          summary: "TEST",
          touType: TouType.SUPPORT_ORGANISATION,
        },
        "Test"
      );
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(Error);
    expect(err.message.toLocaleLowerCase()).toBe("error updating tersofuse");
  });

  it("Should update terms and use ", async () => {
    const result = await touService.createTermsOfUse(dummy.requestUser, {
      name: "TERMS OF USE 8",
      summary: "TEST",
      touType: TouType.SUPPORT_ORGANISATION,
    });

    const results = await touService.updateTermsOfUse(
      dummy.requestUser,
      {
        name: "TERMS OF USE 9",
        summary: "TEST",
        touType: TouType.SUPPORT_ORGANISATION,
      },
      result.id
    );

    expect(results).toBeDefined();
  });
});
