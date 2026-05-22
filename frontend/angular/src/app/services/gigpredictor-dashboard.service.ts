import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { TEST_BOOKING_RESPONSE } from '../data/test-booking-response';
import { TEST_RADAR_RESPONSE } from '../data/test-radar-response';
import { BookingRequest, BookingResponse, RadarRequest, RadarResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class GigpredictorDashboardService {
  private readonly http = inject(HttpClient);

  getRadarInsights(request: RadarRequest): Observable<RadarResponse> {
    return this.http.post<RadarResponse>('/api/radar', request).pipe(catchError(() => of(TEST_RADAR_RESPONSE)));
  }

  getBookingRecommendations(request: BookingRequest): Observable<BookingResponse> {
    return this.http
      .post<BookingResponse>('/api/recommend-booking', request)
      .pipe(catchError(() => of(TEST_BOOKING_RESPONSE)));
  }
}
