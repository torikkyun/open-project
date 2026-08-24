import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { Response } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { LocalGuard } from "./guards/local.guard";
import { AuthenticatedUser } from "@/common/types/auth-user.type";
import { ApiTags } from "@nestjs/swagger";
import { CookieService } from "./cookie.service";

@ApiTags("Auth")
@Controller({ path: "auth" })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Public()
  @Post("register")
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    res.cookie(
      "accessToken",
      result.accessToken,
      this.cookieService.getAccessTokenOptions(),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      this.cookieService.getRefreshTokenOptions(),
    );
    return {
      message: "Đăng ký thành công",
    };
  }

  @Public()
  @Post("login")
  @UseGuards(LocalGuard)
  async login(
    @Request() request: { user: AuthenticatedUser },
    @Body() _body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(request.user);
    res.cookie(
      "accessToken",
      result.accessToken,
      this.cookieService.getAccessTokenOptions(),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      this.cookieService.getRefreshTokenOptions(),
    );
    return {
      message: "Đăng nhập thành công",
    };
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Post("refresh")
  async refresh(
    @Request() request: { cookies: { refreshToken: string } },
    @Res({ passthrough: true })
    res: Response,
  ) {
    const refreshToken = request.cookies.refreshToken;
    const result = await this.authService.refresh(refreshToken);
    res.cookie(
      "accessToken",
      result.accessToken,
      this.cookieService.getAccessTokenOptions(),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      this.cookieService.getRefreshTokenOptions(),
    );

    return {
      message: "Refresh token thành công",
    };
  }

  @Version(VERSION_NEUTRAL)
  @Get("logout")
  async logout(
    @Request() request: { user: AuthenticatedUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(request.user.id);
    res.clearCookie("accessToken");
    res.clearCookie(
      "refreshToken",
      this.cookieService.getRefreshTokenOptions(),
    );
    return { message: "Đăng xuất thành công" };
  }
}
