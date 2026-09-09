import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import type { JwtPayload } from "@/common/types/jwt-payload.type";
import { CreateTemplateDto, UpdateTemplateDto } from "./dto";
import { TemplatesService } from "./templates.service";

@ApiTags("Templates")
@ApiBearerAuth()
@Controller({ path: "templates", version: "1" })
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll() {
    return { data: await this.templatesService.findAll() };
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return { data: await this.templatesService.findOne(id) };
  }

  @Post()
  @Roles("admin")
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return { data: await this.templatesService.create(dto, user.sub) };
  }

  @Put(":id")
  @Roles("admin")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return { data: await this.templatesService.update(id, dto) };
  }

  @Delete(":id")
  @Roles("admin")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.templatesService.remove(id);
    return { message: "Xóa template thành công" };
  }
}
