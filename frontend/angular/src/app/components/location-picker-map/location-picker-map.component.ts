import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PickedLocation {
  lat: number;
  lng: number;
  radius: number;
  address: string;
  genres: string[];
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

@Component({
  selector: 'app-location-picker-map',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule, DecimalPipe],
  templateUrl: './location-picker-map.component.html',
  styleUrl: './location-picker-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationPickerMapComponent implements AfterViewInit, OnDestroy {
  @Input() mapApiKey = '';
  @Input() initialCenter: { lat: number; lng: number } = { lat: 23.6345, lng: -102.5528 };
  @Input() initialRadius = 18;

  @Output() locationConfirmed = new EventEmitter<PickedLocation>();

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput', { static: false }) searchInput?: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  protected pickedCenter: { lat: number; lng: number } | null = null;
  protected radius = 18;
  protected address = '';
  protected searching = false;
  protected searchError = '';
  protected usingFallback = false;
  protected fallbackBounds = { minLat: 14.5, maxLat: 32.7, minLng: -117.1, maxLng: -86.7 };

  protected readonly availableGenres = ['Regional Mexicano', 'Cumbia', 'Pop Latino', 'Banda', 'Urbano'];
  protected selectedGenres: string[] = [];

  protected toggleGenre(genre: string): void {
    const idx = this.selectedGenres.indexOf(genre);
    if (idx >= 0) {
      this.selectedGenres.splice(idx, 1);
    } else {
      this.selectedGenres.push(genre);
    }
    this.cdr.markForCheck();
  }

  protected isGenreSelected(genre: string): boolean {
    return this.selectedGenres.includes(genre);
  }

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private circle: google.maps.Circle | null = null;
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private viewReady = false;
  protected hasAutocomplete = false;

  ngAfterViewInit(): void {
    this.radius = this.initialRadius;
    this.viewReady = true;
    void this.initMap();
  }

  ngOnDestroy(): void {
    if (this.autocomplete) {
      window.google?.maps?.event?.clearInstanceListeners(this.autocomplete);
      this.autocomplete = null;
    }
    this.map = null;
    this.marker = null;
    this.circle = null;
  }

  protected async searchPlace(): Promise<void> {
    const query = this.searchInput?.nativeElement.value.trim();
    if (!query) return;

    this.searching = true;
    this.searchError = '';
    this.cdr.markForCheck();

    try {
      // Usa Google Geocoder si el SDK ya está cargado
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const result = await geocoder.geocode({ address: query, region: 'MX' });

        if (!result.results.length) {
          this.searchError = 'No se encontró el lugar. Intenta con otro nombre.';
        } else {
          const r = result.results[0];
          const loc = r.geometry.location;
          this.pickedCenter = { lat: loc.lat(), lng: loc.lng() };
          this.address = r.formatted_address.split(',').slice(0, 2).join(', ');
          this.updateMapCenter();
        }
        return;
      }

      // Fallback: Nominatim (OpenStreetMap, sin API key)
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=mx&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const results: Array<{ lat: string; lon: string; display_name: string }> = await res.json();

      if (!results.length) {
        this.searchError = 'No se encontró el lugar. Intenta con otro nombre.';
      } else {
        const r = results[0];
        this.pickedCenter = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
        this.address = r.display_name.split(',').slice(0, 2).join(', ');
        this.updateMapCenter();
      }
    } catch {
      this.searchError = 'Error al buscar. Revisa tu conexión.';
    } finally {
      this.searching = false;
      this.cdr.markForCheck();
    }
  }

  protected onFallbackClick(event: MouseEvent): void {
    if (!this.usingFallback) return;
    const el = this.mapContainer?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width;
    const yPct = (event.clientY - rect.top) / rect.height;

    const { minLat, maxLat, minLng, maxLng } = this.fallbackBounds;
    const lat = maxLat - yPct * (maxLat - minLat);
    const lng = minLng + xPct * (maxLng - minLng);

    this.pickedCenter = { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) };
    this.address = '';
    this.cdr.markForCheck();
  }

  protected getFallbackMarkerStyle(): Record<string, string> {
    if (!this.pickedCenter) return { display: 'none' };
    const { minLat, maxLat, minLng, maxLng } = this.fallbackBounds;
    const xPct = ((this.pickedCenter.lng - minLng) / (maxLng - minLng)) * 100;
    const yPct = ((maxLat - this.pickedCenter.lat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.max(2, Math.min(98, xPct))}%`,
      top: `${Math.max(2, Math.min(98, yPct))}%`
    };
  }

  protected confirm(): void {
    if (!this.pickedCenter) return;
    this.locationConfirmed.emit({
      lat: this.pickedCenter.lat,
      lng: this.pickedCenter.lng,
      radius: this.radius,
      address: this.address,
      genres: [...this.selectedGenres]
    });
  }

  private async initMap(): Promise<void> {
    if (!this.mapContainer || !this.viewReady) return;

    try {
      await this.ensureGoogleMaps();
      this.renderGoogleMap();
      this.usingFallback = false;
    } catch {
      this.usingFallback = true;
    }
    this.cdr.markForCheck();
  }

  private async ensureGoogleMaps(): Promise<void> {
    if (window.google?.maps) return;
    if (!this.mapApiKey) throw new Error('No API key');

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapApiKey}&libraries=geocoding,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps load failed'));
      document.head.appendChild(script);
    });
  }

  private renderGoogleMap(): void {
    const gm = window.google?.maps;
    const host = this.mapContainer?.nativeElement;
    if (!gm || !host) { this.usingFallback = true; return; }

    this.map = new gm.Map(host, {
      center: this.initialCenter,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [{ elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
               { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
               { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
               { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
               { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] }]
    });

    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      this.pickedCenter = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.address = '';
      this.updateMapCenter();
      this.cdr.markForCheck();
    });

    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    const inputEl = this.searchInput?.nativeElement;
    if (!inputEl || !window.google?.maps?.places?.Autocomplete) return;

    this.autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
      componentRestrictions: { country: 'mx' },
      fields: ['geometry', 'formatted_address', 'name']
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      if (!place.geometry?.location) return;

      const loc = place.geometry.location;
      this.pickedCenter = { lat: loc.lat(), lng: loc.lng() };
      this.address = place.formatted_address?.split(',').slice(0, 2).join(', ') ?? place.name ?? '';
      this.searchError = '';
      this.updateMapCenter();
      this.cdr.markForCheck();
    });

    this.hasAutocomplete = true;
    this.cdr.markForCheck();
  }

  private updateMapCenter(): void {
    if (!this.pickedCenter) return;

    if (this.map && window.google?.maps) {
      const gm = window.google.maps;
      const pos = { lat: this.pickedCenter.lat, lng: this.pickedCenter.lng };

      this.marker?.setMap(null);
      this.marker = new gm.Marker({ position: pos, map: this.map, title: 'Zona seleccionada' });

      this.circle?.setMap(null);
      this.circle = new gm.Circle({
        center: pos,
        radius: this.radius * 1000,
        strokeColor: '#22d3ee',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        map: this.map
      });

      this.map.panTo(pos);
      this.map.setZoom(10);
    }
  }

  protected onRadiusChange(): void {
    if (this.circle && window.google?.maps) {
      this.circle.setRadius(this.radius * 1000);
    }
  }
}
