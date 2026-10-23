import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FavoritesService } from '../../data-access/favorites.service';
import { PlacesRepository } from '../../data-access/places.repository';
import { Place } from '../../shared/models/models';
import { PlaceCard } from '../../shared/ui/place-card';

@Component({
  selector: 'app-favoritos',
  imports: [RouterLink, PlaceCard],
  template: `
    <section class="container">
      <h1>Favoritos</h1>

      @if (!auth.ready() || fav.loading() || status() === 'loading') {
        <p class="note">Cargando…</p>
      } @else if (!auth.user()) {
        <p class="note">Ingresá para guardar y ver tus lugares favoritos.</p>
        <a class="btn" routerLink="/ingresar" [queryParams]="{ volver: '/favoritos' }">Ingresar</a>
      } @else if (status() === 'error') {
        <p class="note">No pudimos cargar los comercios. Revisá tu conexión.</p>
      } @else if (list().length) {
        <div class="list">
          @for (place of list(); track place.id) {
            <app-place-card [place]="place" [fluid]="true" />
          }
        </div>
      } @else {
        <p class="note">Todavía no guardaste ningún lugar. Tocá "Guardar" en la ficha de un comercio.</p>
        <a class="btn" routerLink="/explorar">Explorar</a>
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; display: grid; gap: 12px; justify-items: start; }
    h1 { font-size: 24px; }
    .note { margin: 0; color: var(--muted); }
    .btn { border-radius: 999px; padding: 12px 20px; background: var(--green-700); color: #fff; font-weight: 600; font-size: 14px; }
    .list { width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
  `,
})
export class Favoritos {
  readonly auth = inject(AuthService);
  readonly fav = inject(FavoritesService);
  private readonly repo = inject(PlacesRepository);

  private readonly places = signal<Place[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly list = computed(() => this.places().filter((p) => this.fav.ids().has(p.id)));

  constructor() {
    this.repo
      .getAll()
      .then((all) => {
        this.places.set(all);
        this.status.set('ready');
      })
      .catch(() => this.status.set('error'));
  }
}
