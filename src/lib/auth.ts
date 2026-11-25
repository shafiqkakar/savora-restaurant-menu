
import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { sql } from "@/lib/db";

const COOKIE_NAME = "savora_admin_session";
const SESSION_DURATION = 8 * 60 * 60;

type SessionPayload = {
  userId: number;
  sessionVersion: number;
  expires: number;
};

function safeCompare(value: string, expected: string) {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

function createSignature(payload: string) {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing");
  }

  return createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

// Password hashing
export function hashPassword(
  password: string,
  salt: string
) {
  return scryptSync(password, salt, 64).toString("hex");
}

// Password verification
export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
) {
  try {
    const calculatedHash = Buffer.from(
      hashPassword(password, salt),
      "hex"
    );

    const savedHash = Buffer.from(storedHash, "hex");

    return (
      calculatedHash.length === savedHash.length &&
      timingSafeEqual(calculatedHash, savedHash)
    );
  } catch {
    return false;
  }
}

// Admin authentication
export async function authenticateAdmin(
  username: string,
  password: string
) {
  const existingUsers = await sql`
    SELECT id
    FROM admin_users
    LIMIT 1
  `;

  if (existingUsers.length === 0) {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new Error(
        "Initial admin credentials are not configured"
      );
    }

    if (
      !safeCompare(username.trim(), adminUsername.trim()) ||
      !safeCompare(password, adminPassword)
    ) {
      return null;
    }

    const salt = randomBytes(32).toString("hex");
    const passwordHash = hashPassword(password, salt);

    await sql`
      INSERT INTO admin_users
        (username, password_hash, password_salt)
      VALUES
        (
          ${adminUsername.trim()},
          ${passwordHash},
          ${salt}
        )
      ON CONFLICT (username) DO NOTHING
    `;
  }

  const users = await sql`
    SELECT
      id,
      username,
      password_hash,
      password_salt,
      session_version
    FROM admin_users
    WHERE LOWER(TRIM(username)) =
      LOWER(TRIM(${username}))
    LIMIT 1
  `;

  if (users.length === 0) {
    return null;
  }

  const admin = users[0];

  const validPassword = verifyPassword(
    password,
    String(admin.password_salt),
    String(admin.password_hash)
  );

  if (!validPassword) {
    return null;
  }

  return {
    id: Number(admin.id),
    sessionVersion: Number(admin.session_version),
  };
}

// Create signed session token
export function createSessionToken(
  userId: number,
  sessionVersion: number
) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      sessionVersion,
      expires: Date.now() + SESSION_DURATION * 1000,
    })
  ).toString("base64url");

  return `${payload}.${createSignature(payload)}`;
}

// Verify session token
export function verifySessionToken(
  token: string
): SessionPayload | null {
  try {
    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return null;
    }

    const expected = createSignature(payload);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (
      !Number.isInteger(data.userId) ||
      !Number.isInteger(data.sessionVersion) ||
      typeof data.expires !== "number" ||
      data.expires <= Date.now()
    ) {
      return null;
    }

    return data as SessionPayload;
  } catch {
    return null;
  }
}

// Check admin session
export async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return false;
    }

    const session = verifySessionToken(token);

    if (!session) {
      return false;
    }

    const users = await sql`
      SELECT id
      FROM admin_users
      WHERE id = ${session.userId}
        AND session_version = ${session.sessionVersion}
      LIMIT 1
    `;

    return users.length > 0;
  } catch (error) {
    console.error("Admin session check failed:", error);
    return false;
  }
}

// Require authenticated admin
export async function requireAdmin() {
  const authenticated = await isAdmin();

  if (!authenticated) {
    throw new Error("Unauthorized");
  }

  return true;
}

// Session cookie configuration
export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_DURATION,
};
