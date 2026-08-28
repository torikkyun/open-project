# Hướng dẫn đóng góp

## Bắt đầu

1. Cài Node.js phiên bản `>=22 <26` và pnpm `11.22.0`.
2. Tại thư mục gốc, cài dependency:

   ```bash
   pnpm install
   ```

3. Khởi động PostgreSQL development:

   ```bash
   docker compose -f docker/compose.dev.yml up -d
   ```

4. Tạo file môi trường theo cấu hình dự án trước khi chạy API. Không commit secret, token hoặc file `.env`.

Chạy toàn bộ workspace bằng `pnpm dev`. Có thể chạy riêng từng app bằng filter của pnpm, ví dụ `pnpm --filter api dev` hoặc `pnpm --filter web dev`.

## Quy trình thay đổi

- Tạo branch riêng cho mỗi thay đổi; giữ phạm vi branch nhỏ và tập trung.
- Đọc yêu cầu và user story liên quan trước khi sửa code.
- Giữ đúng ranh giới: nghiệp vụ backend nằm trong feature/service; UI nằm trong feature hoặc route tương ứng; truy cập DB đi qua Prisma service.
- Với thay đổi schema, cập nhật `apps/api/prisma/schema.prisma` và tạo Prisma migration. Không sửa migration đã chạy trên môi trường dùng chung.
- Với endpoint mới, cập nhật DTO, controller, service, phân quyền và API client tương ứng.
- Cập nhật tài liệu khi thay đổi hành vi, API contract, dữ liệu hoặc cách chạy dự án.
- Không đưa dependency mới vào repo nếu chức năng có thể dùng pattern hoặc package hiện có.

## Kiểm tra trước khi gửi PR

Chạy từ thư mục gốc:

```bash
pnpm check-types
pnpm lint
pnpm build
```

Nếu thay đổi format, chạy thêm:

```bash
pnpm format
```

Chạy test backend khi thay đổi API hoặc nghiệp vụ:

```bash
pnpm --filter api test
```

PR cần mô tả mục đích, phạm vi thay đổi, migration cần chạy và cách kiểm thử. Với thay đổi UI, đính kèm ảnh chụp màn hình ở desktop và mobile khi phù hợp. Với thay đổi API, ghi rõ endpoint, quyền truy cập, input và output.

## Quy ước code

- Dùng TypeScript và giữ public API ổn định nếu không có yêu cầu breaking change.
- Tuân thủ formatter, linter và `.editorconfig`: UTF-8, LF, newline cuối file; code TypeScript dùng 2 spaces.
- Đặt tên rõ nghĩa; tránh viết tắt không phổ biến và tránh logic nghiệp vụ trong component UI hoặc controller.
- Validate input ở boundary bằng DTO và giữ kiểm tra quyền ở backend.
- Viết test cho logic nghiệp vụ mới, đặc biệt là phân quyền, chuyển trạng thái task, quan hệ task cha-con và dependency.
- Không log password, JWT, cookie, secret hoặc dữ liệu nhạy cảm.

## Pull request

PR chỉ nên chứa thay đổi liên quan đến mục tiêu. Trước khi yêu cầu review, xác nhận các lệnh kiểm tra phù hợp đã chạy và ghi lại lỗi còn tồn tại, nếu có. Reviewer cần có đủ ngữ cảnh để kiểm tra hành vi, dữ liệu, quyền truy cập và ảnh hưởng đến migration.
