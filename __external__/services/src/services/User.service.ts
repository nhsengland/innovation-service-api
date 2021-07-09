import {
  Organisation,
  OrganisationUnitUser,
  OrganisationUser,
  User,
} from "@domain/index";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";
import { getConnection, getRepository, Repository } from "typeorm";
import {
  authenticateWitGraphAPI,
  getUserFromB2C,
  getUsersFromB2C,
  saveB2CUser,
} from "../helpers";
import { ProfileModel } from "../models/ProfileModel";

export class UserService {
  private readonly userRepo: Repository<User>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.userRepo = getRepository(User, connectionName);
  }

  async create(user: User) {
    return await this.userRepo.save(user);
  }

  async getUser(id: string) {
    return await this.userRepo.findOne(id);
  }

  async updateUserDisplayName(payload, oid): Promise<boolean> {
    const accessToken = await authenticateWitGraphAPI();
    await saveB2CUser(accessToken, oid, payload);

    return true;
  }

  async getProfile(id): Promise<ProfileModel> {
    const accessToken = await authenticateWitGraphAPI();
    const user = await getUserFromB2C(accessToken, id);

    if (!user) {
      throw new Error("Invalid user.");
    }

    const email = user.identities.find(
      (identity) => identity.signInType === "emailAddress"
    ).issuerAssignedId;

    const profile: ProfileModel = {
      id,
      displayName: user.displayName,
      type: null,
      organisations: [],
      email,
      phone: user.mobilePhone,
    };

    try {
      const userDb: User = await this.userRepo.findOne(id, {
        relations: [
          "userOrganisations",
          "userOrganisations.organisation",
          "userOrganisations.userOrganisationUnits",
          "userOrganisations.userOrganisationUnits.organisationUnit",
        ],
      });
      if (userDb) {
        const organisations: OrganisationUser[] =
          await userDb.userOrganisations;

        profile.type = userDb.type;
        profile.organisations = [];

        for (let idx = 0; idx < organisations.length; idx++) {
          const orgUser: OrganisationUser = organisations[idx];
          const org: Organisation = orgUser.organisation;
          const orgUnits: OrganisationUnitUser[] =
            orgUser.userOrganisationUnits;

          profile.organisations.push({
            id: org.id,
            name: org.name,
            role: orgUser.role,
            isShadow: org.isShadow,
            organisationUnits: orgUnits?.map((ouu: OrganisationUnitUser) => ({
              id: ouu.organisationUnit.id,
              name: ouu.organisationUnit.name,
            })),
          });
        }
      }
    } catch (error) {
      throw error;
    }

    return profile;
  }

  async getListOfUsers(ids: string[]): Promise<ProfileSlimModel[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const accessToken = await authenticateWitGraphAPI();
    const uniqueUserIds = ids.filter((x, i, a) => a.indexOf(x) == i);
    const userIds = uniqueUserIds.map((u) => `"${u}"`).join(",");
    const odataFilter = `$filter=id in (${userIds})`;

    const user = (await getUsersFromB2C(accessToken, odataFilter)) || [];

    const result = user.map((u) => ({
      id: u.id,
      displayName: u.displayName,
    }));

    return result;
  }
}
