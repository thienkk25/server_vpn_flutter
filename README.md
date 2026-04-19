# Server VPN Flutter (StoreKit 2 IAP Backend)

Đây là Backend Server được xây dựng bằng **Node.js, Express & TypeScript**, đóng vai trò là một điểm trung chuyển (Middleware/Gateway) cung cấp dịch vụ quản lý Người dùng và xử lý Thanh toán In-App Purchases (IAP) theo chuẩn **Apple StoreKit 2** cho toàn bộ app VPN Flutter.

## Tính năng nổi bật

* **Firebase Auth Integration:** Xác thực và quản lý token người dùng thông qua Firebase Admin SDK. Quản lý trạng thái Premium/Lapse ngay trên cấu trúc Database Cloud Firestore.
* **Apple StoreKit 2 Natively:** 
  * 🛡 **JWS Verification:** Tự động giải mã và xác thực biên lai Apple JWS (JSON Web Signature) ngoại tuyến thông qua x5c certificate, không phụ thuộc vào các đường dẫn "bị phế truất" của StoreKit 1 (`buy.itunes.apple.com`).
  * 🔔 **Apple V2 Webhooks:** Tiếp nhận và xử lý realtime các thay đổi mốc thời gian đăng ký (Đăng ký mới, Hủy, Quá kỳ ân hạn, Gia hạn thành công) trực tiếp từ máy chủ Apple.
  * 🔑 **Promotional Offer Signatures:** Cấp phát các chữ ký bảo mật ECDSA (P-256) mã hóa bằng Private Key `.p8`. Được dùng để hỗ trợ trực tiếp các gói khuyến mãi / "Win-back" cho người dùng của App.

## Cấu trúc Hệ thống cốt lõi

* `src/presentation/` - Control và Route cho API Endpoints (vd: `/api/iap/webhook`, `/api/iap/promotional-offer/signature`). Trực tiếp quản lý Authorization bằng HTTP Headers.
* `src/application/` - Các UseCases xử lý luồng doanh nghiệp (như Giải mã Payload JWT Apple, kiểm tra giới hạn thiết bị).
* `src/infrastructure/` - Cấu hình hạ tầng: Firebase initialization, Apple Crypto generation và JWS Parsing.

## Bắt đầu

Vui lòng tham khảo tài liệu [SETUP.md](./SETUP.md) để biết hướng dẫn từ A-Z cách thiết lập biến môi trường `.env`, cấu hình chứng chỉ Firebase và tích hợp API Key `.p8` từ Apple Developer.

## Scripts Command

- `npm install`: Để cài đặt các thư viện (Express, Firebase-admin, jsonwebtoken,...).
- `npm run dev`: Chạy server ở môi trường Development (chạy live với ts-node/nodemon).
- `npm run build`: Build từ Typecript sang Javascript production.
- `npm start`: Chạy server ở môi trường Production (cần build trước).

📄 License

MIT © 2026 Thien Nguyen