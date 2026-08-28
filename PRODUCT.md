# Open Project: Chức năng sản phẩm

## 1. Tổng quan

Open Project là web app quản lý dự án và công việc cho doanh nghiệp. Sản phẩm giúp lập kế hoạch, phân công, theo dõi tiến độ, cộng tác và báo cáo trong một không gian thống nhất.

MVP hướng tới doanh nghiệp quy mô khoảng 20 người và 3 phòng ban, hỗ trợ responsive trên mobile. Người dùng có thể chuyển đổi giữa ba góc nhìn công việc: danh sách, Kanban và Gantt.

## 2. Vai trò người dùng

- **Admin:** quản lý toàn bộ người dùng, vai trò, dữ liệu, mẫu dự án và thiết lập hệ thống.
- **Project Manager:** tạo và quản lý dự án, lập kế hoạch, phân công, theo dõi, review và nghiệm thu công việc.
- **Member:** xem dự án được cấp quyền, thực hiện task, cập nhật tiến độ, thời gian thực tế và trao đổi.
- **Guest:** người ngoài được mời vào dự án. Quyền gồm View Only, Comment Only và Upload Documents; không được sửa task, trạng thái hoặc tiến độ.

## 3. Chức năng MVP

### Quản lý dự án

- Tạo dự án với tên, mô tả, ngày bắt đầu, ngày kết thúc dự kiến và thành viên.
- Chọn template khi tạo dự án để sao chép cấu trúc task.
- Xem danh sách dự án có phân trang, tìm kiếm cơ bản và lọc theo trạng thái, người quản lý, khoảng thời gian.
- Xem thông tin tổng quan: trạng thái, tiến độ, người quản lý và thời gian.
- Cập nhật thông tin, thành viên và thiết lập dự án.
- Lưu trữ hoặc xóa dự án theo quyền.

### Quản lý công việc

- Tạo task trong dự án với tiêu đề, mô tả, người thực hiện, thời gian, ưu tiên, tệp đính kèm và task cha.
- Gán một hoặc nhiều người thực hiện từ thành viên dự án.
- Ghi nhận khối lượng dự kiến, đơn vị đo, số giờ ước tính, SLA và số giờ thực tế.
- Cập nhật phần trăm hoàn thành và trạng thái: To Do, In Progress, Review, Done, Canceled.
- Tạo cây task cha-con; tiến độ task cha được tính từ task con hoặc trạng thái liên quan.
- Thiết lập dependency giữa các task với loại FS, FF, SS hoặc SF.
- Ghi nhận lịch sử thay đổi: trạng thái, tiến độ, người thực hiện và thời gian.
- Review và nghiệm thu task: chấp nhận để chuyển sang Done hoặc yêu cầu sửa để quay lại xử lý.

### Góc nhìn và lập kế hoạch

- **List view:** hiển thị task dạng phân cấp, lọc và theo dõi trạng thái.
- **Kanban view:** nhóm task theo trạng thái để theo dõi luồng xử lý.
- **Gantt view:** hiển thị lịch task, milestone, dependency và tiến độ dự án.
- Cho phép Project Manager và Admin điều chỉnh thời gian task trên Gantt bằng kéo-thả.
- Hỗ trợ mức hiển thị ngày, tuần, tháng và bộ lọc task.

### Cộng tác và tài liệu

- Bình luận trực tiếp trên task, kèm tệp đính kèm.
- Hiển thị lịch sử trao đổi theo thời gian.
- Quản lý tài liệu liên quan đến dự án và task: tải lên, lưu trữ, tìm kiếm và tải xuống.
- Mời Guest vào dự án với bộ quyền View, Comment và Upload Documents.
- Tạo thông báo khi có task mới, phân công, thay đổi trạng thái, bình luận, yêu cầu review hoặc task đến hạn.

### Dashboard và báo cáo

- Dashboard theo phạm vi toàn hệ thống, dự án hoặc cá nhân.
- Hiển thị số dự án, số task, tiến độ chung, task tồn đọng, task trễ hạn và chỉ số SLA.
- Hiển thị task được giao, task cần review và tình trạng khối lượng công việc.
- Báo cáo cơ bản so sánh số giờ ước tính với số giờ thực tế.
- Project Manager và Admin xem biểu đồ tiến độ theo dự án hoặc khoảng thời gian.
- Cho phép xuất báo cáo cơ bản khi chức năng xuất được triển khai.

### Quản trị

- Admin quản lý tài khoản, phòng ban và vai trò.
- Quản lý template dự án để tái sử dụng cấu trúc task.
- Cho phép mở rộng trạng thái, đơn vị đo lường và trường tùy chỉnh ở giai đoạn phù hợp.

## 4. Quy tắc nghiệp vụ chính

- Chỉ Admin và Project Manager được tạo dự án, phân công task và thay đổi thiết lập dự án.
- Member chỉ cập nhật tiến độ, thời gian thực tế và trạng thái của task được giao hoặc được cấp quyền.
- Guest chỉ xem, bình luận và tải tài liệu theo quyền được cấp; không chỉnh sửa task.
- Ngày task phải nằm trong khoảng ngày của dự án cha.
- Task ở Review phải được người có quyền nghiệm thu chấp nhận trước khi chuyển sang Done.
- Khi task cần review được đánh dấu hoàn thành, hệ thống chuyển sang Review thay vì Done ngay.
- Một người có thể tham gia nhiều dự án và được gán nhiều task.
- Task có thể có estimated hours và actual hours để đo chênh lệch.
- Task trễ SLA phải được đánh dấu và đưa vào báo cáo.
- Mỗi dự án có thể có nhiều milestone.
- Dữ liệu dashboard và báo cáo tính từ trạng thái task hiện tại.

## 5. Ngoài phạm vi MVP

Các chức năng sau ghi nhận cho giai đoạn sau, không thuộc MVP hiện tại:

- Calendar View.
- Nhắc nhở và cảnh báo tự động nâng cao.
- Change Request.
- Báo cáo nâng cao.
- Tìm kiếm và bộ lọc toàn cục nâng cao.
- Sao lưu và phục hồi dữ liệu.

## 6. Tiêu chí thành công

MVP thành công khi người dùng có thể tạo dự án, xây dựng cây task, phân công, cập nhật tiến độ, theo dõi trên List/Kanban/Gantt, cộng tác bằng bình luận và tài liệu, đồng thời xem dashboard phản ánh đúng dữ liệu công việc theo quyền truy cập.
