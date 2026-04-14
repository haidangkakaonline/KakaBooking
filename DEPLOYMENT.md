# Hướng Dẫn Triển Khai (Deployment Guide) lên Vercel

Tài liệu này hỗ trợ bạn triển khai (deploy) an toàn dự án Hệ Thống Đặt Phòng Họp Nội Bộ lên nền tảng đám mây Vercel.

## 1. Môi trường bắt buộc (Environment Variables)

Khi bạn liên kết kho chứa (Repository) Github/Gitlab với Vercel, nền tảng sẽ yêu cầu bạn cung cấp các **Environment Variables**. Hệ thống cần chính xác 2 biến bắt buộc sau để có thể khởi tạo kết nối Database tới Supabase:

| Tên biến (Key) | Mục đích sử dụng | Nguồn lấy (Where to get) |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Địa chỉ URL API của Supabase Project của bạn. Cần thiết để gửi và nhận yêu cầu dữ liệu. | **Supabase Dashboard** -> **Project Settings** -> **API** -> **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chìa khóa công khai an toàn (Anon public key). Dùng để xác thực phía Client gửi yêu cầu thao tác lên Database. | **Supabase Dashboard** -> **Project Settings** -> **API** -> **Project API Keys** -> **anon / public** |

*Lưu ý quan trọng:* Đối với framework Next.js 14+, bạn phải giữ đúng tuyệt đối tiền tố `NEXT_PUBLIC_` trên tên của cả 2 biến này để hệ thống cho phép Client-side (Trình duyệt) đóng gói bảo mật và gửi lệnh đọc/ghi vào lưới dữ liệu Supabase.

## 2. Các bước Setup nhanh trên Vercel

1. Truy cập [Vercel Dashboard](https://vercel.com) và chọn **Add New...** -> **Project**.
2. Chọn Repository Github chứa mã nguồn của dự án này và bấm **Import**.
3. Đặt tên hiển thị tùy ý cho *Project Name*.
4. Mở thẻ dropdown **Environment Variables**.
5. Copy - Paste lần lượt các biến môi trường cùng giá trị (Value) tương ứng ở phần 1 vào.
6. Bấm **Deploy** và chờ Next.js Turbopack khởi tạo build.
7. Sau ~2 phút, hệ thống sẽ cấp cho bạn một domain `.vercel.app`, hãy gửi link đó cho team của bạn sử dụng nhé!

## 3. Khuyến nghị bổ sung

* Nếu bạn thiết lập Tên miền công ty tùy chỉnh (Custom Domain), hệ thống vẫn hoạt động bình thường mà không cần định tuyến lại biến URL ở Supabase (do Anon key đã nhận diện chính xác project đích).
* Để đảm bảo an toàn truy xuất, hãy kiểm tra lại bảng RLS (Row Level Security) bên trong SQL Editor của Supabase để chặn các hành vi đọc ghi ngoài luồng (nếu cần thiết).
