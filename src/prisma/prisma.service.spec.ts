import { createPrismaConnectionError } from "./prisma.service";

describe("createPrismaConnectionError", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("turns Prisma P1000 errors into Render DATABASE_URL guidance", () => {
    process.env.DATABASE_URL =
      "postgresql://user:secret@dpg-example-a:5432/database?schema=public";

    const error = createPrismaConnectionError({ errorCode: "P1000" });

    expect(error.message).toContain("dpg-example-a:5432");
    expect(error.message).toContain("DATABASE_URL");
    expect(error.message).toContain("Internal Database URL");
    expect(error.message).not.toContain("secret");
  });

  it("preserves non-P1000 errors", () => {
    const originalError = new Error("connection refused");

    expect(createPrismaConnectionError(originalError)).toBe(originalError);
  });
});
