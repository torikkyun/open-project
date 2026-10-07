# Thiết kế giao diện Open Project

Tài liệu này là chuẩn style cho `web/`. Trang tham chiếu: `/projects/:projectId`
([`web/src/routes/_app/projects/$projectId.tsx`](./web/src/routes/_app/projects/$projectId.tsx))
cùng hai tab `Danh sách` và `Dòng thời gian`. Trang mới sao chép bố cục từ đây,
không tự nghĩ bố cục riêng.

## 1. Nền tảng

- Tailwind CSS v4 + shadcn (style `base-nova`, `baseColor: neutral`), font
  `Geist Variable` qua `--font-sans`.
- Chỉ dùng token màu: `background`, `foreground`, `muted`, `muted-foreground`,
  `border`, `input`, `ring`, `primary`, `secondary`, `accent`, `destructive`,
  `popover`, `card`, `sidebar`. Không hard-code màu (`bg-gray-100`,
  `text-[#111]`) và không viết `dark:` cho màu đã có token.
- Bo góc: `rounded-lg` cho panel, ô nhập, nút; `rounded-md` cho mục menu và
  chip; `rounded-sm` cho thanh công việc trong dòng thời gian. `--radius` là
  `0.625rem`; không đặt bán kính tuỳ ý.
- Cỡ chữ: `text-xl font-semibold` cho tiêu đề trang, `text-sm` là mặc định,
  `text-xs text-muted-foreground` cho phụ chú và số liệu nhỏ.
- Icon: `lucide-react`, mặc định `size-4`. Trong nút dùng
  `<Icon data-icon="inline-start" />`. Icon thuần trang trí phải có
  `aria-hidden="true"`.

## 2. Khung trang

Trang chi tiết bám chiều cao khung nhìn, chỉ vùng bảng được cuộn:

```tsx
<main className="flex h-[calc(100svh-3.75rem)] min-h-0 flex-col gap-2 overflow-hidden bg-muted/30 sm:p-2 sm:pb-0 md:h-[calc(100svh-4.25rem)]">
  <div className="shrink-0">
    <h1 className="text-xl font-semibold">{project.name}</h1>
    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
  </div>
  {/* tabs */}
</main>
```

Trang cuộn thường (cài đặt):

```tsx
<main className="min-h-[calc(100svh-3.75rem)] bg-muted/30 p-4 sm:p-6">
  <div className="mx-auto flex max-w-3xl flex-col gap-4">…</div>
</main>
```

Trang danh sách dùng bố cục bám chiều cao như trang dự án: panel chứa bảng,
chân bảng nằm trong panel, chiều rộng `max-w-7xl`.

Nội dung luôn nằm trong panel `rounded-lg border bg-background`; panel chứa bảng
dùng `flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2 overflow-hidden`,
panel chứa biểu mẫu dùng `p-4`.

## 3. Tab

Dùng `Tabs` + `TabsList variant="default"`, mỗi `TabsTrigger` có icon lucide
trước nhãn. `TabsContent` dùng
`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`. Tab chưa có nội dung thì
xóa khỏi mảng cấu hình, không để lại tab rỗng.

## 4. Thanh lọc

Một hàng duy nhất: ô tìm kiếm trước, rồi các select lọc, cách nhau
`flex flex-wrap items-center gap-2`. Ô tìm kiếm `min-w-52 flex-1 sm:max-w-xs`,
select lọc `min-w-36`. Mọi điều khiển chỉ có icon phải có `aria-label`.

- Bộ lọc ít lựa chọn (trạng thái, vai trò): dùng `NativeSelect` — native, nhẹ,
  không phụ thuộc JS.
- Danh sách dài, tìm kiếm được (thành viên, độ ưu tiên): dùng `Combobox` trong
  bảng.
- Nhãn mặc định mở đầu bằng "Tất cả …" hoặc "Mọi …".
- Bố cục lọc dùng chung `TaskListFilters`
  ([`task-list-filters.tsx`](./web/src/feat/project/components/project-task-list/task-list-filters.tsx)).

## 5. Bảng công việc

- Dùng `ProjectTaskTable`
  ([`project-task-table.tsx`](./web/src/feat/project/components/project-task-table.tsx));
  bảng rộng tối thiểu `min-w-[900px]`, container cuộn
  `min-h-0 min-w-0 max-w-full flex-1 overflow-auto`.
- Header dính: `sticky top-0 z-10 bg-background`.
- Thứ tự cột: chọn → công việc → người thực hiện → người báo cáo → độ ưu tiên →
  trạng thái → ngày bắt đầu → hạn chót.
- Ô tiêu đề là `Input` viền trong suốt, chỉ hiện viền khi hover/focus:
  `border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-ring`.
- Công việc con tối đa một cấp: thụt `ml-6` kèm `size-6` giữ chỗ.
- Ghi dữ liệu theo optimistic update trong hook; lỗi hiện
  `<p role="alert" className="text-sm text-destructive">`.
- Chân bảng:
  `flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm`,
  trái là nút "Tạo công việc", phải là `{hiển thị} / {tổng} công việc` và nút
  tải lại `variant="ghost" size="icon-sm"`.

## 6. Dòng thời gian

- Chọn thang chia bằng nhóm nút `rounded-lg border p-0.5`; mức đang chọn dùng
  `variant="secondary"` và `aria-pressed`.
- Bố cục hai phần: trái là bảng công việc, phải là lưới thời gian, ngăn cách
  `border-l`; tỉ lệ trái `min(52rem, 58%)`.
- Đường hôm nay: `w-px bg-primary`.
- Thanh công việc: `h-5 rounded-sm`, màu theo trạng thái (`bg-primary`,
  `bg-secondary-foreground/60`, `bg-muted-foreground/60`); luôn có `title` và
  `aria-label` dạng `Tên: ngày bắt đầu - hạn chót`.
- Hàng trên cùng hiển thị đoạn tháng. Ở thang Tuần, ô ngày thứ Hai ghi thêm
  tháng dạng `dd/MM` để nhìn ra tuần đó thuộc tháng nào.

## 7. Trạng thái và phản hồi

- Đang tải: `QueryMessage` hoặc
  `<p className="py-8 text-center text-sm text-muted-foreground">Đang tải ...</p>`.
  Dấu ba chấm viết `...`, không dùng ký tự `…`.
- Rỗng: `Không có công việc phù hợp.` cho bảng lọc, `Chưa có …` cho dữ liệu
  chưa từng tồn tại; giữ nguyên câu chữ giữa các màn hình.
- Lỗi: `role="alert"` + `text-destructive`, nội dung tiếng Việt, lỗi từ API
  hiển thị nguyên văn `error.message`.
- Thành công: `text-muted-foreground` kèm icon `Check`, đặt trong vùng
  `aria-live="polite"`.

## 8. Biểu mẫu và hộp thoại

- Trong trang dùng `Field`, `FieldLabel`, `FieldDescription`; trong `Dialog`
  dùng `DialogHeader/Title/Description/Footer` và form `space-y-4`.
- Mỗi ô nhập có `FieldLabel htmlFor` hoặc `aria-label`.
- Giới hạn độ dài theo schema API: tiêu đề công việc 200, tên dự án 160, mã dự
  án 2–10.
- Nút gửi đổi nhãn khi chờ ("Đang lưu...", "Đang tạo...") và `disabled` khi
  đang chờ hoặc dữ liệu chưa hợp lệ.
- `/settings` gồm hai khối cùng chuẩn panel: "Thông tin cá nhân" và "Cài đặt
  ứng dụng". Cài đặt ứng dụng chưa có endpoint nên lưu bằng `localStorage`
  ([`theme.ts`](./web/src/lib/theme.ts)); phụ đề của khối phải nói rõ tùy chọn
  chỉ áp dụng cho trình duyệt này.

## 9. Ngôn ngữ

Tiếng Việt, câu đầy đủ, không viết tắt tự chế. Nút dùng động từ mệnh lệnh
("Tạo công việc", "Lưu thay đổi", "Hủy"). Một khái niệm chỉ dùng một từ:
công việc, công việc con, người thực hiện, người báo cáo, độ ưu tiên, trạng
thái, hạn chót, dòng thời gian, dự án.

## 10. Hiệu năng (bắt buộc)

Trang dự án render hàng trăm ô nhập trong bảng, nên:

- Không đặt state của ô nhập ở component chứa bảng: mỗi ký tự sẽ render lại
  toàn bộ bảng. Ô sửa tại chỗ giữ state cục bộ, chỉ ghi khi blur hoặc Enter; ô
  tìm kiếm lọc qua `useDeferredValue`.
- Không tạo mảng/đối tượng mới trong prop của điều khiển trong bảng
  (`items={[...]}`, object style mới mỗi render); đưa lên hằng số hoặc `useMemo`.
- Danh sách trên 200 hàng phải virtualize trước khi thêm tính năng mới.
- Mục tiêu: gõ liên tục trong ô lọc hoặc ô tiêu đề không sinh long task quá
  50 ms.

## 11. Chênh lệch hiện tại cần đồng bộ

- `/`: nội dung là khối `rounded-lg border bg-background p-8` rời, chưa theo
  panel và thanh lọc của trang dự án.

`/settings` và `/admin/users` đã theo chuẩn này.

## 12. Checklist trang mới

1. Nền `bg-muted/30`, nội dung trong panel `rounded-lg border bg-background`.
2. Tiêu đề `text-xl font-semibold` kèm mô tả `text-sm text-muted-foreground`.
3. Nhiều chế độ xem thì dùng `Tabs`, xóa tab rỗng.
4. Lọc theo bố cục `TaskListFilters`; mọi điều khiển có `aria-label`.
5. Đủ bốn trạng thái: đang tải, rỗng, lỗi, thành công.
6. Không state ô nhập ở cấp bảng; không tạo prop mới mỗi render.
7. Chỉ dùng token màu và icon lucide.
