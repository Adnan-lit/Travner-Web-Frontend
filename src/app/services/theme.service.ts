import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private _theme$ = new BehaviorSubject<ThemeMode>('light');
    theme$ = this._theme$.asObservable();

    constructor() {
        const stored = (localStorage.getItem('theme') as ThemeMode) || 'light';
        this.applyTheme(stored);
    }

    toggleTheme(): void {
        const next: ThemeMode = this._theme$.value === 'light' ? 'dark' : 'light';
        this.applyTheme(next);
    }

    setTheme(mode: ThemeMode): void {
        this.applyTheme(mode);
    }

    private applyTheme(mode: ThemeMode): void {
        this._theme$.next(mode);
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('theme', mode);
    }
}
