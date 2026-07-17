import { readAccessTokenCookie, readRefreshTokenCookie } from "./auth-cookies";

describe("auth cookies", () => {
  it("reads URL-encoded access and refresh token cookies", () => {
    const header =
      "theme=dark; accessToken=access%2Etoken; refreshToken=refresh%2Etoken";

    expect(readAccessTokenCookie(header)).toBe("access.token");
    expect(readRefreshTokenCookie(header)).toBe("refresh.token");
  });
});
