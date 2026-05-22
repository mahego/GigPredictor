import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private _mapsApiKey = '';

  get mapsApiKey(): string {
    return this._mapsApiKey;
  }

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<{ mapsApiKey: string }>('/api/config')
      );
      this._mapsApiKey = config.mapsApiKey ?? '';
    } catch {
      this._mapsApiKey = '';
    }
  }
}
