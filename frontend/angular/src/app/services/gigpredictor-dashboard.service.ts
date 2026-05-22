import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingRequest, BookingResponse, RadarRequest, RadarResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class GigpredictorDashboardService {
  private readonly http = inject(HttpClient);

  getRadarInsights(request: RadarRequest): Observable<RadarResponse> {
    return this.http.post<RadarResponse>('/api/radar', request);
  }

  getBookingRecommendations(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>('/api/recommend-booking', request);
  }
}
