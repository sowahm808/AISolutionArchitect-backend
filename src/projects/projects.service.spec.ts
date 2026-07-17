import { ProjectsService } from "./projects.service";
import { AuthUser } from "../common/current-user.decorator";

describe("ProjectsService", () => {
  const user: AuthUser = {
    sub: "user-1",
    email: "user@example.com",
    role: "ARCHITECT",
    organizationId: "org-1",
  };

  const baseProject = {
    id: "project-1",
    organizationId: "org-1",
    ownerId: "user-1",
    name: "Ghana Trotro",
    description: null,
    cloudProvider: null,
    company: "Makrozoia",
    industry: "Transportation",
    migrationType: "Cloud Migration",
    businessProblem: "Passenger demand and available vehicles are not coordinated.",
    currentArchitecture: "NestJS backend with PostgreSQL, Redis, and WebSockets.",
    targetGoal: "Efficiency and cost",
    compliance: "Ghana road Transport Union Compliance",
    budget: "$5000 -$10000",
    timeline: "2-3 weeks",
    notes: "",
    currentStateSummary: null,
    targetStateSummary: null,
    status: "MODEL_READY",
    createdAt: new Date("2026-07-17T04:28:42.365Z"),
    updatedAt: new Date("2026-07-17T22:07:50.260Z"),
  };

  it("returns list items with display summaries derived from intake fields", async () => {
    const db = {
      project: {
        findMany: jest.fn().mockResolvedValue([baseProject]),
      },
    };
    const service = new ProjectsService(db as any);

    await expect(service.findAll(user)).resolves.toEqual([
      expect.objectContaining({
        description: baseProject.businessProblem,
        currentStateSummary: baseProject.currentArchitecture,
        targetStateSummary: baseProject.targetGoal,
      }),
    ]);
  });

  it("preserves explicit summary fields when they are provided", async () => {
    const project = {
      ...baseProject,
      description: "Explicit description",
      currentStateSummary: "Explicit current summary",
      targetStateSummary: "Explicit target summary",
    };
    const db = {
      project: {
        findFirst: jest.fn().mockResolvedValue(project),
      },
    };
    const service = new ProjectsService(db as any);

    await expect(service.findOne(user, project.id)).resolves.toEqual(
      expect.objectContaining({
        description: "Explicit description",
        currentStateSummary: "Explicit current summary",
        targetStateSummary: "Explicit target summary",
      }),
    );
  });
});
