import { OrganisationUser, User } from "@domain/index";
import { getConnection, getRepository, Repository } from "typeorm";
import { ProfileModel } from "../models/ProfileModel";
import { OrganisationService } from "./Organisation.service";
import {
  authenticateWitGraphAPI,
  getUserFromB2C,
  getUsersFromB2C,
  saveB2CUser,
} from "../helpers";
import { ProfileSlimModel } from "@services/models/ProfileSlimModel";

export class UserService {
  private readonly organisationService: OrganisationService;
  private readonly userRepo: Repository<User>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.organisationService = new OrganisationService(connectionName);
    this.userRepo = getRepository(User, connectionName);
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
      const user: User = await this.userRepo.findOne(id);
      if (user) {
        const organisations: OrganisationUser[] = await this.organisationService.findUserOrganisations(
          id
        );

        profile.type = user.type;
        profile.organisations = organisations?.map((o) => {
          return {
            id: o.organisation.id,
            name: o.organisation.name,
            role: o.role,
          };
        });
      }
    } catch (error) {
      throw error;
    }

    return profile;
  }

  async getListOfUsers(ids: string[]): Promise<ProfileSlimModel[]> {
    const accessToken = await authenticateWitGraphAPI();
    const userIds = ids.map((u) => `"${u}"`).join(",");
    const odataFilter = `$filter=id in (${userIds})`;

    const user = await getUsersFromB2C(accessToken, odataFilter);
    const result = user.map((u) => ({
      id: u.id,
      displayName: u.displayName,
    }));
    return result;
  }
}
