import jwt_decode from "jwt-decode";

export const decodeToken = (token) => {
  return jwt_decode(token) as any;
};
