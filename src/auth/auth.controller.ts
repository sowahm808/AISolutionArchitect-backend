import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { AuthService } from "./auth.service";
import { readRefreshTokenCookie, setAuthCookies } from "./auth-cookies";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private s: AuthService) {}
  @Post("register") async register(
    @Body() d: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.s.register(d);
    setAuthCookies(response, result);
    return result;
  }
  @Post("login") async login(
    @Body() d: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.s.login(d);
    setAuthCookies(response, result);
    return result;
  }
  @Post("refresh") async refresh(
    @Body() d: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.s.refresh(
      d.refreshToken ?? readRefreshTokenCookie(request.headers.cookie),
    );
    setAuthCookies(response, result);
    return result;
  }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get("me") me(
    @CurrentUser() u: AuthUser,
  ) {
    return this.s.me(u.sub);
  }
}
