import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import {
  LocalGuide,
  LocalGuideCreate,
  LocalGuideSearchParams,
  LocalGuideListResponse,
  LocalGuideResponse
} from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocalGuideService {
  private apiUrl = `${EnvironmentConfig.getApiBaseUrl()}/api/local-guides`;

  constructor(private http: HttpClient) {}

  // Get all local guides with search and pagination
  getLocalGuides(params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(this.apiUrl, { params: httpParams });
  }

  // Get local guide by ID
  getLocalGuide(id: string): Observable<LocalGuideResponse> {
    return this.http.get<LocalGuideResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new local guide profile
  createLocalGuide(localGuide: LocalGuideCreate): Observable<LocalGuideResponse> {
    return this.http.post<LocalGuideResponse>(this.apiUrl, localGuide);
  }

  // Update local guide profile
  updateLocalGuide(id: string, localGuide: Partial<LocalGuideCreate>): Observable<LocalGuideResponse> {
    return this.http.put<LocalGuideResponse>(`${this.apiUrl}/${id}`, localGuide);
  }

  // Delete local guide profile
  deleteLocalGuide(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get user's local guide profile
  getUserLocalGuide(userId: string): Observable<LocalGuideResponse> {
    return this.http.get<LocalGuideResponse>(`${this.apiUrl}/user/${userId}`);
  }

  // Get available local guides
  getAvailableGuides(params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams().set('isAvailable', 'true');
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(`${this.apiUrl}/available`, { params: httpParams });
  }

  // Get guides by location
  getGuidesByLocation(location: string, params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams().set('location', location);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(`${this.apiUrl}/location/${location}`, { params: httpParams });
  }

  // Get guides by specialty
  getGuidesBySpecialty(specialty: string, params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams().set('specialty', specialty);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(`${this.apiUrl}/specialty/${specialty}`, { params: httpParams });
  }

  // Search local guides
  searchGuides(query: string, params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams().set('query', query);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(`${this.apiUrl}/search`, { params: httpParams });
  }

  // Get top-rated guides
  getTopRatedGuides(params?: LocalGuideSearchParams): Observable<LocalGuideListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof LocalGuideSearchParams];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LocalGuideListResponse>(`${this.apiUrl}/top-rated`, { params: httpParams });
  }
}
