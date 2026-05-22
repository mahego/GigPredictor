import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule, NgFor, NgIf, NgStyle } from '@angular/common';
import { MapHotspot } from '../../models/dashboard.model';

declare global {
  interface Window {
    google?: typeof google;
  }
}

@Component({
  selector: 'app-area-insights-map',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, NgStyle],
  templateUrl: './area-insights-map.component.html',
  styleUrl: './area-insights-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AreaInsightsMapComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) center!: { lat: number; lng: number };
  @Input() radiusKm = 18;
  @Input() hotspots: MapHotspot[] = [];
  @Input() mapApiKey = '';
  @Input() emptyState = 'Sin puntos calientes disponibles';
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  protected readonly defaultZoom = 11;
  protected usingFallback = false;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.refreshMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady || (!changes['hotspots'] && !changes['center'] && !changes['radiusKm'])) {
      return;
    }

    void this.refreshMap();
  }

  protected getMarkerStyle(hotspot: MapHotspot): Record<string, string> {
    const x = 50 + (hotspot.lng - this.center.lng) * 650;
    const y = 50 - (hotspot.lat - this.center.lat) * 650;

    return {
      left: `${Math.max(10, Math.min(90, x))}%`,
      top: `${Math.max(10, Math.min(90, y))}%`
    };
  }

  private async refreshMap(): Promise<void> {
    if (!this.mapContainer || !this.center) {
      return;
    }

    try {
      await this.ensureGoogleMaps();
      this.renderMap();
      this.usingFallback = false;
    } catch {
      this.usingFallback = true;
    }
  }

  private async ensureGoogleMaps(): Promise<void> {
    if (window.google?.maps) {
      return;
    }

    if (!this.mapApiKey) {
      throw new Error('Google Maps API key missing');
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Google Maps API'));
      document.head.appendChild(script);
    });
  }

  private renderMap(): void {
    const googleMaps = window.google?.maps;
    const mapHost = this.mapContainer?.nativeElement;
    if (!googleMaps || !mapHost) {
      this.usingFallback = true;
      return;
    }

    const map = new googleMaps.Map(mapHost, {
      center: this.center,
      zoom: this.defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    new googleMaps.Circle({
      center: this.center,
      radius: this.radiusKm * 1000,
      strokeColor: '#22d3ee',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#38bdf8',
      fillOpacity: 0.18,
      map
    });

    this.hotspots.forEach((hotspot) => {
      new googleMaps.Marker({
        position: { lat: hotspot.lat, lng: hotspot.lng },
        map,
        title: `${hotspot.name} · score ${hotspot.score}`
      });
    });
  }
}
