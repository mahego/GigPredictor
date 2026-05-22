import { CommonModule, NgFor, NgStyle } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AreaInsightsMapComponent } from '../../components/area-insights-map/area-insights-map.component';
import { TEST_RADAR_RESPONSE } from '../../data/test-radar-response';
import { RadarResponse } from '../../models/dashboard.model';
import { GigpredictorDashboardService } from '../../services/gigpredictor-dashboard.service';

@Component({
  selector: 'app-radar-dashboard-page',
  standalone: true,
  imports: [CommonModule, NgFor, NgStyle, AreaInsightsMapComponent],
  templateUrl: './radar-dashboard.page.html',
  styleUrl: './radar-dashboard.page.css'
})
export class RadarDashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(GigpredictorDashboardService);

  protected radar: RadarResponse = TEST_RADAR_RESPONSE;
  protected readonly mapApiKey = '';

  ngOnInit(): void {
    this.dashboardService.getRadarInsights({ lat: 19.9294, lng: -96.8514, radius: 18 }).subscribe((response) => {
      this.radar = response;
    });
  }

  protected get genreChartStyle(): string {
    let offset = 0;
    const slices = this.radar.genre_distribution.map((entry, index) => {
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
