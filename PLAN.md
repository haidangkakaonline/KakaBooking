# Room Booking System - Kế hoạch Build

## 1. Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Supabase Cloud (PostgreSQL)
- **UI**: Tailwind CSS + shadcn/ui
- **Design**: Slate/Zinc color palette

## 2. Database Schema

### Bảng `rooms`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| name | TEXT | Tên phòng (VD: "Phòng A", "Meeting Room 1") |
| capacity | INTEGER | Sức chứa |
| description | TEXT | Mô tả phòng |

### Bảng `bookings`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| room_id | UUID | Foreign key → rooms.id |
| title | TEXT | Nội dung cuộc họp |
| start_time | TIMESTAMPTZ | Thời gian bắt đầu |
| end_time | TIMESTAMPTZ | Thời gian kết thúc |
| booker_name | TEXT | Người đặt phòng |

## 3. Project Structure
```
/app
  /api          # API routes (nếu cần)
  /page.tsx     # Trang chủ - danh sách booking
  /book         # Trang tạo booking mới
  /rooms        # Trang quản lý phòng
/components
  /ui           # shadcn/ui components
  BookingForm.tsx
  BookingList.tsx
  RoomSelector.tsx
/lib
  supabase.ts   # Supabase client
  types.ts      # TypeScript interfaces
```

## 4. Các bước thực hiện

### Step 1: Setup Project
- [ ] Khởi tạo Next.js project với TypeScript
- [ ] Cài đặt Tailwind CSS
- [ ] Cài đặt và cấu hình shadcn/ui
- [ ] Cài đặt @supabase/supabase-js

### Step 2: Supabase Setup
- [ ] Tạo SQL migration file cho 2 bảng
- [ ] Tạo file `lib/supabase.ts` với anon key config
- [ ] Tạo file `lib/types.ts` cho TypeScript interfaces
- [ ] Tạo file `.env.local` với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY

### Step 3: UI Components (shadcn/ui)
- [ ] Card - hiển thị thông tin booking
- [ ] Button - các action buttons
- [ ] Input - form inputs
- [ ] Select - chọn phòng
- [ ] Calendar/DatePicker - chọn ngày giờ
- [ ] Dialog/Modal - confirm delete, form popup
- [ ] Table - hiển thị danh sách booking

### Step 4: Pages & Features
- [ ] Trang chủ: Hiển thị danh sách booking (list view)
- [ ] Form tạo booking mới
- [ ] Validation form (required fields, end_time > start_time)
- [ ] Delete booking
- [ ] Ràng buộc: không cho đặt trùng giờ cùng phòng

### Step 5: Design
- [ ] Áp dụng Slate/Zinc color palette
- [ ] Responsive layout
- [ ] Loading states, empty states, error handling

## 5. Design System - Slate/Zinc

Primary: Zinc-900 (text), Zinc-100 (background)
Accent: Slate-600 cho buttons, Slate-50 cho cards
Border: Zinc-200
