import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import {
  TravelBuddy,
  TravelBuddyCreate,
  TravelBuddySearchParams,
  TravelBuddyListResponse,
  TravelBuddyResponse
} from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class TravelBuddyService {
  private apiUrl = `${EnvironmentConfig.getApiBaseUrl()}/api/travel-buddies`;

  constructor(private http: HttpClient) {}

  // Get all travel buddies with search and pagination
  getTravelBuddies(params?: TravelBuddySearchParams): Observable<TravelBuddyListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof TravelBuddySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<TravelBuddyListResponse>(this.apiUrl, { params: httpParams });
  }

  // Get travel buddy by ID
  getTravelBuddy(id: string): Observable<TravelBuddyResponse> {
    return this.http.get<TravelBuddyResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new travel buddy request
  createTravelBuddy(travelBuddy: TravelBuddyCreate): Observable<TravelBuddyResponse> {
    return this.http.post<TravelBuddyResponse>(this.apiUrl, travelBuddy);
  }

  // Update travel buddy request
  updateTravelBuddy(id: string, travelBuddy: Partial<TravelBuddyCreate>): Observable<TravelBuddyResponse> {
    return this.http.put<TravelBuddyResponse>(`${this.apiUrl}/${id}`, travelBuddy);
  }

  // Delete travel buddy request
  deleteTravelBuddy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get user's travel buddy requests
  getUserTravelBuddies(userId: string, params?: TravelBuddySearchParams): Observable<TravelBuddyListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof TravelBuddySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<TravelBuddyListResponse>(`${this.apiUrl}/user/${userId}`, { params: httpParams });
  }

  // Get active travel buddies
  getActiveTravelBuddies(params?: TravelBuddySearchParams): Observable<TravelBuddyListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof TravelBuddySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<TravelBuddyListResponse>(`${this.apiUrl}/active`, { params: httpParams });
  }

  // Search travel buddies
  searchTravelBuddies(query: string, params?: TravelBuddySearchParams): Observable<TravelBuddyListResponse> {
    let httpParams = new HttpParams().set('query', query);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof TravelBuddySearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<TravelBuddyListResponse>(`${this.apiUrl}/search`, { params: httpParams });
  }

  // Match travel buddies
  matchTravelBuddies(travelBuddyId: string): Observable<TravelBuddyListResponse> {
    return this.http.get<TravelBuddyListResponse>(`${this.apiUrl}/${travelBuddyId}/matches`);
  }
}
