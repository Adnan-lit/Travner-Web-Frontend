import { User } from './common.model';
import { ApiResponse, ApiPaginationInfo } from './api-response.model';

// Itinerary models
export interface Itinerary {
  id: string;
  title: string;
  description: string;
  destination: string;
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  items: ItineraryItem[];
  tags: string[];
  isPublic: boolean;
  isTemplate: boolean;
  estimatedBudget?: number;
  currency: string;
  likes: number;
  shares: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface ItineraryItem {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  notes?: string;
  estimatedCost?: number;
  currency?: string;
  attachments?: string[];
}

export interface ItineraryCreate {
  title: string;
  description: string;
  destination: string;
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  items: ItineraryItemCreate[];
  tags: string[];
  isPublic: boolean;
  isTemplate: boolean;
  estimatedBudget?: number;
  currency: string;
}

export interface ItineraryItemCreate {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  notes?: string;
  estimatedCost?: number;
  currency?: string;
  attachments?: string[];
}

// Travel Buddy models
export interface TravelBuddy {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  maxAge?: number;
  minAge?: number;
  preferredGender?: string;
  budgetRange?: string;
  status: 'active' | 'matched' | 'expired' | 'cancelled';
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface TravelBuddyCreate {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  maxAge?: number;
  minAge?: number;
  preferredGender?: string;
  budgetRange?: string;
  expiryDays: number;
}

// Local Guide models
export interface LocalGuide {
  id: string;
  userId: string;
  location: string;
  languages: string[];
  specialties: string[];
  bio: string;
  hourlyRate: number;
  currency: string;
  isAvailable: boolean;
  availability?: string;
  contactMethod?: string;
  contactInfo?: string;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  certifications?: string[];
  experience?: string[];
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface LocalGuideCreate {
  location: string;
  languages: string[];
  specialties: string[];
  bio: string;
  hourlyRate: number;
  currency: string;
  availability?: string;
  contactMethod?: string;
  contactInfo?: string;
  certifications?: string[];
  experience?: string[];
}

// Search and filter interfaces
export interface ItinerarySearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  query?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  isPublic?: boolean;
  isTemplate?: boolean;
  userId?: string;
}

export interface TravelBuddySearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  query?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  interests?: string[];
  maxAge?: number;
  minAge?: number;
  preferredGender?: string;
  status?: string;
}

export interface LocalGuideSearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  query?: string;
  location?: string;
  languages?: string[];
  specialties?: string[];
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}

// API Response types
export type ItineraryListResponse = ApiResponse<Itinerary[]> & {
  pagination: ApiPaginationInfo;
};

export type ItineraryResponse = ApiResponse<Itinerary>;

export type TravelBuddyListResponse = ApiResponse<TravelBuddy[]> & {
  pagination: ApiPaginationInfo;
};

export type TravelBuddyResponse = ApiResponse<TravelBuddy>;

export type LocalGuideListResponse = ApiResponse<LocalGuide[]> & {
  pagination: ApiPaginationInfo;
};

export type LocalGuideResponse = ApiResponse<LocalGuide>;
