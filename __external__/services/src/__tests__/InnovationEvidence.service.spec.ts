import * as storage_blob from "@azure/storage-blob";
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
import { InnovationEvidenceService } from "../services/InnovationEvidence.service";
import * as fixtures from "../__fixtures__";

const dummy = {
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
  let innovatorUser: User;

  beforeAll(async () => {
    // await setupTestsConnection();
    evidenceService = new InnovationEvidenceService(process.env.DB_TESTS_NAME);
    fileService = new FileService(process.env.DB_TESTS_NAME);

    innovatorUser = await fixtures.createInnovatorUser();

    const innovationObj = fixtures.generateInnovation({
      owner: innovatorUser,
      surveyId: "abc",
    });
    innovation = await fixtures.saveInnovation(innovationObj);
    await fixtures.createSectionInInnovation(
      innovation,
      innovatorUser,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS,
      { hasEvidence: YesOrNoCatalogue.YES }
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
      innovatorUser.id,
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
      innovatorUser.id,
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
      innovatorUser.id,
      evidenceObj,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );
    evidence.files = [file.id];

    spyOn(storage_blob.BlobClient.prototype, "deleteIfExists").and.returnValue({
      succeeded: true,
    });

    await evidenceService.update(
      evidence.id,
      innovatorUser.id,
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
      innovatorUser.id,
      evidenceObj,
      InnovationSectionCatalogue.EVIDENCE_OF_EFFECTIVENESS
    );

    await evidenceService.delete(evidence.id, innovatorUser.id);

    const result = await evidenceService.find(evidence.id);

    expect(result).toBeNull();
  });
});
