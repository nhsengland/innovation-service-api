import { OrganisationUser, User } from "@domain/index";
import { getConnection, getRepository, Repository } from "typeorm";
import { ProfileModel } from "../models/ProfileModel";
import { OrganisationService } from "./Organisation.service";
import {
  authenticateWitGraphAPI,
  getUserFromB2C,
  saveB2CUser,
} from "../helpers";

export class UserService {
  private readonly organisationService: OrganisationService;
  private readonly userRepo: Repository<User>;

  constructor(connectionName?: string) {
    getConnection(connectionName);
    this.organisationService = new OrganisationService(connectionName);
    this.userRepo = getRepository(User, connectionName);
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

    const profile: ProfileModel = {
      id,
      displayName: user.displayName,
      type: null,
      organisations: [],
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
}
