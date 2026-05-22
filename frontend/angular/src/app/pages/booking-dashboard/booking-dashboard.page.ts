import { CommonModule, CurrencyPipe, NgClass, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaInsightsMapComponent } from '../../components/area-insights-map/area-insights-map.component';
import { LocationPickerMapComponent, PickedLocation } from '../../components/location-picker-map/location-picker-map.component';
import { BookingRecommendation, BookingResponse } from '../../models/dashboard.model';
import { ConfigService } from '../../services/config.service';
import { GigpredictorDashboardService } from '../../services/gigpredictor-dashboard.service';

@Component({
  selector: 'app-booking-dashboard-page',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass, FormsModule, CurrencyPipe, AreaInsightsMapComponent, LocationPickerMapComponent],
  templateUrl: './booking-dashboard.page.html',
  styleUrl: './booking-dashboard.page.css'
})
export class BookingDashboardPageComponent {
  private readonly dashboardService = inject(GigpredictorDashboardService);
  private readonly configService = inject(ConfigService);

  protected booking: BookingResponse | null = null;
  protected selectedArtist: BookingRecommendation | null = null;
  protected loading = false;
  protected error: string | null = null;
  protected showPicker = true;
  protected pickedAddress = '';
  protected pickedLocation: PickedLocation | null = null;
  protected criteria = {
    budget: 400000,
    radius: 18,
    dates: ''
  };

  protected get mapApiKey(): string {
    return this.configService.mapsApiKey;
  }

  protected get datesLabel(): string {
    const parts = this.criteria.dates.split(',').map(d => d.trim()).filter(Boolean);
    return parts.length ? parts.join(' y ') : 'fecha seleccionada';
  }

  protected onLocationConfirmed(location: PickedLocation): void {
    this.pickedLocation = location;
    this.pickedAddress = location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    this.criteria.radius = location.radius;
    this.showPicker = false;
  }

  protected changeZone(): void {
    this.showPicker = true;
    this.booking = null;
    this.error = null;
  }

  protected loadRecommendations(): void {
    if (!this.pickedLocation) return;

    const dates = this.criteria.dates
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean);

    this.loading = true;
    this.error = null;
    this.dashboardService
      .getBookingRecommendations({
        lat: this.pickedLocation.lat,
        lng: this.pickedLocation.lng,
        radius: this.criteria.radius,
        dates,
        budget: this.criteria.budget
      })
      .subscribe({
        next: (response) => {
          this.booking = response;
          this.selectedArtist = response.selected_artist ?? response.recommendations[0] ?? null;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.message ?? 'Error al calcular recomendaciones';
          this.loading = false;
        }
      });
  }

  protected selectArtist(artist: BookingRecommendation): void {
    this.selectedArtist = artist;
  }
}
