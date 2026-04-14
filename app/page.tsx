"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, setHours, setMinutes, isBefore } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, AlertCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useBookings } from "@/hooks/useBookings";
import { supabase } from "@/lib/supabase";
import { Room, BookingWithRoom } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const START_HOUR = 7;
const END_HOUR = 19;

const SLOTS: { hour: number; minute: number }[] = [];
for (let h = START_HOUR; h < END_HOUR; h++) {
  SLOTS.push({ hour: h, minute: 0 });
  SLOTS.push({ hour: h, minute: 30 });
}

export default function Home() {
  // 1. Data States
  const [date, setDate] = useState<Date>(new Date());
  const { bookings, refetch, createBooking, deleteBooking } = useBookings();
  const [rooms, setRooms] = useState<Room[]>([]);

  // 2. Selection States
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<{ roomId: string; index: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ roomId: string; startIndex: number; endIndex: number } | null>(null);

  // 3. Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedBookingInfo, setSelectedBookingInfo] = useState<BookingWithRoom | null>(null);

  // 4. Form States
  const [bookerName, setBookerName] = useState("");
  const [bookingTitle, setBookingTitle] = useState("");
  const [participantsCount, setParticipantsCount] = useState<number | "">("");

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("rooms").select("*").order("name");
      if (data) setRooms(data);
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    refetch();
  }, [date, refetch]);

  const dateBookings = useMemo(() => {
    return bookings.filter((b) => format(parseISO(b.start_time), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));
  }, [bookings, date]);

  const getSlotBooking = (roomId: string, hour: number, minute: number) => {
    return dateBookings.find((booking) => {
      if (booking.room_id !== roomId) return false;
      const start = parseISO(booking.start_time);
      const end = parseISO(booking.end_time);
      const slotStart = setMinutes(setHours(date, hour), minute);
      const slotEnd = setMinutes(setHours(date, hour), minute + 30);

      return (
        (slotStart >= start && slotStart < end) ||
        (slotEnd > start && slotEnd <= end) ||
        (start <= slotStart && end >= slotEnd)
      );
    });
  };

  const isSlotLocked = (hour: number, minute: number) => {
    const slotStart = setMinutes(setHours(date, hour), minute);
    return isBefore(slotStart, new Date());
  };

  const handleMouseDown = (roomId: string, index: number) => {
    const slot = SLOTS[index];
    const booking = getSlotBooking(roomId, slot.hour, slot.minute);

    if (booking) {
      setSelectedBookingInfo(booking);
      setInfoModalOpen(true);
      return;
    }
    if (isSlotLocked(slot.hour, slot.minute)) {
      toast.info("Khung giờ này đã qua, không thể thao tác.");
      return;
    }

    // MOBILE / DESKTOP TAP EXTENSION: If same room, extend the range!
    if (selectedRange && selectedRange.roomId === roomId) {
      // Toggle off if clicking the exact same single slot
      if (selectedRange.startIndex === index && selectedRange.endIndex === index) {
        setSelectedRange(null);
        setIsSelecting(false);
        setDragStart(null);
        return;
      }

      const minIndex = Math.min(selectedRange.startIndex, index);
      const maxIndex = Math.max(selectedRange.endIndex, index);

      let valid = true;
      for (let i = minIndex; i <= maxIndex; i++) {
        if (getSlotBooking(roomId, SLOTS[i].hour, SLOTS[i].minute) || isSlotLocked(SLOTS[i].hour, SLOTS[i].minute)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        setSelectedRange({ roomId, startIndex: minIndex, endIndex: maxIndex });
        setIsSelecting(true);
        setDragStart({ roomId, index: selectedRange.startIndex });
        return;
      }
    }

    setIsSelecting(true);
    setDragStart({ roomId, index });
    setSelectedRange({ roomId, startIndex: index, endIndex: index });
  };

  const handleMouseEnter = (roomId: string, index: number) => {
    if (!isSelecting || !dragStart || dragStart.roomId !== roomId) return;

    const minIndex = Math.min(dragStart.index, index);
    const maxIndex = Math.max(dragStart.index, index);

    for (let i = minIndex; i <= maxIndex; i++) {
      if (getSlotBooking(roomId, SLOTS[i].hour, SLOTS[i].minute) || isSlotLocked(SLOTS[i].hour, SLOTS[i].minute)) {
        return;
      }
    }

    setSelectedRange({ roomId, startIndex: minIndex, endIndex: maxIndex });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const roomId = element.getAttribute("data-room-id");
    const indexStr = element.getAttribute("data-index");
    if (roomId && indexStr) {
      handleMouseEnter(roomId, parseInt(indexStr, 10));
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setDragStart(null);
  };

  useEffect(() => {
    if (isSelecting) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isSelecting]);

  // Calculations for Footer
  let selectedHours = 0;
  if (selectedRange) {
    const count = (selectedRange.endIndex - selectedRange.startIndex) + 1;
    selectedHours = count * 0.5;
  }
  const displayHours = Math.floor(selectedHours);
  const displayMins = (selectedHours % 1) * 60;
  const timeString = `${displayHours} giờ ${displayMins === 0 ? "00" : displayMins} phút`;
  const timeRangeString = selectedRange
    ? `${SLOTS[selectedRange.startIndex].hour}:${SLOTS[selectedRange.startIndex].minute.toString().padStart(2, "0")} - ${SLOTS[selectedRange.endIndex].hour}:${(SLOTS[selectedRange.endIndex].minute + 30).toString().padStart(2, "0")}`
    : "";

  const handleNext = () => {
    if (!selectedRange) {
      toast.warning("Vui lòng chọn khung giờ trống trên lịch trước khi xác nhận đặt lịch.");
      return;
    }

    setBookingTitle("");
    setParticipantsCount("");
    setBookerName(localStorage.getItem("roombooking_lastBookerName") || "");
    setBookingModalOpen(true);
  };

  const handleDeleteBooking = async () => {
    if (!selectedBookingInfo) return;

    const currentBookerName = localStorage.getItem("roombooking_lastBookerName") || "";
    
    // Check if their cached Local Storage name matches perfectly
    let isAuthorized = false;

    if (currentBookerName.trim().toLowerCase() === selectedBookingInfo.booker_name.trim().toLowerCase()) {
        isAuthorized = true;
    } else {
        // If not, ask them to type the name manually to prove they own it/are authorized
        const promptName = window.prompt(`Để bảo mật, vui lòng nhập chính xác tên người chủ trì cuộc họp:\n"${selectedBookingInfo.booker_name}"`);
        if (promptName !== null && promptName.trim().toLowerCase() === selectedBookingInfo.booker_name.trim().toLowerCase()) {
            isAuthorized = true;
        } else if (promptName !== null) { // User typed something wrong
            toast.error("Tên xác nhận không khớp! Bạn không thể huỷ lịch của người khác.");
            return;
        } else { // User cancelled the prompt
            return;
        }
    }

    if (!isAuthorized) {
        return;
    }

    // Attempt deletion
    const confirmed = window.confirm("Hành động này không thể hoàn tác. Bạn có chắc chắn muốn huỷ lịch này không?");
    if (!confirmed) return;

    const success = await deleteBooking(selectedBookingInfo.id);
    if (success) {
        toast.success("✅ Đã huỷ lịch thành công!");
        setInfoModalOpen(false);
    } else {
        toast.error("Có lỗi xảy ra khi huỷ lịch. Vui lòng thử lại sau.");
    }
  };

  const submitBooking = async () => {
    const room = rooms.find(r => r.id === selectedRange?.roomId);
    if (!selectedRange) return;

    // Equivalent Zod Validation Check 
    if (!participantsCount || participantsCount <= 0) {
      toast.error("Số lượng người tham gia phải lớn hơn 0");
      return;
    }
    if (room && participantsCount > room.capacity) {
      toast.error(`Số lượng không được vượt quá sức chứa phòng (${room.capacity} người)`);
      return;
    }

    const startSlot = SLOTS[selectedRange.startIndex];
    const endSlotRaw = selectedRange.endIndex + 1 < SLOTS.length ? SLOTS[selectedRange.endIndex + 1] : { hour: SLOTS[selectedRange.endIndex].hour, minute: SLOTS[selectedRange.endIndex].minute + 30 };
    const endHour = endSlotRaw.minute >= 60 ? endSlotRaw.hour + 1 : endSlotRaw.hour;
    const endMinute = endSlotRaw.minute % 60;

    const startTime = new Date(date);
    startTime.setHours(startSlot.hour, startSlot.minute, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    const res = await createBooking({
      room_id: selectedRange.roomId,
      title: bookingTitle || "Họp nội bộ",
      booker_name: bookerName,
      participants_count: Number(participantsCount),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    if (res.success) {
      toast.success("Tạo đặt lịch thành công!");
      localStorage.setItem("roombooking_lastBookerName", bookerName);
      setBookingModalOpen(false);
      setSelectedRange(null);
    } else {
      toast.error(res.error || "Lỗi tạo đặt lịch. Có thể do trùng lịch.");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-foreground font-sans">
        {/* Header Part 1: Deep Corporate Green */}
        <div className="bg-[#0f6c38] text-white flex-shrink-0 z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto">
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h1 className="text-lg md:text-xl font-bold tracking-tight">HỆ THỐNG ĐẶT PHÒNG HỌP NỘI BỘ</h1>

            <Popover>
              <PopoverTrigger className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-sm font-medium">
                <span>{format(date, "dd/MM/yyyy")}</span>
                <CalendarIcon className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 py-3 border-t border-white/10 text-xs font-medium px-4 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-white rounded-sm" />
              <span>Phòng trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-[#f87171] rounded-sm" />
              <span>Đang có cuộc họp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-[#9ca3af] rounded-sm" />
              <span>Bảo trì/Khoá</span>
            </div>
          </div>
        </div>

        {/* Header Part 2: Subtext Notice */}
        <div className="bg-[#f0fdf4] py-2 px-4 shadow-sm z-10 text-center text-sm border-b border-green-100 flex-shrink-0">
          <span className="text-[#ea580c] font-semibold">Lưu ý:</span>{" "}
          <span className="text-gray-700">Nếu cần đặt lịch cố định hàng tuần, vui lòng liên hệ bộ phận HCNS.</span>
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 overflow-auto relative select-none bg-[#f8fafc]" onMouseLeave={handleMouseUp} style={{ scrollBehavior: 'smooth' }}>
          {/* Time Header Row */}
          <div className="flex sticky top-0 z-30 bg-[#e0f2fe] border-b border-sky-200 min-w-max">
            <div className="w-24 flex-shrink-0 sticky left-0 z-40 bg-[#e0f2fe] border-r border-sky-200" />
            <div className="flex flex-1">
              {SLOTS.map((slot, index) => (
                <div key={index} className="w-16 flex-shrink-0 relative border-r border-sky-200/50 h-8 flex items-center justify-center">
                  {slot.minute === 0 && (
                    <span className="text-xs font-semibold text-sky-900 tabular-nums absolute z-50 -left-8 w-16 text-center bg-[#e0f2fe]">
                      {slot.hour}:00
                    </span>
                  )}

                  {index === SLOTS.length - 1 && (
                    <span className="text-xs font-semibold text-sky-900 tabular-nums absolute z-50 -right-8 w-16 text-center bg-[#e0f2fe]">
                      19:00
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Body */}
          <div className="min-w-max pb-32" onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
            {rooms.map((room) => (
              <div key={room.id} className="flex border-b border-gray-200 bg-white">
                <div className="w-24 flex-shrink-0 sticky left-0 z-20 bg-[#f0fdf4] border-r border-gray-200 flex flex-col justify-center px-2 py-4 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                  <span className="text-sm font-bold text-green-900 truncate" title={room.name}>{room.name}</span>
                  <span className="text-[10px] text-green-700 mt-0.5">{room.capacity} chỗ</span>
                </div>
                <div className="flex flex-1 py-1 px-1 relative">
                  {SLOTS.map((slot, index) => {
                    const booking = getSlotBooking(room.id, slot.hour, slot.minute);
                    const isLocked = isSlotLocked(slot.hour, slot.minute);
                    const isBooked = !!booking;
                    const isSelected = selectedRange && selectedRange.roomId === room.id && index >= selectedRange.startIndex && index <= selectedRange.endIndex;

                    // Text display logic on booked slots
                    let isFirstVisibleSlotOfBooking = false;
                    if (booking) {
                      const slotStart = setMinutes(setHours(date, slot.hour), slot.minute).getTime();
                      const bookingStart = parseISO(booking.start_time).getTime();
                      // It is the first visible slot if it matches the start exactly, OR if it's the very first slot of the grid (07:00) and the booking started before it.
                      if (slotStart === bookingStart || (index === 0 && bookingStart < slotStart)) {
                        isFirstVisibleSlotOfBooking = true;
                      }
                    }

                    const slotContent = (
                      <div
                        key={index}
                        data-room-id={room.id}
                        data-index={index}
                        onMouseDown={() => handleMouseDown(room.id, index)}
                        onMouseEnter={() => handleMouseEnter(room.id, index)}
                        onTouchStart={() => handleMouseDown(room.id, index)}
                        className={cn(
                          "h-14 w-16 flex-shrink-0 border-y border-r first:border-l border-gray-200/70 transition-all box-border relative flex items-center overflow-visible",
                          isBooked ? "bg-[#f87171] border-red-400 cursor-help" :
                            isLocked ? "bg-[#9ca3af] border-gray-400 cursor-not-allowed" :
                              isSelected ? "bg-green-100 border-green-600 scale-[1.02] z-10 cursor-crosshair ring-1 ring-green-600 ring-inset" :
                                "bg-white hover:bg-green-50 cursor-pointer"
                        )}
                        style={{
                          ...(isSelected && selectedRange && index > selectedRange.startIndex ? { borderLeftWidth: 0, marginLeft: -1 } : {}),
                          ...(isSelected && selectedRange && index < selectedRange.endIndex ? { borderRightWidth: 0, marginRight: -1 } : {})
                        }}
                      >
                        {isFirstVisibleSlotOfBooking && (
                          <div className="absolute left-1 z-20 text-[10px] md:text-xs font-bold text-white whitespace-nowrap pointer-events-none drop-shadow-sm max-w-[200px] truncate" style={{ width: 'max-content' }}>
                            {booking?.booker_name}
                          </div>
                        )}
                      </div>
                    );

                    if (isBooked) {
                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger render={slotContent} />
                          <TooltipContent className="z-50 bg-white p-3 shadow-xl border border-gray-100 rounded-lg max-w-[250px]">
                            <p className="font-bold text-sm text-slate-800">{booking.title}</p>
                            <div className="space-y-1 mt-2">
                              <p className="text-xs text-slate-600 break-words"><span className="font-medium">Chủ trì:</span> {booking.booker_name}</p>
                              <p className="text-xs text-slate-600 pt-1 border-t border-gray-50"><span className="font-medium text-emerald-700">Số lượng:</span> {booking.participants_count || 0} người</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return slotContent;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer System */}
        <div className="flex-shrink-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          <div className="bg-[#f8fafc] border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <span className="font-bold text-sm text-green-900">
              {selectedRange
                ? `Tổng thời gian dự kiến: ${timeString} (${timeRangeString})`
                : "Vui lòng chọn khung giờ trên lịch"}
            </span>
            <Button
              className="bg-[#eab308] hover:bg-[#d97706] text-white font-bold px-8 shadow-md"
              onClick={handleNext}
              disabled={!selectedRange}
            >
              XÁC NHẬN ĐẶT LỊCH
            </Button>
          </div>
        </div>

        {/* Information Modal */}
        <Dialog open={infoModalOpen} onOpenChange={(open) => { setInfoModalOpen(open); if (!open) setSelectedBookingInfo(null); }}>
          <DialogContent className="sm:max-w-[400px] rounded-xl border-t-4 border-t-red-500">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2 text-slate-800">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Thông tin Phòng đã đặt
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3 px-1 text-sm text-slate-600">
              <p><strong className="text-slate-800">Cuộc họp:</strong> {selectedBookingInfo?.title}</p>
              <p><strong className="text-slate-800">Người chủ trì:</strong> {selectedBookingInfo?.booker_name}</p>
              <p><strong className="text-slate-800 text-emerald-700">Số lượng tham gia:</strong> {selectedBookingInfo?.participants_count || 0} người</p>
              <p><strong className="text-slate-800">Thời gian:</strong> {selectedBookingInfo && format(parseISO(selectedBookingInfo.start_time), "HH:mm")} - {selectedBookingInfo && format(parseISO(selectedBookingInfo.end_time), "HH:mm")}</p>
            </div>
            <DialogFooter className="flex lg:justify-between items-center w-full gap-2 mt-2">
              <Button 
                 variant="destructive" 
                 onClick={handleDeleteBooking} 
                 className="w-full lg:w-auto flex items-center gap-2"
              >
                 <Trash2 className="w-4 h-4" /> Huỷ Đặt Lịch
              </Button>
              <Button variant="outline" onClick={() => setInfoModalOpen(false)} className="w-full lg:w-auto">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Checkout Modal / Create Booking */}
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-xl border-t-4 border-t-amber-500">
            <DialogHeader>
              <DialogTitle className="text-xl">Đăng ký họp</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex justify-center items-center text-sm">
                <span className="font-semibold text-amber-900 text-center">Đăng ký: {timeString}</span>
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề cuộc họp</Label>
                <Input placeholder="Vd: Họp giao ban phòng Tech" value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Người chủ trì</Label>
                <Input placeholder="Vd: Nguyễn Văn A" value={bookerName} onChange={e => setBookerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Số lượng người tham gia</Label>
                <Input type="number" min="1" placeholder="Vd: 5" value={participantsCount} onChange={e => setParticipantsCount(parseInt(e.target.value) || "")} required />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setBookingModalOpen(false)}>Huỷ</Button>
              <Button className="bg-[#15803d] hover:bg-[#166534] text-white" onClick={submitBooking}>Hoàn tất đăng ký</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
