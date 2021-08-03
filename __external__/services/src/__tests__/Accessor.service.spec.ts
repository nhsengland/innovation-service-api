import { AccessorService } from "../services/Accessor.service";
import { getConnection } from "typeorm";
import { User } from "@domain/index";
import * as dotenv from "dotenv";
import * as path from "path";

describe("Accessor Service Suite", () => {
  let accessorService: AccessorService;

  beforeAll(async () => {
    accessorService = new AccessorService(process.env.DB_TESTS_NAME);

    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(User).execute();
  });

  it("should instantiate the accessor service", async () => {
    expect(accessorService).toBeDefined();
  });

  it("should create an accessor", async () => {
    const accessor = new User();
    accessor.id = "abc-def-ghi";

    const item = await accessorService.create(accessor);

    expect(item.id).toEqual(accessor.id);
  });
});
