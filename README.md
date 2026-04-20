# Server VPN Flutter (StoreKit 2 IAP Backend)

Đây là Backend Server được xây dựng bằng **Node.js, Express & TypeScript**, đóng vai trò là một điểm trung chuyển (Middleware/Gateway) cung cấp dịch vụ quản lý Người dùng và xử lý Thanh toán In-App Purchases (IAP) theo chuẩn **Apple StoreKit 2** cho toàn bộ app VPN Flutter.

## Tính năng nổi bật

* **Firebase Auth Integration:** Xác thực và quản lý token người dùng thông qua Firebase Admin SDK. Quản lý trạng thái Premium/Lapse ngay trên cấu trúc Database Cloud Firestore.
* **Apple StoreKit 2 Natively:** 
  * 🛡 **JWS Verification:** Tự động giải mã và xác thực biên lai Apple JWS (JSON Web Signature) ngoại tuyến thông qua x5c certificate, không phụ thuộc vào các đường dẫn "bị phế truất" của StoreKit 1 (`buy.itunes.apple.com`).
  * 🔔 **Apple V2 Webhooks:** Tiếp nhận và xử lý realtime các thay đổi mốc thời gian đăng ký (Đăng ký mới, Hủy, Quá kỳ ân hạn, Gia hạn thành công) trực tiếp từ máy chủ Apple.
  * 🔑 **Promotional Offer Signatures:** Cấp phát các chữ ký bảo mật ECDSA (P-256) mã hóa bằng Private Key `.p8`. Được dùng để hỗ trợ trực tiếp các gói khuyến mãi / "Win-back" cho người dùng của App.

## Cấu trúc Hệ thống cốt lõi

* `src/presentation/` - Control và Route cho API Endpoints (vd: `/api/iap/webhook`, `/api/iap/promotional-offer/signature`). Trực tiếp quản lý Authorization.
* `src/application/` - Các UseCases xử lý luồng doanh nghiệp lõi (như Giải mã Webhook Apple, Idempotency, Logic đồng bộ thiết bị).
* `src/infrastructure/` - Cấu hình hạ tầng: Firebase initialization, Apple Root CA Crypto generation, và Background CronJobs.

## Luồng Xử Lý & Bảo Mật (Core Flow & Security)

Hệ thống được thiết kế cực kỳ chặt chẽ qua 3 lớp phòng vệ và tối ưu hóa trải nghiệm:

1. **Lớp bảo mật Chứng chỉ Apple (`AppleServerNotificationService.ts`)**:
   * Sử dụng thư viện chuẩn của Apple, tự động tải chứng chỉ `AppleRootCA-G3.cer` từ máy chủ gốc để làm khóa giải mã.
   * Cấu hình môi trường Webhooks (Sandbox hoặc Production) hoàn toàn tự động dựa trên biến `NODE_ENV`.
   * **Bắt buộc**: Phải có biến `APP_BUNDLE_ID` và `APP_APPLE_ID` trong `.env` để đối chiếu với cấu hình trên App Store. Tính năng kiểm tra trực tuyến (Online CRL checks) ngăn ngừa các Payload giả mạo.

2. **Lớp Xử lý Luồng do Apple đẩy về (`HandleAppStoreNotificationUseCase.ts`)**:
   * **Chống lặp (Idempotency)**: Webhook UUID được lưu vào Firestore (`iap_webhooks`). Các yêu cầu trùng lặp sẽ bị loại bỏ giúp tiết kiệm tài nguyên hệ thống.
   * **Kiểm duyệt Gói cước (Validation)**: Các Webhooks lạ mang `productId` không thuộc hệ thống quy định sẽ tự bị bỏ qua.
   * **Đồng bộ đa thiết bị (Multi-tenant)**: Ngay khi thay đổi trạng thái gói (Đăng ký thành công / Hết hạn / Hủy hoàn tiền), hệ thống sẽ gộp dùng `db.batch()` càn quét và cập nhật trạng thái `isPremium` cho **tất cả** các tài khoản Firestore đang dùng chung chung `subscriptionId` đó, đảm bảo 1 tài khoản mua có thể xài trên nhiều điện thoại liền mạch.

3. **Lớp Dự Phòng Tự Động (Cronjob: `SubscriptionCron.ts`)**:
   * Kịch bản chạy ngầm 1 tiếng 1 lần (`0 * * * *`) liên tục kiểm tra và thu hồi quyền `isPremium` của các tài khoản đã quá hạn `expiresAt`. 
   * Đóng vai trò là chốt chặn cuối cùng (Fail-safe backup) chống tổn lý do App Store bị rớt kết nối hoặc lỗi mạng không gửi Webhook thông báo Hết Hạn.

## Bắt đầu

Vui lòng tham khảo tài liệu [SETUP.md](./SETUP.md) để biết hướng dẫn từ A-Z cách thiết lập biến môi trường `.env`, cấu hình chứng chỉ Firebase và tích hợp API Key `.p8` từ Apple Developer.

## Scripts Command

- `npm install`: Để cài đặt các thư viện (Express, Firebase-admin, jsonwebtoken,...).
- `npm run dev`: Chạy server ở môi trường Development (chạy live với ts-node/nodemon).
- `npm run build`: Build từ Typecript sang Javascript production.
- `npm start`: Chạy server ở môi trường Production (cần build trước).

📄 License

MIT © 2026 Thien Nguyen