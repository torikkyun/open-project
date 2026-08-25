import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { InvitationsService } from "./invitations.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthenticatedUser } from "@/common/types/auth-user.type";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";

@ApiTags("Invitations")
@ApiCookieAuth()
@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles("admin", "pm")
  async createInvitation(
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.invitationsService.createInvitation(body, user.id);
    return { message: "Lời mời đã được gửi" };
  }

  @Public()
  @Post(":token/accept")
  async acceptInvitation(
    @Param("token") token: string,
    @Body() body: AcceptInvitationDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    await this.invitationsService.acceptInvitation(token, body, user);
    return { message: "Lời mời đã được chấp nhận" };
  }
}
