import {
  ClinicalEvidenceTypeCatalogue,
  EvidenceTypeCatalogue,
  Innovation,
  InnovationEvidence,
  InnovationFile,
  InnovationSection,
  InnovationSectionCatalogue,
  User,
  YesOrNoCatalogue,
} from "@domain/index";
import { FileService } from "@services/services/File.service";
import { getConnection } from "typeorm";
import { closeTestsConnection, setupTestsConnection } from "..";
import { InnovationService } from "../services/Innovation.service";
import { InnovationEvidenceService } from "../services/InnovationEvidence.service";
import { InnovationSectionService } from "../services/InnovationSection.service";
import { InnovatorService } from "../services/Innovator.service";
import * as storage_blob from "@azure/storage-blob";
import { executePromisesSequentially } from "@azure/core-http";

const dummy = {
  innovatorId: "innovatorId",
  evidence: {
    summary: "test evidence",
    evidenceType: EvidenceTypeCatalogue.CLINICAL,
    clinicalEvidenceType: ClinicalEvidenceTypeCatalogue.OTHER,
    description: "other description",
  },
};
describe("Innovation Evidence Suite", () => {
  let evidenceService: InnovationEvidenceService;
  let fileService: FileService;
  let innovation: Innovation;

  beforeAll(async () => {
    // await setupTestsConnection();
    const innovationService = new InnovationService(process.env.DB_TESTS_NAME);
    const innovationSectionService = new InnovationSectionService(
      process.env.DB_TESTS_NAME
    );
    const innovatorService = new InnovatorService(process.env.DB_TESTS_NAME);
    evidenceService = new InnovationEvidenceService(process.env.DB_TESTS_NAME);
    fileService = new FileService(process.env.DB_TESTS_NAME);

    const innovator = new User();
    innovator.id = dummy.innovatorId;
    const innovatorUser = await innovatorService.create(innovator);

    const innovationObj = Innovation.new({
      owner: innovatorUser,
      surveyId: "abc",
      name: "My Innovation",
      description: "My Description",
      countryName: "UK",
    });
    innovation = await innovationService.create(innovationObj);

    await innovationSectionService.saveSection(
      innovation.id,
      innovatorUser.id,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS,
      {
        hasEvidence: YesOrNoCatalogue.YES,
      }
    );
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationSection).execute();
    await query.from(Innovation).execute();
    await query.from(User).execute();

    // closeTestsConnection();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(InnovationFile).execute();
    await query.from(InnovationEvidence).execute();
  });

  it("should instantiate the innovation evidence service", async () => {
    expect(evidenceService).toBeDefined();
  });

  it("should create an evidence", async () => {
    const evidence = InnovationEvidence.new({
      ...dummy.evidence,
      innovation: innovation.id,
    });

    const item = await evidenceService.create(
      dummy.innovatorId,
      evidence,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );

    expect(item).toBeDefined();
    expect(item.summary).toEqual(evidence.summary);
  });

  it("should find an evidence", async () => {
    let fileObj = InnovationFile.new({
      displayFileName: "myFile.txt",
      innovation: innovation.id,
    });
    const file = await fileService.create(fileObj);

    fileObj = InnovationFile.new({
      displayFileName: "myDeletedFile.txt",
      innovation: innovation.id,
      deletedAt: new Date(),
    });
    const deletedFile = await fileService.create(fileObj);

    const evidenceObj = InnovationEvidence.new({
      ...dummy.evidence,
      innovation: innovation.id,
      files: [file.id, deletedFile.id],
    });

    const evidence = await evidenceService.create(
      dummy.innovatorId,
      evidenceObj,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );
    const item = await evidenceService.find(evidence.id);

    expect(item).toBeDefined();
    expect(item.summary).toEqual(evidence.summary);
  });

  it("should update an evidence", async () => {
    let fileObj = InnovationFile.new({
      displayFileName: "myFile.txt",
      innovation: innovation.id,
    });
    const file = await fileService.create(fileObj);

    fileObj = InnovationFile.new({
      displayFileName: "myDeletedFile.txt",
      innovation: innovation.id,
    });
    const deletedFile = await fileService.create(fileObj);

    const evidenceObj = InnovationEvidence.new({
      ...dummy.evidence,
      innovation: innovation.id,
      files: [file.id, deletedFile.id],
    });

    const evidence = await evidenceService.create(
      dummy.innovatorId,
      evidenceObj,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );
    evidence.files = [file.id];

    spyOn(storage_blob.BlobClient.prototype, "deleteIfExists").and.returnValue({
      succeeded: true,
    });

    await evidenceService.update(
      evidence.id,
      dummy.innovatorId,
      evidence,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );

    const item = await evidenceService.find(evidence.id);

    expect(item).toBeDefined();
    expect(item.summary).toEqual(evidence.summary);
  });

  it("should delete an evidence", async () => {
    const evidenceObj = InnovationEvidence.new({
      ...dummy.evidence,
      innovation: innovation.id,
    });

    const evidence = await evidenceService.create(
      dummy.innovatorId,
      evidenceObj,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );

    await evidenceService.delete(evidence.id, dummy.innovatorId);

    const result = await evidenceService.find(evidence.id);

    expect(result).toBeNull();
  });
});
