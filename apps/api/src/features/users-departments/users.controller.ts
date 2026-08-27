import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtGuard as JwtAuthGuard } from "../auth/guards/jwt.guard";
import { UseGuards } from "@nestjs/common";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller({ path: "users", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles("admin")
  @ApiOperation({ summary: "Lấy danh sách người dùng" })
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(query);
    return { data: result.data, meta: result.meta };
  }

  @Post()
  @Roles("admin")
  @ApiOperation({ summary: "Tạo người dùng mới" })
  async create(@Body() createUserDto: CreateUserDto) {
    return {
      data: await this.usersService.create(createUserDto),
      message: "Tạo người dùng thành công",
    };
  }

  /*
    Vấn đề: Mọi user đã đăng nhập đều có thể xem thông tin chi tiết của bất kỳ user nào (email, role, department). Đây là lỗ hổng bảo mật (information disclosure), vì thông tin này có thể nhạy cảm.

    TODO: cần sửa lại
  */
  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết người dùng" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return { data: await this.usersService.findOne(id) };
  }

  @Put(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Cập nhật thông tin người dùng" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return {
      data: await this.usersService.update(id, updateUserDto),
      message: "Cập nhật người dùng thành công",
    };
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Xóa người dùng" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
    return { message: "Xóa người dùng thành công" };
  }
}
