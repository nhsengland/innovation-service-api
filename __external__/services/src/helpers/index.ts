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
      `https://graph.microsoft.com/v1.0/users/${id}`,
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

export function uriEncodeObject(obj) {
  const formData = Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];

    return (
      acc + "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value)
    );
  }, "");

  return formData.substring(1);
}
