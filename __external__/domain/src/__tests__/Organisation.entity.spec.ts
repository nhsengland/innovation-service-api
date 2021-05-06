import { classToPlain } from "class-transformer";
import { getConnection, getRepository, Repository } from "typeorm";
import { getEntityColumnList } from "../../tools/helpers";
import { Organisation } from "../entity/organisation/Organisation.entity";
import { OrganisationType } from "../enums/organisation.enums";

const dummy = {
  baseOrganisation: {
    name: "my org name",
    size: "huge",
  },
};

describe("Organisation Test Suite", () => {
  let organisationRepo: Repository<Organisation>;

  beforeAll(async () => {
    organisationRepo = getRepository(Organisation, process.env.DB_TESTS_NAME);
  });

  afterEach(async () => {
    await getConnection(process.env.DB_TESTS_NAME)
      .createQueryBuilder()
      .delete()
      .from(Organisation)
      .execute();
  });

  describe("Organisation Suite", () => {
    it("should create an Innovator Organisation with correct properties", async () => {
      // Arrange
      const expectedProps = await getEntityColumnList(Organisation);

      const organisationObj = Organisation.new({
        ...dummy.baseOrganisation,
        type: OrganisationType.INNOVATOR,
      });
      const organisation = await organisationRepo.save(organisationObj);

      const actual = await organisationRepo.findOne(organisation.id);

      // Assert
      expect(Object.keys(classToPlain(actual))).toEqual(
        expect.arrayContaining(expectedProps)
      );
    });
  });

  it("should create an Accessor Organisation with correct properties", async () => {
    // Arrange
    const expectedProps = await getEntityColumnList(Organisation);

    const organisationObj = Organisation.new({
      ...dummy.baseOrganisation,
      type: OrganisationType.ACCESSOR,
    });
    const organisation = await organisationRepo.save(organisationObj);

    const actual = await organisationRepo.findOne(organisation.id);

    // Assert
    expect(Object.keys(classToPlain(actual))).toEqual(
      expect.arrayContaining(expectedProps)
    );
  });
});
