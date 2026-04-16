# Backup & Restore Feature - Summary of Changes

Tính năng Backup & Restore đã được áp dụng thành công trên toàn bộ cấu trúc của ứng dụng (Frontend & Backend). Tính năng này tập trung vào việc sao lưu và phục hồi các Database Collections trên Firestore.

## Các tính năng triển khai chính:
- **Tải tệp Backup (.json):** Gợi toàn bộ dữ liệu cấu hình gồm `vpn_servers`, `subscriptions` và `app_settings` từ backend.
- **Phục hồi dữ liệu (Restore):** Cho phép người quản trị tải file json đã backup lên server để ghi đè (merge) dữ liệu trên Firestore qua một Request có hỗ trợ phân mảnh dữ liệu (batch xử lý mỗi 500 bản ghi) để tránh lỗi hạn ngạch (quota) của Firebase.

## Danh sách các files đã được thêm mới / chỉnh sửa:

### Quản trị Backend (`/src`)
1. `[NEW]` **src/application/usecases/AdminBackupRestoreUseCases.ts**:
   - Khởi tạo Use cases với 2 functions: `exportData` (tổng hợp data thành json) và `importData` (insert/update data vào Firestore bằng `db.batch()`).
2. `[NEW]` **src/presentation/controllers/AdminBackupRestoreController.ts**:
   - Controller tiếp nhận REST Request cho Backup (`GET /api/admin/backup`) và Restore (`POST /api/admin/restore`).
3. `[MODIFIED]` **src/presentation/routes/AdminRoutes.ts**:
   - Inject Dependency vào Routing setup (`AdminBackupRestoreController`) và đăng ký endpoint mới (`/backup`, `/restore`).

### Giao diện quản trị Frontend (`/admin_frontend/src`)
1. `[NEW]` **admin_frontend/src/presentation/pages/BackupPage.tsx**:
   - Trang quản lý UI backup/restore với chức năng download Blob Object và Upload file sử dụng FileReader.
2. `[MODIFIED]` **admin_frontend/src/App.tsx**:
   - Thêm tab "Backup & Restore" (`Database` icon) vào Sidebar navigation và trỏ Router nội bộ vào `BackupPage`.
3. `[MODIFIED]` **admin_frontend/src/i18n.ts**:
   - Cập nhật các bản dịch Tiếng Anh (en) và Tiếng Việt (vi) cho các text hiển thị bên trong `BackupPage`.

### Tài liệu chung (`/`)
1. `[MODIFIED]` **README.md**:
   - Cập nhật tài liệu hướng dẫn nhanh giải thích cơ chế Backup & Restore cho hệ thống.
2. `[NEW]` **backup_feature_summary.md** (Chính là file này):
   - Chứa thông tin tổng quan các thay đổi.
