import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto";
@Injectable()
export class AuthService {
  constructor(
    private db: PrismaService,
    private jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const org = await this.db.organization.create({
      data: {
        id: randomUUID(),
        name: dto.organizationName || `${dto.name || dto.email} Organization`,
        industry: dto.industry,
      },
    });
    const user = await this.db.user.create({
      data: {
        id: randomUUID(),
        email: dto.email.toLowerCase(),
        displayName: dto.displayName || dto.name || dto.email,
        passwordHash: await argon2.hash(dto.password),
        role: "ADMIN",
        organizationId: org.id,
      },
    });
    return this.issue(user);
  }
  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException("Invalid credentials");
    return this.issue(user);
  }
  async refresh(token: string) {
    try {
      const p = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
      });
      const rows = await this.db.refreshToken.findMany({
        where: { userId: p.sub, revokedAt: null },
      });
      const tokenMatches = await Promise.all(
        rows.map((r: { tokenHash: string }) =>
          argon2.verify(r.tokenHash, token),
        ),
      );
      if (!tokenMatches.some(Boolean)) throw new Error();
      const user = await this.db.user.findUniqueOrThrow({
        where: { id: p.sub },
      });
      return this.issue(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
  async me(id: string) {
    const { passwordHash, ...u } = await this.db.user.findUniqueOrThrow({
      where: { id },
    });
    return u;
  }
  private async issue(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
      expiresIn: process.env.JWT_ACCESS_TTL || "15m",
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
      expiresIn: process.env.JWT_REFRESH_TTL || "7d",
    });
    await this.db.refreshToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 864e5),
      },
    });
    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
