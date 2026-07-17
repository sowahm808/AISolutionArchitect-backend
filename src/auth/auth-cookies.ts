import { Response } from "express";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  const encodedValue = encodeURIComponent(value);
  const parts = [
    `${name}=${encodedValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (isProduction()) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function setAuthCookies(
  response: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  response.setHeader("Set-Cookie", [
    serializeCookie(ACCESS_COOKIE_NAME, tokens.accessToken, SEVEN_DAYS_SECONDS),
    serializeCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, SEVEN_DAYS_SECONDS),
  ]);
}

export function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;

  const prefix = `${name}=`;
  const cookie = header
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(prefix));

  if (!cookie) return undefined;

  return decodeURIComponent(cookie.slice(prefix.length));
}

export function readAccessTokenCookie(header: string | undefined) {
  return readCookie(header, ACCESS_COOKIE_NAME);
}

export function readRefreshTokenCookie(header: string | undefined) {
  return readCookie(header, REFRESH_COOKIE_NAME);
}
