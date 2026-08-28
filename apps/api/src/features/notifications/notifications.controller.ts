import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtPayload } from "@/common/types/jwt-payload.type";
import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: OffsetPaginationQueryDto,
  ) {
    return this.notificationsService.list(user, query.page, query.limit);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.unreadCount(user);
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user);
  }

  @Patch(":id/read")
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.notificationsService.markRead(id, user) };
  }
}
