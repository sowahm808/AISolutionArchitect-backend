import { BadRequestException } from "@nestjs/common";
import { AiOrchestrationService } from "./ai-orchestration.service";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("AiOrchestrationService", () => {
  it("creates deterministic model fallback when no OpenAI key is configured", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const db: any = { aiRun: { create: jest.fn() } };
    const svc = new AiOrchestrationService(db);

    const model = await svc.buildModel(
      { id: "p1", name: "Migrate", cloudProvider: "Azure" },
      [],
    );

    expect(model.decisions[0].title).toContain("canonical architecture model");
    expect(db.aiRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelName: "deterministic-fallback",
          status: "COMPLETED",
          tokenUsage: { mode: "deterministic-fallback" },
        }),
      }),
    );
    restoreEnv("OPENAI_API_KEY", previousKey);
  });

  it("surfaces OpenAI failures instead of silently returning fallback content", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const db: any = { aiRun: { create: jest.fn() } };
    const svc: any = new AiOrchestrationService(db);
    svc.client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error("invalid API key")),
        },
      },
    };

    await expect(
      svc.buildModel({ id: "p1", name: "Migrate", cloudProvider: "Azure" }, []),
    ).rejects.toThrow(BadRequestException);
    expect(db.aiRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          error: "invalid API key",
        }),
      }),
    );
    restoreEnv("OPENAI_API_KEY", previousKey);
  });
});
