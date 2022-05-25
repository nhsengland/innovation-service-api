import {
  closeTestsConnection,
  setupTestsConnection,
  UserService,
  UserType,
} from "..";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fixtures from "../__fixtures__";
import { getConnection, getRepository } from "typeorm";
import { TermsOfUseService } from "@services/services/TermsOfUse.service";
import {
  InvalidParamsError,
  InvalidUserTypeError,
  UniqueKeyError,
} from "@services/errors";
import { TermsOfUse, TermsOfUseUser, TouType, User } from "@domain/index";
const dummy = {
  email: "email@email.com",
  requestUser: {
    id: "test",
    externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
    type: UserType.ADMIN,
  },
};

const dummyInnovator = {
  email: "email@email.com",
  requestUser: {
    id: "C7095D87-C3DF-46F6-A503-001B083F4639",
    externalId: "C7095D87-C3DF-46F6-A503-001B083F4639",
    type: UserType.INNOVATOR,
  },
};
describe("Terms Of Use Service suite", () => {
  let touService: TermsOfUseService;
  beforeAll(async () => {
    //await setupTestsConnection();
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
    touService = new TermsOfUseService(process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(TermsOfUseUser).execute();
    await query.from(TermsOfUse).execute();
    await query.from(User).execute();
  });

  afterAll(async () => {
    //await closeTestsConnection();
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

  it("should throw when createTermsOfUse with invalid requestUser type params", async () => {
    const requestUser = {
      id: ":user_id",
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
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
    const randomName = (Math.random() + 1).toString(36);

    const result = await touService.createTermsOfUse(dummy.requestUser, {
      name: randomName,
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
        name: "TERMS OF USE",
        summary: "TEST DUPLICATE NAME",
        touType: TouType.INNOVATOR,
      });

      await touService.createTermsOfUse(dummy.requestUser, {
        name: "TERMS OF USE",
        summary: "TEST DUPLICATE NAME 2",
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
      externalId: "C7095D87-C3DF-46F6-A503-001B083F4630",
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
    const randomName = (Math.random() + 1).toString(36);
    const randomNameToUpdate = (Math.random() + 1).toString(36);

    const result = await touService.createTermsOfUse(dummy.requestUser, {
      name: randomName,
      summary: "TEST",
      touType: TouType.SUPPORT_ORGANISATION,
    });

    const results = await touService.updateTermsOfUse(
      dummy.requestUser,
      {
        name: randomNameToUpdate,
        summary: "TEST",
        touType: TouType.SUPPORT_ORGANISATION,
      },
      result.id
    );

    expect(results).toBeDefined();
  });

  it("Should accept terms of use ", async () => {
    const randomName = (Math.random() + 1).toString(36);

    const newToU = await touService.createTermsOfUse(dummy.requestUser, {
      name: randomName,
      summary: "TEST",
      touType: TouType.INNOVATOR,
    });

    await touService.updateTermsOfUse(
      dummy.requestUser,
      {
        name: newToU.name,
        touType: TouType.INNOVATOR,
        releasedAt: new Date(),
      },
      newToU.id
    );

    const innovatorUser = await fixtures.createInnovatorUser();

    const innovatorRequestUser = fixtures.getRequestUser(innovatorUser);

    jest.spyOn(touService, "findTermsOfUseById").mockResolvedValue({
      id: newToU.id,
      touType: "INNOVATOR",
      releasedAt: "2022-05-11 12:49:10.9760000",
    } as any);

    const result = await touService.acceptTermsOfUse(
      innovatorRequestUser,
      newToU.id
    );

    expect(result).toBeDefined();
    expect(result).toBe("Terms Accepted");
  });

  it("Should check if user accepted terms of use ", async () => {
    jest
      .spyOn(getRepository(TermsOfUse, process.env.DB_TESTS_NAME), "findOne")
      .mockResolvedValue({
        id: "FAAAAAAA-C3DF-46F6-A503-001B083F4638",
        touType: "INNOVATOR",
        name: "name",
        summary: "summary",
        releasedAt: "2022-05-11 12:49:10.9760000",
      } as any);

    jest
      .spyOn(
        getRepository(TermsOfUseUser, process.env.DB_TESTS_NAME),
        "findOne"
      )
      .mockResolvedValue({} as any);

    const result = await touService.checkIfUserAccepted(
      dummyInnovator.requestUser
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("FAAAAAAA-C3DF-46F6-A503-001B083F4638");
    expect(result.isAccepted).toBe(true);
  });
});
