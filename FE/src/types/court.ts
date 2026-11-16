export type ComplexStatus = 'ACTIVE' | 'INACTIVE';
export type CourtStatus = 'AVAILABLE' | 'MAINTENANCE';

export interface Complex {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  status: ComplexStatus;
  totalCourts: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourtSummary {
  id: number;
  name: string;
  status: CourtStatus;
}

export interface ComplexDetail {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  status: ComplexStatus;
  totalCourts?: number;
  createdAt: string;
  updatedAt: string;
  courts: CourtSummary[];
}

export interface Court {
  id: number;
  name: string;
  status: CourtStatus;
  complexId: number;
  complexName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: number;
  name: string;
  startTime: string; // "HH:mm:ss" hoặc "HH:mm"
  endTime: string;   // "HH:mm:ss" hoặc "HH:mm"
  pricePerHour: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplexRequest {
  name: string;
  address: string;
  phone?: string;
  status?: ComplexStatus;
}

export interface UpdateComplexRequest {
  name: string;
  address: string;
  phone: string;
  status: ComplexStatus;
}

export interface CreateCourtRequest {
  complexId: number;
  name: string;
  status?: CourtStatus;
}

export interface UpdateCourtRequest {
  name: string;
  status: CourtStatus;
}

export interface CreateTimeSlotRequest {
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  pricePerHour: number;
}

export interface UpdateTimeSlotRequest {
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  pricePerHour: number;
}

export interface ComplexQueryParams {
  q?: string;
  status?: ComplexStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CourtQueryParams {
  complexId?: number;
  status?: CourtStatus;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}
