import { logger } from '../core/logging/logger';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { getApiBaseUrl } from '../config/runtime.config';
import {
  ItineraryCreate,
  ItinerarySearchParams,
  ItineraryListResponse,
  ItineraryResponse,
} from '../models/location.model';

@Injectable({
  providedIn: 'root',
})
export class ItineraryService {
  private apiUrl = `${getApiBaseUrl()}/api/itineraries`;

  constructor(private http: HttpClient) {}

  // Get all itineraries with search and pagination
  getItineraries(params?: ItinerarySearchParams): Observable<ItineraryListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ItinerarySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => (httpParams = httpParams.append(key, v.toString())));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    logger.debug('🧳 ItineraryService: Making request to:', this.apiUrl);
    logger.debug('🧳 ItineraryService: Params:', params);
    logger.debug('🧳 ItineraryService: HttpParams:', httpParams.toString());

    return this.http.get<ItineraryListResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap((response: any) => {
        logger.debug('✅ ItineraryService: Response received:', response);
      }),
      catchError((error: any) => {
        logger.error('❌ ItineraryService: Error fetching itineraries:', error);
        throw error;
      }),
    );
  }

  // Get itinerary by ID
  getItinerary(id: string): Observable<ItineraryResponse> {
    return this.http.get<ItineraryResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new itinerary
  createItinerary(itinerary: ItineraryCreate): Observable<ItineraryResponse> {
    return this.http.post<ItineraryResponse>(this.apiUrl, itinerary);
  }

  // Update itinerary
  updateItinerary(id: string, itinerary: Partial<ItineraryCreate>): Observable<ItineraryResponse> {
    return this.http.put<ItineraryResponse>(`${this.apiUrl}/${id}`, itinerary);
  }

  // Delete itinerary
  deleteItinerary(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get user's itineraries
  getUserItineraries(userId: string, params?: ItinerarySearchParams): Observable<ItineraryListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ItinerarySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => (httpParams = httpParams.append(key, v.toString())));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ItineraryListResponse>(`${this.apiUrl}/user/${userId}`, { params: httpParams });
  }

  // Get public itineraries
  getPublicItineraries(params?: ItinerarySearchParams): Observable<ItineraryListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ItinerarySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => (httpParams = httpParams.append(key, v.toString())));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ItineraryListResponse>(`${this.apiUrl}/public`, { params: httpParams });
  }

  // Get template itineraries
  getTemplateItineraries(params?: ItinerarySearchParams): Observable<ItineraryListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ItinerarySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => (httpParams = httpParams.append(key, v.toString())));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ItineraryListResponse>(`${this.apiUrl}/templates`, { params: httpParams });
  }

  // Search itineraries
  searchItineraries(query: string, params?: ItinerarySearchParams): Observable<ItineraryListResponse> {
    let httpParams = new HttpParams().set('query', query);

    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof ItinerarySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => (httpParams = httpParams.append(key, v.toString())));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ItineraryListResponse>(`${this.apiUrl}/search`, { params: httpParams });
  }
}
