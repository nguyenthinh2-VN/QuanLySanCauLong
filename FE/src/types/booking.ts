export type CourtStatus = 'AVAILABLE' | 'MAINTENANCE';

export type SlotStatus = 'FREE' | 'BOOKED' | 'PASSED' | 'UNAVAILABLE';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED';

export type BookingSortField = 'bookingDate' | 'createdAt' | 'totalAmount';

export type BookingSortParam =
  | 'createdAt,desc'
  | 'createdAt,asc'
  | 'bookingDate,desc'
  | 'bookingDate,asc'
  | 'totalAmount,desc'
  | 'totalAmount,asc';

export interface TimeSlotAvailability {
  timeSlotId: number;
  name: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  slotStatus: SlotStatus;
}

export interface CourtAvailabilityResponse {
  courtId: number;
  courtName: string;
  complexName: string;
  courtStatus: CourtStatus;
  slots: TimeSlotAvailability[];
}

export interface CreateBookingRequest {
  courtId: number;
  bookingDate: string;
  timeSlotId: number;
  note?: string;
}

export interface UpdateBookingRequest {
  courtId?: number;
  bookingDate?: string;
  timeSlotId?: number;
  note?: string;
}

export interface BookingResponse {
  id: number;
  userId: number | null;
  userFullName: string | null;
  userEmail?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  courtId: number;
  courtName: string;
  complexId: number;
  complexName: string;
  bookingDate: string;
  timeSlotId: number;
  timeSlotName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface MyBookingsQueryParams {
  status?: BookingStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: BookingSortParam;
}

export interface SelectedBookingSlot {
  courtId: number;
  courtName: string;
  complexName: string;
  slot: TimeSlotAvailability;
}

