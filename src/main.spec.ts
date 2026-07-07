import { isCorsOriginAllowed } from "./cors.config";

describe("isCorsOriginAllowed", () => {
  it("allows browser origins when no CORS_ORIGINS allowlist is configured", () => {
    expect(isCorsOriginAllowed("https://frontend.example.com", [])).toBe(true);
  });

  it("allows same-origin or non-browser requests without an origin", () => {
    expect(isCorsOriginAllowed(undefined, ["https://frontend.example.com"])).toBe(
      true,
    );
  });

  it("enforces the configured CORS_ORIGINS allowlist", () => {
    expect(
      isCorsOriginAllowed("https://frontend.example.com", [
        "https://frontend.example.com",
      ]),
    ).toBe(true);
    expect(
      isCorsOriginAllowed("https://evil.example.com", [
        "https://frontend.example.com",
      ]),
    ).toBe(false);
  });
});
