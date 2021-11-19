import {
  ActivityLog,
  Innovation,
  InnovationTransfer,
  InnovationTransferStatus,
  User,
} from "@domain/index";
import {
  InnovationTransferAlreadyExistsError,
  InnovationTransferNotFoundError,
  InvalidParamsError,
} from "@services/errors";
import { RequestUser } from "@services/models/RequestUser";
import { InnovationTransferService } from "@services/services/InnovationTransfer.service";
import { NotificationService } from "@services/services/Notification.service";
import * as dotenv from "dotenv";
import * as path from "path";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import * as helpers from "../helpers";
import * as fixtures from "../__fixtures__";

const dummy = {
  newEmail: "new_email@email.com",
};

describe("Innovation Transfer Suite", () => {
  let transferService: InnovationTransferService;
  let innovation: Innovation;

  let innovatorRequestUser: RequestUser;
  let newInnovatorRequestUser: RequestUser;

  beforeAll(async () => {
    // await setupTestsConnection();

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    transferService = new InnovationTransferService(process.env.DB_TESTS_NAME);

    let innovatorUser = await fixtures.createInnovatorUser();
    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
    });

    innovation = await fixtures.saveInnovation(innovationObj);
    innovatorRequestUser = fixtures.getRequestUser(innovatorUser);

    innovatorUser = await fixtures.createInnovatorUser();
    newInnovatorRequestUser = fixtures.getRequestUser(innovatorUser);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(ActivityLog).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationTransfer).execute();
  });

  it("should instantiate the User service", async () => {
    expect(transferService).toBeDefined();
  });

  it("should create a innovation transfer for an existing user", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    expect(item).toBeDefined();
    expect(item.email).toEqual(dummy.newEmail);
  });

  it("should create a innovation transfer for a new user", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    expect(item).toBeDefined();
    expect(item.email).toEqual(dummy.newEmail);
  });

  it("should throw when create with invalid params", async () => {
    let err;
    try {
      await transferService.create(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create with invalid innovationId format", async () => {
    let err;
    try {
      await transferService.create(innovatorRequestUser, dummy.newEmail, "abc");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create and innovation not found", async () => {
    let err;
    try {
      await transferService.create(
        innovatorRequestUser,
        dummy.newEmail,
        "C435433E-F36B-1410-8105-0032FE5B194B"
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when create and transfer already exists for the innovation", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    let err;
    try {
      await transferService.create(
        innovatorRequestUser,
        innovation.id,
        dummy.newEmail
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationTransferAlreadyExistsError);
  });

  it("should throw when create for the innovation owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: innovatorRequestUser.id,
      displayName: ":userName",
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    let err;
    try {
      await transferService.create(
        innovatorRequestUser,
        innovation.id,
        dummy.newEmail
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should update a innovation transfer to CANCELED by the innovation owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.updateStatus(
      innovatorRequestUser,
      item.id,
      InnovationTransferStatus.CANCELED
    );

    expect(result).toBeDefined();
    expect(result.status).toEqual(InnovationTransferStatus.CANCELED);
  });

  it("should update a innovation transfer to DECLINED by the new innovation owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.updateStatus(
      newInnovatorRequestUser,
      item.id,
      InnovationTransferStatus.DECLINED
    );

    expect(result).toBeDefined();
    expect(result.status).toEqual(InnovationTransferStatus.DECLINED);
  });

  it("should update a innovation transfer to CONFIRMED by the new innovation owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const innovationObj = fixtures.generateInnovation({
      owner: { id: innovatorRequestUser.id },
      surveyId: "temp",
    });
    const innovation = await fixtures.saveInnovation(innovationObj);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.updateStatus(
      newInnovatorRequestUser,
      item.id,
      InnovationTransferStatus.COMPLETED
    );

    expect(result).toBeDefined();
    expect(result.finishedAt).toBeDefined();
    expect(result.status).toEqual(InnovationTransferStatus.COMPLETED);
  });

  it("should throw when update status with invalid params", async () => {
    let err;
    try {
      await transferService.updateStatus(null, null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when update status with invalid id format", async () => {
    let err;
    try {
      await transferService.updateStatus(
        innovatorRequestUser,
        "abc",
        InnovationTransferStatus.DECLINED
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when update status with transfer in invalid status invalid params", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      "invalid_email@email.com"
    );

    let err;
    try {
      await transferService.updateStatus(
        newInnovatorRequestUser,
        item.id,
        InnovationTransferStatus.COMPLETED
      );
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InnovationTransferNotFoundError);
  });

  it("should find one innovation transfer by ID for the owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: innovatorRequestUser.id,
      displayName: ":innovatorName",
    });

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const result = await transferService.findOne(innovatorRequestUser, item.id);

    expect(result).toBeDefined();
    expect(result.email).toEqual(dummy.newEmail);
  });

  it("should find one innovation transfer by ID for the new owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      id: innovatorRequestUser.id,
      displayName: ":innovatorName",
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.findOne(
      newInnovatorRequestUser,
      item.id
    );

    expect(result).toBeDefined();
    expect(result.email).toEqual(dummy.newEmail);
  });

  it("should throw when find one with invalid params", async () => {
    let err;
    try {
      await transferService.findOne(null, null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when find one with invalid innovationId format", async () => {
    let err;
    try {
      await transferService.findOne(innovatorRequestUser, "abc");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should find all innovation transfers by owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.findAll(innovatorRequestUser.id);

    expect(result).toBeDefined();
    expect(result.length).toEqual(1);
    expect(result[0].email).toEqual(dummy.newEmail);
  });

  it("should find all innovation transfers by new owner", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.findAll(innovatorRequestUser.id, true);

    expect(result).toBeDefined();
    expect(result.length).toEqual(1);
    expect(result[0].email).toEqual(dummy.newEmail);
  });

  it("should throw when find all with invalid params", async () => {
    let err;
    try {
      await transferService.findAll(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should check one innovation transfer and return true if user exists", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.checkOne(item.id);

    expect(result).toBeDefined();
    expect(result.userExists).toBeTruthy();
  });

  it("should check one innovation transfer and return false if user not exists", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue(undefined);
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    const item = await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.checkOne(item.id);

    expect(result).toBeDefined();
    expect(result.userExists).toBeFalsy();
  });

  it("should throw when check one with invalid params", async () => {
    let err;
    try {
      await transferService.checkOne(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should throw when check one with invalid transferId format", async () => {
    let err;
    try {
      await transferService.checkOne("abc");
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });

  it("should checkUserPendingTransfers and return true if user exists and has invitations", async () => {
    jest
      .spyOn(helpers, "authenticateWitGraphAPI")
      .mockResolvedValue(":access_token");
    jest.spyOn(helpers, "getUserFromB2CByEmail").mockResolvedValue({
      id: newInnovatorRequestUser.id,
      displayName: ":userName",
    });
    jest.spyOn(helpers, "getUserFromB2C").mockResolvedValue({
      displayName: ":userName",
      identities: [
        {
          signInType: "emailAddress",
          issuerAssignedId: dummy.newEmail,
        },
      ],
    });
    jest
      .spyOn(NotificationService.prototype, "sendEmail")
      .mockResolvedValue({} as any);

    await transferService.create(
      innovatorRequestUser,
      innovation.id,
      dummy.newEmail
    );

    const result = await transferService.checkUserPendingTransfers(
      newInnovatorRequestUser.id
    );

    expect(result).toBeDefined();
    expect(result.userExists).toBeTruthy();
    expect(result.hasInvites).toBeTruthy();
  });

  it("should throw when check one with invalid params", async () => {
    let err;
    try {
      await transferService.checkUserPendingTransfers(null);
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err).toBeInstanceOf(InvalidParamsError);
  });
});
