import { InnovationFile } from "@domain/index";
import { getConnection } from "typeorm";
import { FileService } from "../services/File.service";

describe("File Service Suite", () => {
  let fileService: FileService;

  beforeAll(async () => {
    fileService = new FileService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(InnovationFile).execute();
  });

  it("should instantiate the file service", () => {
    expect(fileService).toBeDefined();
  });

  it("should create an download url with sas", () => {
    const downloadUrl = fileService.getDownloadUrl("test.txt");
    expect(downloadUrl).toBeDefined();
  });
});
