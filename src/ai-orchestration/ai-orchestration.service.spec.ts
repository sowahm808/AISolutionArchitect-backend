import { AiOrchestrationService } from "./ai-orchestration.service";
describe("AiOrchestrationService", () => {
  it("creates deterministic model fallback", async () => {
    const db: any = { aiRun: { create: jest.fn() } };
    const svc = new AiOrchestrationService(db);
    const model = await svc.buildModel(
      { id: "p1", name: "Migrate", cloudProvider: "Azure" },
      [],
    );
    expect(model.decisions[0].title).toContain("canonical architecture model");
    expect(db.aiRun.create).toHaveBeenCalled();
  });
});
