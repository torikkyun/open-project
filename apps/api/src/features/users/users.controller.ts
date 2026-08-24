import { Body, Controller, Get, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtPayload } from "@/common/types/jwt-payload.type";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("Users")
@ApiCookieAuth()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getUserById(user.sub);
  }

  @Patch("profile")
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateUserDto) {
    return this.usersService.updateUser(user.sub, body);
  }
}
