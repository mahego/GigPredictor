import { CommonModule, CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaInsightsMapComponent } from '../../components/area-insights-map/area-insights-map.component';
import { TEST_BOOKING_RESPONSE } from '../../data/test-booking-response';
import { BookingRecommendation, BookingResponse } from '../../models/dashboard.model';
import { GigpredictorDashboardService } from '../../services/gigpredictor-dashboard.service';

@Component({
  selector: 'app-booking-dashboard-page',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass, FormsModule, CurrencyPipe, AreaInsightsMapComponent],
  templateUrl: './booking-dashboard.page.html',
  styleUrl: './booking-dashboard.page.css'
})
export class BookingDashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(GigpredictorDashboardService);

  protected booking: BookingResponse = TEST_BOOKING_RESPONSE;
  protected selectedArtist: BookingRecommendation | null = TEST_BOOKING_RESPONSE.selected_artist;
  protected readonly mapApiKey = '';
  protected criteria = {
    budget: 400000,
    radius: 18,
    dates: '2026-05-23,2026-05-24'
  };

  ngOnInit(): void {
    this.loadRecommendations();
  }

  protected loadRecommendations(): void {
    const dates = this.criteria.dates
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean);

    this.dashboardService
      .getBookingRecommendations({
        lat: 19.9294,
        lng: -96.8514,
        radius: this.criteria.radius,
        dates,
        budget: this.criteria.budget
      })
      .subscribe((response) => {
        this.booking = response;
        this.selectedArtist = response.selected_artist ?? response.recommendations[0] ?? null;
      });
  }

  protected selectArtist(artist: BookingRecommendation): void {
    this.selectedArtist = artist;
  }
}
