# Project Conventions — Copilot Instructions

## Stack

- NestJS (latest) + TypeScript strict mode
- Prisma ORM + PostgreSQL
- Architecture: Controller → Service → Prisma (không dùng repository pattern)
- Validation: class-validator + class-transformer trên DTO
- Auth: JWT Bearer via @nestjs/passport

## Cấu trúc module

Khi tạo module mới, tạo ĐÚNG các file sau:

src/modules/[module-name]/
├── [module-name].module.ts
├── [module-name].controller.ts
├── [module-name].service.ts
├── dto/
│ ├── create-[name].dto.ts
│ └── update-[name].dto.ts
└── entities/ # (nếu cần type riêng ngoài Prisma model)

## Rules — PHẢI tuân thủ

1. KHÔNG tạo abstract class, base class, generic repository
2. KHÔNG tạo file utils/helpers trừ khi được yêu cầu
3. KHÔNG dùng barrel exports (index.ts) trừ dto/
4. KHÔNG viết comment cho code đơn giản
5. KHÔNG dùng any — luôn type rõ ràng
6. KHÔNG tự thêm field/logic ngoài yêu cầu
7. Tên biến/hàm tiếng Anh, rõ nghĩa, không viết tắt
8. Mỗi service method xử lý 1 việc duy nhất
9. KHÔNG catch error trong service — để NestJS exception filter xử lý

## Response format chuẩn

```typescript
// Success
{ data: T, meta?: PaginationMeta, message?: string }

// Error (dùng built-in NestJS exceptions)
throw new BadRequestException('Validation failed');
throw new NotFoundException('Case not found');
throw new ForbiddenException('Access denied');
```

## Pagination chuẩn

```typescript
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Prisma conventions

- Soft delete: mọi query phải thêm `where: { deletedAt: null }`
- Delete = update `deletedAt: new Date()`
- Dùng Prisma transaction khi cần write nhiều bảng
- KHÔNG viết raw SQL trừ khi Prisma không support

## DTO conventions

- Dùng class-validator decorators
- UpdateDto extends PartialType(CreateDto)
- Tên file: create-[resource].dto.ts, update-[resource].dto.ts
- KHÔNG đặt logic trong DTO
