import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { LocalGuard } from "./guards/local.guard";
import { AuthenticatedUser } from "@/common/types/auth-user.type";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post("login")
  @UseGuards(LocalGuard)
  login(
    @Request() request: { user: AuthenticatedUser },
    @Body() _body: LoginDto,
  ) {
    return this.authService.login(request.user);
  }
}
