import { InnovationFile, Innovation, User } from "@domain/index";
import { getConnection } from "typeorm";
import { FileService } from "../services/File.service";
import { InnovationService } from "../services/Innovation.service";
import { InnovatorService } from "../services/Innovator.service";
import * as storage_blob from "@azure/storage-blob";
import * as dotenv from "dotenv";
import * as path from "path";
describe("File Service Suite", () => {
  let fileService: FileService;
  let innovationService: InnovationService;
  let innovatorService: InnovatorService;

  beforeAll(async () => {
    dotenv.config({
      path: path.resolve(__dirname, "./.environment"),
    });

    fileService = new FileService(process.env.DB_TESTS_NAME);
    innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();
    await query.from(InnovationFile).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();
  });

  it("should instantiate the file service", () => {
    expect(fileService).toBeDefined();
  });

  it("should create an download url with sas", () => {
    const downloadUrl = fileService.getDownloadUrl("AAA-BBB-CCC", "test.txt");
    expect(downloadUrl).toBeDefined();
  });

  it("should delete a file", async () => {
    const innovator = new User();
    innovator.id = ":user_id";
    const innovatorUser = await innovatorService.create(innovator);

    const innovationObj: Innovation = Innovation.new({
      owner: innovatorUser,
      surveyId: new Date().getTime(),
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });

    const innovation = await innovationService.create(innovationObj);

    const innovationFileObj = InnovationFile.new({
      context: ":context",
      displayFileName: "myfile.txt",
      innovation,
    });

    const innovationFile = await fileService.create(innovationFileObj);

    jest.spyOn(storage_blob.BlobClient.prototype, "deleteIfExists").mockResolvedValue({
      succeeded: true,
    } as any);

    const result = await fileService.deleteFile(innovationFile);

    expect(result.succeeded).toBe(true);
  });
});
