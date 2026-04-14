export interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  title: string;
  start_time: string;
  end_time: string;
  booker_name: string;
  participants_count: number;
  created_at: string;
  rooms?: Room;
}

export interface BookingWithRoom extends Booking {
  rooms: Room;
}
