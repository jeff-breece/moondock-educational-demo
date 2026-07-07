export interface CampsiteFacts {
  id: number;
  campgroundName: string;
  campgroundId: string;
  provider: string;
  siteId: string;
  siteType: string;
  siteTypeLabel: string;
  isReservable: boolean;
  loop?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  bookingUrl: string;
  receivedAt: string;
  status: SiteStatus;
  matchScore: number;
  recAreaName?: string;
}

export type SiteStatus = 'New' | 'Interested' | 'Booked' | 'Dismissed';
export type FitScore = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface DerivedSignals {
  primitiveFit: FitScore;
  primitiveFitBasis: string[];
  seclusionEstimate: FitScore;
  seclusionBasis: string[];
  forestBathingFit: FitScore;
  forestBathingBasis: string[];
}

export interface CampsiteSearchRecord {
  id: number;
  campgroundName: string;
  provider: string;
  siteId: string;
  siteType: string;
  isReservable: boolean;
  checkIn: string;
  checkOut: string;
  bookingUrl: string;
  matchScore: number;
  status: SiteStatus;
  receivedAt: string;
}

export interface SearchIntent {
  provider: string;
  destinationMode: 'campground' | 'recreation-area';
  campgroundIds: string[];
  recreationAreaIds: string[];
  startDate: string;
  endDate: string;
  nights: number;
  equipment: string[];
}

export interface SelectedSite extends CampsiteSearchRecord {
  campgroundId?: string;
  recAreaId?: string;
  recAreaName?: string;
  nights?: number;
}

export interface TripPlan {
  id?: number;
  name: string;
  provider: string;
  campgroundId: string;
  campgroundName: string;
  recAreaId: string;
  recAreaName: string;
  startDate: string;
  endDate: string;
  nights: number;
  status: 'Planned' | 'Booked' | 'Completed' | 'Cancelled';
  notes?: string;
  checklistJson: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface OutingLogEntry {
  id?: number;
  date: string;
  location: string;
  notes?: string;
  durationDays: number;
  recordedAt?: string;
}

export interface OutingNotes {
  title?: string;
  journal?: string;
  hikes?: string;
  meals?: string;
  siteNotes?: string;
  photos?: string[];
}
