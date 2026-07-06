import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private s: AuthService) {}
  @Post("register") register(@Body() d: RegisterDto) {
    return this.s.register(d);
  }
  @Post("login") login(@Body() d: LoginDto) {
    return this.s.login(d);
  }
  @Post("refresh") refresh(@Body() d: RefreshDto) {
    return this.s.refresh(d.refreshToken);
  }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get("me") me(
    @CurrentUser() u: AuthUser,
  ) {
    return this.s.me(u.sub);
  }
}
