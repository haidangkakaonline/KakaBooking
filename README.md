# KakaBooking - Hệ Thống Đặt Phòng Họp Nội Bộ

Hệ thống đặt phòng họp nội bộ cho teams. Cho phép người dùng xem lịch phòng họp theo tuần, đặt phòng bằng cách kéo chọn khung giờ, và quản lý các đặt phòng của mình.

## Tính Năng Chính

- **Lịch Phòng Tuần Tương Tác**: Lưới thời gian 7:00-19:00 (slot 30 phút) hiển thị tất cả phòng họp. Người dùng kéo hoặc chạm để chọn khung giờ trống.
- **Trạng Thái Phòng Trực Quan**: Phòng đã đặt (đỏ), phòng đã khóa/quá khứ (xám), phòng trống (trắng). Tên người đặt hiển thị trên slot.
- **Tạo Đặt Phòng**: Nhập tiêu đề, tên người đặt, số người tham gia. Hệ thống kiểm tra sức chứa phòng.
- **Quản Lý Đặt Phòng**: Xem chi tiết qua tooltip, xóa đặt phòng của mình (có xác minh tên để bảo mật).
- **Cập Nhật Thời Gian Thực**: Dùng Supabase Realtime để cập nhật lưới khi có đặt phòng mới, sửa, hoặc xóa.
- **Chống Đặt Trùng**: Kiểm tra không cho đặt trùng cùng phòng và khung giờ.
- **Chuyển Ngày**: Chọn ngày bất kỳ qua calendar popover.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Icons**: Lucide React
- **Date**: date-fns, react-day-picker

## Cài Đặt

```bash
# Clone repository
git clone <repo-url>
cd BookingKaka

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Add Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Database Schema

### rooms
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Tên phòng |
| capacity | integer | Sức chứa |
| description | text | Mô tả |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| room_id | uuid | Foreign key → rooms |
| title | text | Tiêu đề cuộc họp |
| start_time | timestamp | Giờ bắt đầu |
| end_time | timestamp | Giờ kết thúc |
| booker_name | text | Tên người đặt |
| participants_count | integer | Số người tham gia |
| created_at | timestamp | Thời điểm tạo |

## Cấu Trúc Thư Mực

```
/app
  page.tsx          # Trang chính (client component)
  layout.tsx        # Root layout
  globals.css       # Global styles
/components/ui      # shadcn/ui components
/hooks
  useBookings.ts    # Booking CRUD + realtime
/lib
  supabase.ts       # Supabase client
  types.ts          # TypeScript interfaces
  utils.ts          # Utility functions
```

## Deploy

Được thiết kế để deploy trên Vercel. Kết nối Supabase project và thêm environment variables trong Vercel dashboard.
