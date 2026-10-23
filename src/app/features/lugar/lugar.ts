import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FavoritesService } from '../../data-access/favorites.service';
import { PlacesRepository } from '../../data-access/places.repository';
import { Place } from '../../shared/models/models';
import { PlaceOffers } from './place-offers';
import { Reviews } from './reviews';

@Component({
  selector: 'app-lugar',
  imports: [RouterLink, Reviews, PlaceOffers],
  template: `
    @if (place(); as p) {
      <div class="cover" aria-hidden="true">{{ p.icon }}</div>
      <article class="container body">
        <a class="back" routerLink="/explorar">← Volver a explorar</a>
        <span class="cat">{{ p.categoryLabel }} · {{ p.locality }}</span>
        <h1>{{ p.name }}</h1>
        <p class="meta">
          <span class="rating">★ {{ p.rating }} <small>({{ p.reviews }} opiniones)</small></span>
          <span class="price">{{ '$'.repeat(p.priceLevel) }}</span>
        </p>

        <div class="actions">
          @if (p.whatsapp) {
            <a class="btn wa" [href]="'https://wa.me/' + p.whatsapp" target="_blank" rel="noopener">WhatsApp</a>
          }
          @if (p.phone) {
            <a class="btn" [href]="'tel:' + p.phone">Llamar</a>
          }
          @if (p.lat !== undefined && p.lng !== undefined) {
            <a class="btn" [href]="mapsUrl(p)" target="_blank" rel="noopener">Cómo llegar</a>
          }
          <button class="btn" type="button" (click)="share(p)">Compartir</button>
          <button class="btn" type="button" (click)="toggleFav(p)" [attr.aria-pressed]="isFav(p)">
            {{ isFav(p) ? '❤️ Guardado' : '🤍 Guardar' }}
          </button>
        </div>
        @if (shareMsg()) {
          <p class="toast" role="status">{{ shareMsg() }}</p>
        }

        <h2>Sobre este lugar</h2>
        <p>{{ p.description }}</p>

        @if (p.services.length) {
          <h2>Servicios</h2>
          <ul class="tags">
            @for (s of p.services; track s) {
              <li>{{ s }}</li>
            }
          </ul>
        }
        @if (p.hours) {
          <h2>Horarios</h2>
          <p>{{ p.hours }}</p>
        }
        @if (p.address) {
          <h2>Dirección</h2>
          <p>{{ p.address }}, {{ p.locality }}</p>
        }

        <app-place-offers [placeId]="p.id" />

        <app-reviews [placeId]="p.id" />
      </article>
    } @else if (place() === null) {
      <section class="container state">
        <h1>No encontramos este lugar</h1>
        <p>Puede que ya no esté publicado.</p>
        <a routerLink="/explorar">Ir a explorar</a>
      </section>
    } @else {
      <p class="container state">Cargando…</p>
    }
  `,
  styles: `
    .cover { height: 180px; display: grid; place-items: center; font-size: 72px;
      background: linear-gradient(135deg, var(--green-500), var(--teal-600)); }
    .body { padding-top: 16px; display: grid; gap: 6px; }
    .back { font-size: 13px; color: var(--green-700); font-weight: 600; }
    .cat { font-size: 13px; color: var(--muted); }
    h1 { font-size: 26px; }
    h2 { font-size: 16px; margin-top: 16px; }
    p { margin: 0; line-height: 1.5; }
    .meta { display: flex; gap: 14px; font-size: 14px; }
    .rating { font-weight: 600; color: var(--orange-500); }
    .rating small { color: var(--muted); font-weight: 400; }
    .price { color: var(--green-700); font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 999px;
      padding: 10px 18px; font-size: 14px; font-weight: 600; }
    .btn.wa { background: #25d366; border-color: #25d366; color: #fff; }
    .toast { font-size: 13px; color: var(--green-700); }
    .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
    .tags li { background: #e8f1e4; color: var(--green-700); border-radius: 999px; padding: 6px 12px; font-size: 13px; }
    .state { padding-top: 40px; text-align: center; display: grid; gap: 10px; }
    .state a { color: var(--green-700); font-weight: 600; }
  `,
})
export class Lugar {
  private readonly repo = inject(PlacesRepository);
  private readonly auth = inject(AuthService);
  private readonly fav = inject(FavoritesService);
  private readonly router = inject(Router);
  /** undefined = cargando, null = no existe */
  readonly place = signal<Place | null | undefined>(undefined);
  readonly shareMsg = signal('');

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.repo.getById(id).then((p) => this.place.set(p));
  }

  isFav(p: Place): boolean {
    return this.fav.ids().has(p.id);
  }

  toggleFav(p: Place): void {
    if (!this.auth.user()) {
      this.router.navigate(['/ingresar'], { queryParams: { volver: this.router.url } });
      return;
    }
    void this.fav.toggle(p.id);
  }

  mapsUrl(p: Place): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  }

  async share(p: Place): Promise<void> {
    const data = { title: p.name, text: `${p.name} en PunillaGO`, url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(location.href);
        this.shareMsg.set('Enlace copiado');
        setTimeout(() => this.shareMsg.set(''), 2500);
      }
    } catch {
      // el usuario canceló el menú de compartir: no hacemos nada
    }
  }
}
