# Hướng dẫn dự án

Chuẩn giao diện nằm trong [`DESIGN.md`](./DESIGN.md). Kiến trúc nằm trong
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cài đặt

```sh
cd web
pnpm install

cd ../api
uv sync
```

Tạo `web/.env` và `api/.env` từ các file `.env.example` tương ứng trước khi
chạy Docker Compose.

## Chạy môi trường phát triển

```sh
make docker-dev
make migration-up
make seed

cd web
pnpm dev
```

Web chạy ở cổng `3000` và gọi API ở `http://localhost:8000/api/v1` theo mặc
định của `web/.env`.

## Kiểm tra trước khi commit

Lần bàn giao gần nhất chỉ giao code, chưa chạy các lệnh dưới đây. Lần này có
thêm migration `0007_password_reset_tokens`, phải chạy migration trước khi thử
giao diện. Chạy lại trước khi commit:

```sh
cd api
uv run alembic upgrade head

cd ../web
pnpm build

cd ../api
uv run ruff check src alembic
```

Kiểm tra nhanh quy tắc hạn chót công việc con (không cần DB):

```powershell
cd api
@'
from datetime import datetime, timezone
from fastapi import HTTPException
from src.modules.tasks.router import ensure_due_within_parent as f

day = lambda value: datetime(2026, 1, value, tzinfo=timezone.utc)
f(day(10), day(9))
f(None, day(9))
try:
    f(day(10), day(11))
except HTTPException as error:
    assert error.status_code == 422
else:
    raise AssertionError("phải chặn hạn chót công việc con vượt quá cha")
print("ok")
'@ | uv run python -
```

Kiểm tra nhanh hàm lưu tệp dùng chung (không cần DB, tự dọn tệp vừa tạo):

```powershell
cd api
@'
import asyncio
from io import BytesIO

from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from src.infra.uploads import delete_upload, save_upload, upload_path

assert upload_path("/media/avatars/x.png", "avatars").name == "x.png"
assert upload_path("/media/attachments/../x.png", "attachments") is None
assert upload_path("https://example.com/x.png", "avatars") is None

TYPES = {"application/pdf": ".pdf"}


def upload(content_type: str, body: bytes) -> UploadFile:
    return UploadFile(
        file=BytesIO(body),
        filename="a.bin",
        headers=Headers({"content-type": content_type}),
    )


async def main() -> None:
    async def reject(content_type: str, body: bytes, expected: int) -> None:
        try:
            await save_upload(
                upload(content_type, body),
                "attachments",
                TYPES,
                10,
                type_error="loại",
                size_error="cỡ",
            )
        except HTTPException as error:
            assert error.status_code == expected
        else:
            raise AssertionError(f"phải trả {expected}")

    await reject("application/x-msdownload", b"x", 415)
    await reject("application/pdf", b"x" * 11, 413)

    url, size, name = await save_upload(
        upload("application/pdf", b"pdf"),
        "attachments",
        TYPES,
        10,
        type_error="loại",
        size_error="cỡ",
    )
    assert size == 3 and name == "a.bin" and url.startswith("/media/attachments/")
    assert upload_path(url, "attachments").is_file()
    delete_upload(url, "attachments")
    assert not upload_path(url, "attachments").exists()
    print("ok")


asyncio.run(main())
'@ | uv run python -
```

Kiểm tra nhanh template email đặt lại mật khẩu (không cần DB, không gửi mail):

```powershell
cd api
@'
from src.infra.mail import render_template, reset_password_link

html = render_template(
    "password_reset",
    app_name="Open Project",
    full_name="Nguyễn Văn A",
    reset_url="http://localhost:3000/reset?token=abc",
    expires_minutes=15,
    support_email="hotro@congty.com",
)
assert "$" not in html, "template còn biến chưa được thay"
assert "http://localhost:3000/reset?token=abc" in html
assert reset_password_link("abc").endswith("/reset?token=abc")
print("ok")
'@ | uv run python -
```

## Kiểm tra giao diện thủ công

Mở lần lượt các trang dưới đây:

1. Gõ liên tục vào ô "Tìm công việc" và ô tiêu đề công việc; bảng không được
   giật, không render lại toàn bộ hàng mỗi ký tự (xem React Profiler).
2. Tab `Dòng thời gian`, thang `Tuần`: nhãn tháng ghi theo tuần kiểu Jira, tuần
   vắt qua hai tháng hiện `thg 9 / thg 10`; số ngày để trơn, riêng ngày hôm nay
   có ô vuông nổi bật kèm mũi nhọn chỉ xuống và đường kẻ dọc chạy qua các hàng.
3. Công việc con có hạn chót lớn hơn công việc cha: API trả 422 và giao diện
   hiện thông báo; ô hạn chót của công việc con chặn chọn ngày vượt quá cha.
4. Rút ngắn hạn chót công việc cha xuống trước hạn của công việc con: API trả
   422.
5. Tab `Bảng`: ba cột trạng thái, kéo thả đổi trạng thái, lọc theo từ khóa và
   người thực hiện.
6. `/settings`: hai khối "Thông tin cá nhân" và "Cài đặt ứng dụng"; đổi "Giao
   diện" sang Tối thì cả trang đổi màu ngay, tải lại vẫn giữ; không còn thanh
   mục giả ở bên trái.
7. `/admin/users`: panel cao bằng khung nhìn, bảng cuộn bên trong, tiêu đề
   `text-xl`, đang tải và rỗng nằm trong bảng.
8. Bấm mã công việc ở tab `Danh sách`, tab `Dòng thời gian` hoặc bấm thẻ ở tab
   `Bảng`: panel chi tiết mở bên phải; sửa tiêu đề, mô tả, người thực hiện,
   người báo cáo, trạng thái, ưu tiên, ngày bắt đầu, hạn chót thì bảng phía
   sau cập nhật ngay. Bấm mã công việc không được mở chế độ sửa tiêu đề tại
   chỗ và không được cản kéo thả.
9. Trong panel chi tiết: gửi bình luận, xóa bình luận của mình, đính kèm tệp
   cho công việc và cho từng bình luận, tải tệp về đúng tên gốc, xóa tệp.
   Tệp quá 10 MB hoặc sai định dạng phải hiện thông báo lỗi.
10. Ảnh đại diện hiện ở cột người thực hiện, cột người báo cáo, trong danh sách
    chọn người, trên thẻ tab `Bảng` và cạnh mỗi bình luận. Tài khoản chưa có
    ảnh hiện chữ cái đầu của tên.
11. Tab `Thành viên` của dự án: chủ sở hữu thấy ô thêm người và xóa được thành
    viên (không xóa được chính mình), thành viên khác chỉ thấy danh sách. Sau
    khi thêm hoặc xóa, danh sách chọn người thực hiện trong công việc cập nhật
    theo.
12. `/admin/users`: dòng tài khoản có ảnh đại diện. Tạo tài khoản chỉ nhập email
    và họ tên; sau khi lưu hiện liên kết đặt lại mật khẩu kèm nút sao chép. Mở
    liên kết đó ở cửa sổ ẩn danh, đặt mật khẩu mới rồi đăng nhập bằng mật khẩu
    vừa tạo; mở lại liên kết cũ phải báo lỗi.
13. Khi sửa tài khoản, ô email chỉ đọc và không gửi lên API.
14. `/login` có liên kết "Quên mật khẩu?"; nhập email đã tồn tại thì nhận thông
    báo trung tính, nhập email lạ cũng nhận thông báo giống hệt.

## Ghi chú

- Lần bàn giao này thêm migration `0007_password_reset_tokens` (bảng
  `password_reset_tokens` cho token đặt lại mật khẩu dùng một lần) và không
  thêm dependency mới. Email gửi bằng `smtplib` chuẩn, template nằm ở
  `api/src/templates/`; cần điền nhóm `SMTP_*`, `SITE_URL`, `EMAIL_APP_NAME`
  trong `api/.env` mới gửi được mail. Khi chưa cấu hình SMTP, API tạo tài khoản
  vẫn trả `reset_url` để quản trị viên gửi tay.
- Tài khoản mới chỉ nhập email và họ tên; mật khẩu do API sinh và không ai
  biết, người dùng phải đặt lại qua email. Tạm thời không đổi được email.
- Route tree `web/src/routeTree.gen.ts` là file sinh tự động; `pnpm build` cập
  nhật lại file này.
