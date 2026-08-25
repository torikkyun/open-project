import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiCookieAuth } from "@nestjs/swagger";
import { MembersService } from "./members.service";
import { Roles } from "@/common/decorators/roles.decorator";
import { GetMembersQueryDto } from "./dto/get-members-query.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";

@ApiTags("Members")
@ApiCookieAuth()
@Controller("members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Roles("admin", "pm")
  getMembers(@Query() query: GetMembersQueryDto) {
    return this.membersService.getMembers(query);
  }

  @Patch(":userId")
  @Roles("admin")
  async updateMemberRole(
    @Param("userId") userId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    const membership = await this.membersService.updateRole(userId, body.role);
    return { data: membership };
  }

  @Delete(":userId")
  @Roles("admin")
  async removeMember(@Param("userId") userId: string) {
    await this.membersService.removeMember(userId);
    return { message: "Đã xóa thành viên khỏi workspace" };
  }
}
