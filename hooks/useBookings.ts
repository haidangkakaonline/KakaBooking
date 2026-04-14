"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BookingWithRoom } from "@/lib/types";

// Singleton channel instance
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let channelRefCount = 0;

function getOrCreateChannel(
  onInsert: (booking: BookingWithRoom) => void,
  onUpdate: (booking: BookingWithRoom) => void,
  onDelete: (id: string) => void
) {
  if (globalChannel) {
    channelRefCount++;
    return globalChannel;
  }

  globalChannel = supabase.channel("bookings-realtime");

  globalChannel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bookings",
      },
      async (payload) => {
        const { data } = await supabase
          .from("bookings")
          .select("*, rooms(*)")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          onInsert(data as BookingWithRoom);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
      },
      async (payload) => {
        const { data } = await supabase
          .from("bookings")
          .select("*, rooms(*)")
          .eq("id", payload.new.id)
          .single();

        if (data) {
          onUpdate(data as BookingWithRoom);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "bookings",
      },
      (payload) => {
        console.log("Realtime DELETE event:", payload);
        onDelete(payload.old.id);
      }
    );

  globalChannel.subscribe();
  channelRefCount = 1;

  return globalChannel;
}

function removeChannel() {
  channelRefCount--;
  if (channelRefCount <= 0 && globalChannel) {
    supabase.removeChannel(globalChannel);
    globalChannel = null;
    channelRefCount = 0;
  }
}

export function useBookings() {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, rooms(*)")
      .order("start_time", { ascending: true });

    if (error) {
      setError("Không thể tải danh sách booking");
      console.error(error);
    } else {
      setBookings((data as BookingWithRoom[]) || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  // Check for overlapping bookings
  const checkOverlap = useCallback(
    async (
      roomId: string,
      startTime: Date,
      endTime: Date,
      excludeId?: string
    ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("room_id", roomId)
      .or(
        `and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`
      );

    if (error) {
      console.error("Error checking overlap:", error);
      return false;
    }

    const overlapping = excludeId
      ? (data || []).filter((b) => b.id !== excludeId)
      : data;

    return (overlapping && overlapping.length > 0) || false;
  }, []);

  // Create a new booking with validation
  const createBooking = useCallback(
    async (
      booking: Omit<BookingWithRoom, "id" | "created_at" | "rooms"> & {
        room_id: string;
        title: string;
        booker_name: string;
        start_time: string;
        end_time: string;
        participants_count: number;
      }
    ): Promise<{ success: boolean; error?: string }> => {
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);

    if (endTime <= startTime) {
      return { success: false, error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
    }

    const isOverlapping = await checkOverlap(
      booking.room_id,
      startTime,
      endTime
    );

    if (isOverlapping) {
      return { success: false, error: "Phòng đã có người đặt trong khung giờ này" };
    }

    const { error } = await supabase.from("bookings").insert(booking);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
    [checkOverlap]
  );

  // Delete a booking
  const deleteBooking = useCallback(async (id: string): Promise<boolean> => {
    console.log("Attempting to delete booking:", id);
    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting booking:", error);
      return false;
    }

    console.log("Delete succeeded for:", id);
    return true;
  }, []);

  // Handle realtime events
  const handleInsert = useCallback((booking: BookingWithRoom) => {
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === booking.id);
      if (exists) return prev;
      const newBookings = [...prev, booking];
      return newBookings.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
  }, []);

  const handleUpdate = useCallback((booking: BookingWithRoom) => {
    setBookings((prev) =>
      prev
        .map((b) => (b.id === booking.id ? booking : b))
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    fetchBookings();
    getOrCreateChannel(handleInsert, handleUpdate, handleDelete);

    return () => {
      removeChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    bookings,
    loading,
    error,
    createBooking,
    deleteBooking,
    checkOverlap,
    refetch: fetchBookings,
  };
}
