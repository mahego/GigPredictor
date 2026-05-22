import { CommonModule, NgFor, NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AreaInsightsMapComponent } from '../../components/area-insights-map/area-insights-map.component';
import { LocationPickerMapComponent, PickedLocation } from '../../components/location-picker-map/location-picker-map.component';
import { RadarResponse } from '../../models/dashboard.model';
import { ConfigService } from '../../services/config.service';
import { GigpredictorDashboardService } from '../../services/gigpredictor-dashboard.service';

@Component({
  selector: 'app-radar-dashboard-page',
  standalone: true,
  imports: [CommonModule, NgFor, NgStyle, AreaInsightsMapComponent, LocationPickerMapComponent],
  templateUrl: './radar-dashboard.page.html',
  styleUrl: './radar-dashboard.page.css'
})
export class RadarDashboardPageComponent {
  private readonly dashboardService = inject(GigpredictorDashboardService);
  private readonly configService = inject(ConfigService);

  protected radar: RadarResponse | null = null;
  protected loading = false;
  protected error: string | null = null;
  protected showPicker = true;
  protected pickedAddress = '';

  protected get mapApiKey(): string {
    return this.configService.mapsApiKey;
  }

  protected onLocationConfirmed(location: PickedLocation): void {
    this.showPicker = false;
    this.loading = true;
    this.error = null;
    this.radar = null;
    this.pickedAddress = location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

    this.dashboardService
      .getRadarInsights({ lat: location.lat, lng: location.lng, radius: location.radius, genres: location.genres })
      .subscribe({
        next: (response) => {
          this.radar = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.message ?? 'Error al cargar el radar local';
          this.loading = false;
        }
      });
  }

  protected changeZone(): void {
    this.showPicker = true;
    this.radar = null;
    this.error = null;
  }

  protected get genreChartStyle(): string {
    const radar = this.radar;
    if (!radar) return '';
    let offset = 0;
    const slices = radar.genre_distribution.map((entry, index) => {
      const start = offset;
      offset += entry.percentage;
      return `${this.getColor(index)} ${start}% ${offset}%`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  }

  protected getChannelSummary(channels: string[]): string {
    return channels.join(' · ');
  }

  protected getColor(index: number): string {
    return ['#38bdf8', '#22c55e', '#f59e0b', '#f97316', '#a855f7', '#f43f5e'][index % 6];
  }
}
