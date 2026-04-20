# Hướng dẫn Cài đặt & Cấu hình Server VPN Flutter

Tài liệu này hướng dẫn chi tiết cách cấu hình biến môi trường, thiết lập dịch vụ Firebase và thiết lập chữ ký Apple StoreKit 2 cho ứng dụng VPN.

---

## 1. Cụm cấu hình Biến Môi Trường ( `.env` )
Hãy tạo một file tên là `.env` ở thư mục gốc của project (ngang hàng với `package.json`), sao chép từ `.env.example` và thiết lập các giá trị.

```env
# Môi trường chạy server (development hoặc production)
# LƯU Ý: Phải set là "production" khi đưa lên host thật để thư viện Apple xác minh hóa đơn bằng môi trường App Store chuẩn.
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=<Base64_Của_File_Firebase_JSON>
ADMIN_KEY=<Secret_Key_Để_App_Gọi_API_Quản_Trị>
APP_BUNDLE_ID=<com.yourcompany.vpnapp>

# Cấu hình Apple StoreKit 2
APPLE_KEY_ID=<Mã ID của file .p8, ví dụ: 5X8A1B2C3D>
APPLE_PRIVATE_KEY=<Nội dung file .p8 của bạn>
```

---

## 2. Thiết lập Firebase Admin

Vì Server đóng vai trò quản lý tài khoản và thay đổi cờ `isPremium` của User, nó cần toàn quyền Admin trên Firebase.

1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Chọn Project > **Project settings** (Cài đặt dự án) > Tab **Service accounts** (Tài khoản dịch vụ).
3. Nhấn **Generate new private key**. Bạn sẽ tải về một file `*.json`.
4. Mã hoá file JSON đó sang định dạng **Base64** và đặt vào biến `FIREBASE_SERVICE_ACCOUNT_PATH` trong thư mục `.env`. (Bạn có thể dùng công cụ online hoặc terminal `base64 file.json -w 0`).

---

## 3. Thiết lập Apple StoreKit 2 (Promotional Offers `.p8`)

Server của bạn cần tệp `.p8` (Private Key khóa bí mật) để cấp phát mã giảm giá, khuyến mãi tri ân cho khách hàng. App sẽ mang chữ ký Server cấp đi mua hàng trên iOS.

#### Bước 3.1: Tạo Private Key
1. Đăng nhập vào [Apple Developer Portal](https://developer.apple.com/account).
2. Tới mục **Keys** và nhấn biểu tượng dấu **+** để tạo một Key mới.
3. Đặt tên Key (vd: *VPN Promotional Offer Key*). Trong danh sách quyền, hãy chèn tích vào ô trống **In-App Purchase**.
4. Nhấn **Continue** và **Register**.
5. Nhấn **Download** để lưu file `.p8` (Lưu ý quan trọng: Tệp này chỉ có thể tải RÚT DUY NHẤT 1 lần, lỡ làm mất phải bấm Revoke tạo lại). 
6. Apple sẽ hiển thị cho bạn **Key ID** (1 mã gen gồm 10 ký tự: vd `4H9JBNF93Z`). Copy Key ID này điền vào file `.env`: `APPLE_KEY_ID`.

#### Bước 3.2: Format Private Key
1. Theo chuẩn, file `.p8` bạn vừa tải về có hình hài như sau khi mở ở dạng text:
   ```txt
   -----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg.......
   -----END PRIVATE KEY-----
   ```
2. Bạn copy trực tiếp **toàn bộ** vào một dòng trong file `.env` ở biến `APPLE_PRIVATE_KEY`. Mã nguồn `AppleIapService.ts` của bạn đã được nâng cấp thông minh tự động bắt lỗi và tự nối dòng PKCS#8 lại, nên kệ copy vô tư đi.

---

## 4. Thiết lập Webhook URL (Apple V2 Notifications)

Để Subscription tự động tái cấu hình gia hạn thành công (hoặc hủy) ngay cả khi user tắt máy không mở app lên, bạn cần móc nối Server với Cổng Webhook của Apple:

1. Đăng nhập vào [App Store Connect](https://appstoreconnect.apple.com/).
2. Vào **My Apps** > Chọn App VPN của bạn > Cuộn xuống phần **App Information** (hoặc **App Store Server Notifications** trên UX mới).
3. Tại ô ghi chú mục **Production Server URL**, nhập link domain trỏ vào API webhook của Server. 
   Ví dụ: `https://api.yourdomain.com/api/iap/webhook`
4. Tại ô **Sandbox Server URL**, nhập domain để test (thường nhập chung nếu chưa có sub-domain riêng). 
5. Chọn chuẩn Notification là **Version 2**.

---

## 5. Khởi chạy
Chạy lệnh bên dưới và vả terminal lên trần nhà:
```bash
npm install
npm run build
npm start
```
