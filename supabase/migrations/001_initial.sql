-- Supabase Migration: Room Booking System
-- Chạy script này trong Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo bảng bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  booker_name TEXT NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1 CHECK (participants_count > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);

-- Ràng buộc: end_time phải lớn hơn start_time
ALTER TABLE bookings ADD CONSTRAINT check_valid_time_range
  CHECK (end_time > start_time);

-- Insert sample rooms
INSERT INTO rooms (name, capacity, description) VALUES
  ('Phòng 1', 10, 'Corner'),
  ('Phòng 2', 20, ''),
  ('Phòng 3', 6, ''),
  ('Phòng 4', 15, 'Pantry');
