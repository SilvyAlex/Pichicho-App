import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Profile } from '../models/profile.model';

const KEY = 'profile';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _profile$ = new BehaviorSubject<Profile | null>(null);
  profile$ = this._profile$.asObservable();

  /** Carga el perfil desde almacenamiento local al iniciar la app */
  async load(): Promise<void> {
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      try { this._profile$.next(JSON.parse(value) as Profile); } catch {}
    }
  }

  /** Setea y persiste el perfil */
  async setProfile(p: Profile): Promise<void> {
    this._profile$.next(p);
    await Preferences.set({ key: KEY, value: JSON.stringify(p) });
  }

  /** Limpia sesión (logout) */
  async clear(): Promise<void> {
    this._profile$.next(null);
    await Preferences.remove({ key: KEY });
  }

  /** Snapshot sincrónico (útil en guards) */
  get snapshot(): Profile | null {
    return this._profile$.value;
  }
}
