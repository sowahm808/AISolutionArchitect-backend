import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { PROMPTS } from "./prompts";
import { randomUUID } from "crypto";

const ModelSchema = z.object({
  businessContext: z.any(),
  currentState: z.any(),
  targetState: z.any(),
  applications: z.any(),
  integrations: z.any(),
  dataStores: z.any(),
  infrastructure: z.any(),
  security: z.any(),
  deployment: z.any(),
  operations: z.any(),
  assumptions: z.any(),
  constraints: z.any(),
  decisions: z.any(),
  risks: z.any(),
});

type RunStatus = "COMPLETED" | "FAILED";

@Injectable()
export class AiOrchestrationService {
  private readonly logger = new Logger(AiOrchestrationService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY?.trim();
  private readonly model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  private client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : undefined;

  constructor(private db: PrismaService) {}

  async discovery(project: any, answers: any[]) {
    return this.run(
      "DISCOVERY",
      { project, answers },
      z.object({
        questions: z.array(z.string()),
        assumptions: z.array(z.string()),
      }),
      {
        questions: [
          "What business capabilities are in scope?",
          "What compliance constraints apply?",
          "What target Azure regions and availability objectives are required?",
        ],
        assumptions: [
          "Migration targets Azure landing-zone patterns unless stated otherwise.",
        ],
      },
    );
  }

  async buildModel(project: any, answers: any[]) {
    const fallback = {
      businessContext: { initiative: project.description || project.name },
      currentState: { summary: project.currentStateSummary },
      targetState: {
        summary: project.targetStateSummary,
        cloudProvider: project.cloudProvider,
      },
      applications: [],
      integrations: [],
      dataStores: [],
      infrastructure: {
        cloudProvider: project.cloudProvider,
        networking: "hub-spoke",
      },
      security: { identity: "Entra ID", secrets: "Key Vault" },
      deployment: { strategy: "CI/CD with progressive environments" },
      operations: { observability: "centralized logs, metrics, traces" },
      assumptions: [
        "Generated from submitted project data and discovery answers",
      ],
      constraints: [],
      decisions: [
        { title: "Use canonical architecture model as artifact source" },
      ],
      risks: [
        {
          title: "Incomplete discovery data",
          mitigation: "Review generated assumptions",
        },
      ],
    };
    return this.run(
      "ARCHITECTURE_MODEL",
      { project, answers },
      ModelSchema,
      fallback,
    );
  }

  async artifact(type: string, model: any) {
    const prompt = type.includes("TERRAFORM")
      ? "TERRAFORM"
      : type.includes("KUBERNETES")
        ? "KUBERNETES"
        : type.includes("PIPELINE")
          ? "CICD"
          : type.includes("SECURITY")
            ? "SECURITY_REVIEW"
            : type.includes("RISK")
              ? "RISK_ASSESSMENT"
              : type.includes("COST")
                ? "COST_ESTIMATE"
                : type.includes("PRESENTATION")
                  ? "EXECUTIVE_PRESENTATION"
                  : type.includes("ADR")
                    ? "ADR"
                    : "DIAGRAM";
    return this.run(
      prompt as keyof typeof PROMPTS,
      { architectureModel: model, type },
      z.any(),
      {
        format: "markdown",
        sourceArchitectureModelId: model.id,
        sections: [
          `Generated ${type} from canonical ArchitectureModel v${model.version}`,
        ],
        content: model,
      },
    );
  }

  private async run<T>(
    promptType: keyof typeof PROMPTS,
    input: any,
    schema: z.ZodType<T>,
    fallback: T,
  ): Promise<T> {
    let output: T;
    let status: RunStatus = "COMPLETED";
    let error: string | undefined;
    let usage: any = { mode: "deterministic-fallback" };
    let modelName = "deterministic-fallback";

    try {
      if (!this.client) {
        output = schema.parse(fallback);
      } else {
        const content = await this.createJsonCompletion(promptType, input);
        output = schema.parse(this.parseJsonContent(content));
        usage = content.usage;
        modelName = this.model;
      }
    } catch (e: any) {
      status = "FAILED";
      error = e.message;
      this.logger.error(`AI ${promptType} failed: ${error}`);
      await this.recordRun(
        input,
        promptType,
        fallback as any,
        modelName,
        usage,
        status,
        error,
      );
      throw new BadRequestException(
        `AI generation failed for ${promptType}: ${error}`,
      );
    }

    await this.recordRun(
      input,
      promptType,
      output as any,
      modelName,
      usage,
      status,
      error,
    );
    return output;
  }

  private async createJsonCompletion(
    promptType: keyof typeof PROMPTS,
    input: any,
  ) {
    const response = await this.client!.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: PROMPTS[promptType] + " Return valid JSON only.",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    return {
      text: response.choices[0]?.message.content,
      usage: response.usage ?? { mode: "openai", model: this.model },
    };
  }

  private parseJsonContent(content: { text?: string | null }) {
    if (!content.text) {
      throw new Error("OpenAI returned an empty response");
    }
    try {
      return JSON.parse(content.text);
    } catch (e: any) {
      throw new Error(`OpenAI returned invalid JSON: ${e.message}`);
    }
  }

  private async recordRun(
    input: any,
    promptType: keyof typeof PROMPTS,
    output: any,
    modelName: string,
    usage: any,
    status: RunStatus,
    error?: string,
  ) {
    await this.db.aiRun.create({
      data: {
        id: randomUUID(),
        projectId: input.project?.id || input.architectureModel?.projectId,
        promptType,
        promptInput: input,
        generatedOutput: output,
        modelName,
        tokenUsage: usage,
        status,
        error,
      },
    });
  }
}
