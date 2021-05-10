import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationUnit } from "../entity/organisation/OrganisationUnit.entity";
import { OrganisationType } from "../enums/organisation.enums";

describe("OrganisationUnit Test Suite", () => {
  let organisationRepo: Repository<Organisation>;
  let organisationUnitRepo: Repository<OrganisationUnit>;
  let organisation: Organisation;

  beforeAll(async () => {
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
    organisationUnitRepo = getRepository(
      OrganisationUnit,
      process.env.DB_TESTS_NAME
    );

    const organisationObj = Organisation.new({
      name: "AccessorOrg",
      size: "huge",
      type: OrganisationType.ACCESSOR,
    });
    organisation = await organisationRepo.save(organisationObj);
  });

  afterAll(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(Organisation).execute();
  });

  afterEach(async () => {
    const query = getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete();

    await query.from(OrganisationUnit).execute();
  });

  describe("OrganisationUnit Suite", () => {
    it("should create an OrganisationUnit with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(OrganisationUnit);

      const organisationUnitObj = OrganisationUnit.new({
        organisation,
        name: "New Unit",
      });
      const organisationUnit = await organisationUnitRepo.save(
        organisationUnitObj
      );

      const actual = await organisationUnitRepo.findOne(organisationUnit.id, {
        loadRelationIds: true,
      });

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });
});
