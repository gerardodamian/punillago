import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Navegación principal">
      @for (item of items; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.path === '/' }">
          <span class="ico" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; justify-content: space-around;
      height: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px);
      background: var(--surface); border-top: 1px solid var(--border); }
    a { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      font-size: 11px; font-weight: 500; color: var(--muted); }
    .ico { font-size: 20px; filter: grayscale(1); opacity: 0.7; }
    a.active { color: var(--green-700); font-weight: 600; }
    a.active .ico { filter: none; opacity: 1; }
  `,
})
export class BottomNav {
  readonly items = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/explorar', label: 'Explorar', icon: '🧭' },
    { path: '/mapa', label: 'Mapa', icon: '📍' },
    { path: '/eventos', label: 'Eventos', icon: '📅' },
    { path: '/favoritos', label: 'Favoritos', icon: '❤️' },
  ];
}
