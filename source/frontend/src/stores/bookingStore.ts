import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Room } from '@/types';

interface BookingState {
  // State
  checkInDate: string;
  checkOutDate: string;
  selectedRoom: Room | null;
  numberOfGuests: number;
  note: string;
  faceImage: string | null;
  currentStep: number;

  // Actions
  setDates: (checkIn: string, checkOut: string) => void;
  setRoom: (room: Room | null) => void;
  setGuests: (guests: number) => void;
  setNote: (note: string) => void;
  setFaceImage: (image: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  // Getters / Computed
  getNights: () => number;
  getTotalPrice: () => number;
}

const initialState = {
  checkInDate: '',
  checkOutDate: '',
  selectedRoom: null,
  numberOfGuests: 1,
  note: '',
  faceImage: null,
  currentStep: 1,
};

/**
 * Zustand Store quản lý trạng thái luồng đặt phòng
 * LƯU Ý: Tuyệt đối KHÔNG persist để bảo mật thông tin và tránh rò rỉ dữ liệu phiên
 */
export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  setDates: (checkInDate: string, checkOutDate: string) => {
    set({ checkInDate, checkOutDate });
  },

  setRoom: (selectedRoom: Room | null) => {
    set({ selectedRoom });
  },

  setGuests: (numberOfGuests: number) => {
    set({ numberOfGuests });
  },

  setNote: (note: string) => {
    set({ note });
  },

  setFaceImage: (faceImage: string | null) => {
    set({ faceImage });
  },

  nextStep: () => {
    set((state) => ({ currentStep: state.currentStep + 1 }));
  },

  prevStep: () => {
    set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) }));
  },

  reset: () => {
    set(initialState);
  },

  /**
   * Tính số đêm lưu trú giữa check_in_date và check_out_date
   */
  getNights: () => {
    const { checkInDate, checkOutDate } = get();
    if (!checkInDate || !checkOutDate) return 0;

    const start = dayjs(checkInDate);
    const end = dayjs(checkOutDate);
    const diff = end.diff(start, 'day');

    return diff > 0 ? diff : 0;
  },

  /**
   * Tính tổng tiền dự kiến dựa trên số đêm và giá cơ bản của phòng
   */
  getTotalPrice: () => {
    const nights = get().getNights();
    const basePrice = get().selectedRoom?.room_type?.base_price ?? 0;
    return nights * basePrice;
  },
}));
