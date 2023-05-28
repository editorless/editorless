import { Octokit } from "@octokit/rest";
import * as jose from "jose";

export type AuthData = {
  id: string;
  avatar: string;
  username: string;
  name: string;
  email: string;
  token: string;
};
const TokenDataKeys = ["id", "avatar", "username", "name", "email", "token"];

const secret = new TextEncoder().encode(process.env.TOKEN_SECRET);

export async function getAuthData(token?: string, validateRemote = false) {
  if (!token) {
    return null;
  }

  const data = await validateTokenData(token);

  if (!data) {
    return null;
  }

  if (validateRemote) {
    const valid = await validateRemoteAccess(data.token);

    if (!valid) {
      return null;
    }
  }

  return data;
}

async function validateTokenData(token: string) {
  try {
    const data = await jose.jwtVerify(token, secret, {
      issuer: process.env.BASE_URL,
      subject: "auth",
    });

    const valid = TokenDataKeys.every((key) => key in data.payload);

    if (valid) {
      return data.payload as AuthData;
    }
  } catch {}

  return null;
}

async function validateRemoteAccess(token: string) {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();

    if (data) {
      return true;
    }
  } catch {}

  return false;
}

export async function createToken(token: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();

  return await new jose.SignJWT({
    token,
    id: data.id,
    avatar: data.avatar_url,
    username: data.login,
    name: data.name,
    email: data.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(process.env.BASE_URL)
    .setSubject("auth")
    .setExpirationTime("2w")
    .sign(secret);
}
