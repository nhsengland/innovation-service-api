import { AccessorOrganisationRole } from "@domain/index";
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

export async function getUserFromB2C(accessToken: string, id: string) {
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
  odataFilter: string
) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const result = await axios.get(
      `https://graph.microsoft.com/v1.0/users?${odataFilter}`,
      config
    );
    return result.data.value || [];
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
