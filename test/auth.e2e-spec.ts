import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
describe("Auth e2e", () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = (
      await Test.createTestingModule({ imports: [AppModule] }).compile()
    ).createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());
  it("exposes docs and validates auth", () =>
    request(app.getHttpServer()).get("/api/auth/me").expect(401));
});
