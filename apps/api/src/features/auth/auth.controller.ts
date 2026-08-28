import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Public()
  @ApiOperation({ summary: "Đăng ký tài khoản mới" })
  async register(@Body() registerDto: RegisterDto) {
    return {
      data: await this.authService.register(registerDto),
      message: "Đăng ký thành công",
    };
  }

  @Post("login")
  @Public()
  @ApiOperation({ summary: "Đăng nhập vào hệ thống" })
  async login(@Body() dto: LoginDto) {
    return {
      data: await this.authService.login(dto),
      message: "Đăng nhập thành công",
    };
  }

  @Post("logout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đăng xuất" })
  async logout() {
    return {
      data: await this.authService.logout(),
      message: "Đăng xuất thành công",
    };
  }

  @Post("refresh")
  @Public()
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() refreshDto: RefreshDto) {
    return {
      data: await this.authService.refresh(refreshDto),
      message: "Làm mới token thành công",
    };
  }
}
