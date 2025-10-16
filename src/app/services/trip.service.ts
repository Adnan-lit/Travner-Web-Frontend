import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { ApiResponse, ApiListResponse } from '../models/api-response.model';

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency: string;
  status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  authorId: string;
  authorUsername: string;
  participants: TripParticipant[];
  itinerary: TripItinerary[];
  expenses: TripExpense[];
  photos: TripPhoto[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  id: string;
  userId: string;
  username: string;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'VIEWER';
  status: 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'PENDING';
  joinedAt?: string;
}

export interface TripItinerary {
  id: string;
  day: number;
  date: string;
  title: string;
  description: string;
  location: string;
  startTime?: string;
  endTime?: string;
  activities: TripActivity[];
  accommodation?: TripAccommodation;
  transportation?: TripTransportation;
}

export interface TripActivity {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  cost?: number;
  category: 'SIGHTSEEING' | 'DINING' | 'ENTERTAINMENT' | 'SHOPPING' | 'RELAXATION' | 'ADVENTURE' | 'CULTURE' | 'OTHER';
  notes?: string;
}

export interface TripAccommodation {
  id: string;
  name: string;
  type: 'HOTEL' | 'HOSTEL' | 'AIRBNB' | 'CAMPING' | 'FRIEND_FAMILY' | 'OTHER';
  address: string;
  checkIn: string;
  checkOut: string;
  cost?: number;
  notes?: string;
}

export interface TripTransportation {
  id: string;
  type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR' | 'WALKING' | 'OTHER';
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  cost?: number;
  bookingReference?: string;
  notes?: string;
}

export interface TripExpense {
  id: string;
  category: 'ACCOMMODATION' | 'TRANSPORTATION' | 'FOOD' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: string;
  participants: string[];
  receipt?: string;
  notes?: string;
}

export interface TripPhoto {
  id: string;
  url: string;
  caption?: string;
  location?: string;
  takenAt: string;
  uploadedBy: string;
}

export interface CreateTripRequest {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  tags?: string[];
}

export interface UpdateTripRequest {
  title?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  status?: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private readonly API_BASE_URL = EnvironmentConfig.getApiBaseUrl();

  constructor(private http: HttpClient) { }

  // Trip Management

  /**
   * Get all trips with pagination and filtering
   */
  getTrips(page: number = 0, size: number = 10, search?: string, status?: string, destination?: string): Observable<ApiListResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (destination) {
      params = params.set('destination', destination);
    }

    return this.http.get<ApiListResponse<Trip>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error('Error fetching trips:', error);
        throw error;
      })
    );
  }

  /**
   * Get trip by ID
   */
  getTripById(tripId: string): Observable<ApiResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}`;
    return this.http.get<ApiResponse<Trip>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a new trip
   */
  createTrip(tripData: CreateTripRequest): Observable<ApiResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips`;
    return this.http.post<ApiResponse<Trip>>(endpoint, tripData).pipe(
      catchError(error => {
        console.error('Error creating trip:', error);
        throw error;
      })
    );
  }

  /**
   * Update trip
   */
  updateTrip(tripId: string, tripData: UpdateTripRequest): Observable<ApiResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}`;
    return this.http.put<ApiResponse<Trip>>(endpoint, tripData).pipe(
      catchError(error => {
        console.error(`Error updating trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete trip
   */
  deleteTrip(tripId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get user's trips
   */
  getUserTrips(userId: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/user/${userId}`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Trip>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching trips for user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get trips by destination
   */
  getTripsByDestination(destination: string, page: number = 0, size: number = 10): Observable<ApiListResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/destination/${destination}`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<Trip>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching trips for destination ${destination}:`, error);
        throw error;
      })
    );
  }

  // Trip Participants

  /**
   * Add participant to trip
   */
  addParticipant(tripId: string, userId: string, role: 'PARTICIPANT' | 'VIEWER' = 'PARTICIPANT'): Observable<ApiResponse<TripParticipant>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/participants`;
    return this.http.post<ApiResponse<TripParticipant>>(endpoint, { userId, role }).pipe(
      catchError(error => {
        console.error(`Error adding participant to trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Remove participant from trip
   */
  removeParticipant(tripId: string, userId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/participants/${userId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error removing participant from trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Update participant role
   */
  updateParticipantRole(tripId: string, userId: string, role: 'ORGANIZER' | 'PARTICIPANT' | 'VIEWER'): Observable<ApiResponse<TripParticipant>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/participants/${userId}`;
    return this.http.put<ApiResponse<TripParticipant>>(endpoint, { role }).pipe(
      catchError(error => {
        console.error(`Error updating participant role in trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Accept trip invitation
   */
  acceptTripInvitation(tripId: string): Observable<ApiResponse<TripParticipant>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/accept`;
    return this.http.post<ApiResponse<TripParticipant>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error accepting trip invitation ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Decline trip invitation
   */
  declineTripInvitation(tripId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/decline`;
    return this.http.post<ApiResponse<void>>(endpoint, {}).pipe(
      catchError(error => {
        console.error(`Error declining trip invitation ${tripId}:`, error);
        throw error;
      })
    );
  }

  // Trip Itinerary

  /**
   * Add itinerary item
   */
  addItineraryItem(tripId: string, itineraryData: Omit<TripItinerary, 'id'>): Observable<ApiResponse<TripItinerary>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/itinerary`;
    return this.http.post<ApiResponse<TripItinerary>>(endpoint, itineraryData).pipe(
      catchError(error => {
        console.error(`Error adding itinerary item to trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Update itinerary item
   */
  updateItineraryItem(tripId: string, itemId: string, itineraryData: Partial<TripItinerary>): Observable<ApiResponse<TripItinerary>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/itinerary/${itemId}`;
    return this.http.put<ApiResponse<TripItinerary>>(endpoint, itineraryData).pipe(
      catchError(error => {
        console.error(`Error updating itinerary item ${itemId} in trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete itinerary item
   */
  deleteItineraryItem(tripId: string, itemId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/itinerary/${itemId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting itinerary item ${itemId} from trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  // Trip Expenses

  /**
   * Add expense
   */
  addExpense(tripId: string, expenseData: Omit<TripExpense, 'id'>): Observable<ApiResponse<TripExpense>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/expenses`;
    return this.http.post<ApiResponse<TripExpense>>(endpoint, expenseData).pipe(
      catchError(error => {
        console.error(`Error adding expense to trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Update expense
   */
  updateExpense(tripId: string, expenseId: string, expenseData: Partial<TripExpense>): Observable<ApiResponse<TripExpense>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/expenses/${expenseId}`;
    return this.http.put<ApiResponse<TripExpense>>(endpoint, expenseData).pipe(
      catchError(error => {
        console.error(`Error updating expense ${expenseId} in trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete expense
   */
  deleteExpense(tripId: string, expenseId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/expenses/${expenseId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting expense ${expenseId} from trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get trip expenses summary
   */
  getTripExpensesSummary(tripId: string): Observable<ApiResponse<{
    totalExpenses: number;
    expensesByCategory: { [key: string]: number };
    expensesByParticipant: { [key: string]: number };
    currency: string;
  }>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/expenses/summary`;
    return this.http.get<ApiResponse<{
      totalExpenses: number;
      expensesByCategory: { [key: string]: number };
      expensesByParticipant: { [key: string]: number };
      currency: string;
    }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error fetching expenses summary for trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  // Trip Photos

  /**
   * Upload trip photo
   */
  uploadTripPhoto(tripId: string, file: File, caption?: string, location?: string): Observable<ApiResponse<TripPhoto>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/photos`;
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    if (location) {
      formData.append('location', location);
    }

    return this.http.post<ApiResponse<TripPhoto>>(endpoint, formData).pipe(
      catchError(error => {
        console.error(`Error uploading photo to trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get trip photos
   */
  getTripPhotos(tripId: string, page: number = 0, size: number = 20): Observable<ApiListResponse<TripPhoto>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/photos`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiListResponse<TripPhoto>>(endpoint, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching photos for trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete trip photo
   */
  deleteTripPhoto(tripId: string, photoId: string): Observable<ApiResponse<void>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/photos/${photoId}`;
    return this.http.delete<ApiResponse<void>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error deleting photo ${photoId} from trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  // Trip Sharing

  /**
   * Share trip with user
   */
  shareTrip(tripId: string, userId: string, role: 'PARTICIPANT' | 'VIEWER' = 'VIEWER'): Observable<ApiResponse<TripParticipant>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/share`;
    return this.http.post<ApiResponse<TripParticipant>>(endpoint, { userId, role }).pipe(
      catchError(error => {
        console.error(`Error sharing trip ${tripId} with user ${userId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get trip sharing link
   */
  getTripSharingLink(tripId: string): Observable<ApiResponse<{ shareUrl: string; expiresAt: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/share-link`;
    return this.http.get<ApiResponse<{ shareUrl: string; expiresAt: string }>>(endpoint).pipe(
      catchError(error => {
        console.error(`Error getting sharing link for trip ${tripId}:`, error);
        throw error;
      })
    );
  }

  // Trip Templates

  /**
   * Save trip as template
   */
  saveTripAsTemplate(tripId: string, templateName: string): Observable<ApiResponse<{ templateId: string }>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/${tripId}/template`;
    return this.http.post<ApiResponse<{ templateId: string }>>(endpoint, { templateName }).pipe(
      catchError(error => {
        console.error(`Error saving trip ${tripId} as template:`, error);
        throw error;
      })
    );
  }

  /**
   * Create trip from template
   */
  createTripFromTemplate(templateId: string, tripData: CreateTripRequest): Observable<ApiResponse<Trip>> {
    const endpoint = `${this.API_BASE_URL}/api/trips/from-template/${templateId}`;
    return this.http.post<ApiResponse<Trip>>(endpoint, tripData).pipe(
      catchError(error => {
        console.error(`Error creating trip from template ${templateId}:`, error);
        throw error;
      })
    );
  }
}

