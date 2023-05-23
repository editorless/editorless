import { Octokit } from "@octokit/rest";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.TOKEN_SECRET);

export async function getAuthData(token?: string) {
  if (!token) {
    return null;
  }

  const data = await validateTokenData(token);
  if (!data) {
    return null;
  }

  const accessToken = data.payload.token as string;

  // Type checking of the token payload is done at validateTokenData function
  const remote = await validateTokenRemote(accessToken);
  if (!remote) {
    return null;
  }

  return {
    token: accessToken,
    ...remote,
  };
}

async function validateTokenData(token: string) {
  try {
    const data = await jose.jwtVerify(token, secret, {
      issuer: process.env.BASE_URL,
      subject: "auth",
    });

    if (!("token" in data.payload) || typeof data.payload.token !== "string") {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function validateTokenRemote(accessToken: string) {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.rest.users.getAuthenticated();

    return {
      id: data.id,
      avatar: data.avatar_url,
      username: data.login,
      name: data.name,
      email: data.email,
    };
  } catch {
    return null;
  }
}

export async function createToken(data: Record<string, string>) {
  return await new jose.SignJWT({
    ...data,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(process.env.BASE_URL)
    .setSubject("auth")
    .setExpirationTime("2w")
    .sign(secret);
}
