import { AccessorOrganisationRole, OrganisationUnit } from "@domain/index";
import { OrganisationModel } from "@services/models/OrganisationModel";
import axios from "axios";

export async function authenticateWitGraphAPI() {
  let accessToken;

  const formData = {
    grant_type: "client_credentials",
    client_id: process.env.AD_CLIENT_ID,
    client_secret: process.env.AD_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
  };

  try {
    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };
    const res = await axios.post(
      `https://login.microsoftonline.com/${process.env.AD_TENANT_NAME}.onmicrosoft.com/oauth2/v2.0/token`,
      uriEncodeObject(formData),
      config
    );

    accessToken = res.data.access_token;
  } catch (error) {
    throw error;
  }

  return accessToken;
}

export async function getUserFromB2C(id: string, accessToken?: string) {
  if (!accessToken) {
    accessToken = await authenticateWitGraphAPI();
  }

  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const result = await axios.get(
      `https://graph.microsoft.com/beta/users/${id}`,
      config
    );
    return result.data;
  } catch (error) {
    throw error;
  }
}

export async function getUsersFromB2C(
  accessToken: string,
  odataFilter: string,
  apiVersion?: string,
  excludeLocked?: boolean
) {
  try {
    apiVersion = apiVersion || "v1.0";

    // if exclude locked, only beta version supports this.
    apiVersion = excludeLocked ? "beta" : apiVersion;

    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const result = await axios.get(
      `https://graph.microsoft.com/${apiVersion}/users?${odataFilter}`,
      config
    );

    // if exclude, filter out locked accounts

    if (excludeLocked) {
      const onlyUnlocked =
        result.data.value?.filter((x) => x.accountEnabled) || [];
      return onlyUnlocked;
    }

    return result.data.value || [];
  } catch (error) {
    throw error;
  }
}

export async function getUserFromB2CByEmail(
  email: string,
  accessToken?: string,
  apiVersion?: string
) {
  if (!accessToken) {
    accessToken = await authenticateWitGraphAPI();
  }

  if (!apiVersion) {
    apiVersion = "v1.0";
  }

  const odataFilter = `$filter=identities/any(c:c/issuerAssignedId eq '${email}' and c/issuer eq '${process.env.AD_TENANT_NAME}.onmicrosoft.com')`;

  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const result = await axios.get(
      `https://graph.microsoft.com/${apiVersion}/users?${odataFilter}`,
      config
    );
    return result.data.value && result.data.value.length > 0
      ? result.data.value[0]
      : null;
  } catch (error) {
    throw error;
  }
}

export async function createB2CUser(
  accessToken: string,
  name: string,
  email: string,
  password: string
) {
  const termsOfUseConsentVersion = `extension_${process.env.AD_EXTENSION_ID}_termsOfUseConsentVersion`;
  const termsOfUseConsentChoice = `extension_${process.env.AD_EXTENSION_ID}_termsOfUseConsentChoice`;
  const termsOfUseConsentDateTime = `extension_${process.env.AD_EXTENSION_ID}_termsOfUseConsentDateTime`;
  const passwordResetOn = `extension_${process.env.AD_EXTENSION_ID}_passwordResetOn`;

  const payload = {
    accountEnabled: true,
    displayName: name,
    passwordPolicies: "DisablePasswordExpiration",
    passwordProfile: {
      password: password,
      forceChangePasswordNextSignIn: false,
    },
    identities: [
      {
        signInType: "emailAddress",
        issuer: `${process.env.AD_TENANT_NAME}.onmicrosoft.com`,
        issuerAssignedId: email,
      },
    ],
  };

  payload[termsOfUseConsentVersion] = "V1";
  payload[termsOfUseConsentChoice] = "AgreeToTermsOfUseConsentYes";
  payload[termsOfUseConsentDateTime] = new Date().toISOString();
  payload[passwordResetOn] = new Date().toISOString();

  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const result = await axios.post(
      `https://graph.microsoft.com/v1.0/users`,
      payload,
      config
    );
    return result.data;
  } catch (error) {
    throw error;
  }
}

export async function saveB2CUser(
  accessToken: string,
  oid: string,
  payload: any
) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${oid}`,
      payload,
      config
    );
  } catch (error) {
    throw error;
  }
}

//
export async function deleteB2CAccount(oid: string) {
  const accessToken = await authenticateWitGraphAPI();

  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    await axios.delete(`https://graph.microsoft.com/v1.0/users/${oid}`, config);
  } catch (error) {
    throw error;
  }
}

//

export function getMergedArray(arrayA: any[], arrayB: any[]) {
  const arr = arrayA.concat(arrayB);

  for (let i = 0; i < arr.length; ++i) {
    for (let j = i + 1; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j, 1);
      }
    }
  }
  return arr;
}

export function uriEncodeObject(obj) {
  const formData = Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];

    return (
      acc + "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value)
    );
  }, "");

  return formData.substring(1);
}

export function hasAccessorRole(roleStr: string) {
  const role = AccessorOrganisationRole[roleStr];
  return (
    [
      AccessorOrganisationRole.QUALIFYING_ACCESSOR,
      AccessorOrganisationRole.ACCESSOR,
    ].indexOf(role) !== -1
  );
}

export function getOrganisationsFromOrganisationUnitsObj(
  organisationUnits: OrganisationUnit[]
): OrganisationModel[] {
  const organisations: OrganisationModel[] = [];

  if (organisationUnits.length > 0) {
    const uniqueOrganisations = [
      ...new Set(organisationUnits.map((item) => item.organisation.id)),
    ];

    for (let idx = 0; idx < uniqueOrganisations.length; idx++) {
      const units = organisationUnits.filter(
        (unit) => unit.organisation.id === uniqueOrganisations[idx]
      );

      const organisation: OrganisationModel = {
        id: units[0].organisation.id,
        name: units[0].organisation.name,
        acronym: units[0].organisation.acronym,
        organisationUnits: units.map((unit) => ({
          id: unit.id,
          name: unit.name,
          acronym: unit.acronym,
        })),
      };

      organisations.push(organisation);
    }
  }

  return organisations;
}

export function checkIfValidUUID(str: string): boolean {
  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(str);
}
