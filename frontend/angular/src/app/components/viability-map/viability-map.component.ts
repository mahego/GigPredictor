import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ViabilityResponse } from '../../models/viability.model';
import { TEST_VIABILITY_RESPONSE } from '../../data/test-viability-response';

declare global {
  interface Window {
    google?: typeof google;
  }
}

@Component({
  selector: 'app-viability-map',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './viability-map.component.html',
  styleUrl: './viability-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViabilityMapComponent implements AfterViewInit {
  @Input() analysis: ViabilityResponse = TEST_VIABILITY_RESPONSE;
  @Input() mapApiKey = '';
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  protected readonly defaultZoom = 11;
  protected usingFallback = false;

  async ngAfterViewInit(): Promise<void> {
    if (!this.mapContainer) {
      return;
    }

    try {
      await this.ensureGoogleMaps();
      this.renderMap();
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
      center: this.analysis.analysis_area.center,
      zoom: this.defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    new googleMaps.Circle({
      center: this.analysis.analysis_area.center,
      radius: this.analysis.analysis_area.radius_km * 1000,
      strokeColor: '#0f766e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#14b8a6',
      fillOpacity: 0.18,
      map
    });

    this.analysis.puntos_calientes.forEach((hotspot) => {
      new googleMaps.Marker({
        position: { lat: hotspot.lat, lng: hotspot.lng },
        map,
        title: `${hotspot.name} · score ${hotspot.score}`
      });
    });
  }
}
