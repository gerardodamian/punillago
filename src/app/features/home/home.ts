import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OffersRepository } from '../../data-access/offers.repository';
import { PlacesRepository } from '../../data-access/places.repository';
import { EventItem, Place, Promotion } from '../../shared/models/models';
import { CategoryTile } from '../../shared/ui/category-tile';
import { EventCard } from '../../shared/ui/event-card';
import { PlaceCard } from '../../shared/ui/place-card';
import { PromoCard } from '../../shared/ui/promo-card';
import { SearchBar } from '../../shared/ui/search-bar';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SearchBar, CategoryTile, PlaceCard, PromoCard, EventCard],
  template: `
    <section class="brand">
      <img src="logo.webp" width="220" height="220" alt="PunillaGO: descubrí, explorá, viví Punilla" />
    </section>

    <section class="hero">
      <div class="container">
        <p class="eyebrow">Todo Punilla en un solo lugar</p>
        <h1>Descubrí · Explorá · Viví Punilla</h1>
        <app-search-bar (search)="onSearch($event)" />
      </div>
    </section>

    <section class="container block">
      <h2>¿Qué querés hacer?</h2>
      <div class="grid">
        @for (cat of categories; track cat.id) {
          <app-category-tile [category]="cat" />
        }
      </div>
    </section>

    <section class="container block">
      <h2>Destacados</h2>
      @if (status() === 'error') {
        <p class="note">No pudimos cargar los comercios. Revisá tu conexión e intentá de nuevo.</p>
      } @else if (status() === 'ready' && !featured().length) {
        <p class="note">Todavía no hay comercios destacados.</p>
      } @else {
        <div class="scroller">
          @for (place of featured(); track place.id) {
            <app-place-card [place]="place" />
          }
        </div>
      }
    </section>

    @if (promos().length) {
      <section class="container block">
        <div class="head"><h2>Promociones</h2><a routerLink="/promociones">Ver todas</a></div>
        <div class="scroller">
          @for (p of promos(); track p.id) {
            <app-promo-card [promo]="p" />
          }
        </div>
      </section>
    }

    @if (events().length) {
      <section class="container block">
        <div class="head"><h2>Próximos eventos</h2><a routerLink="/eventos">Ver todos</a></div>
        <div class="events">
          @for (e of events(); track e.id) {
            <app-event-card [event]="e" />
          }
        </div>
      </section>
    }
  `,
  styles: `
    .brand { display: flex; justify-content: center; padding: 8px 0 0; background: #fff; }
    .brand img { width: min(220px, 60vw); height: auto; }
    .hero { padding: 28px 0 40px; color: #fff;
      background: linear-gradient(160deg, var(--green-700) 0%, var(--teal-600) 100%); }
    .eyebrow { margin: 0 0 6px; font-size: 13px; opacity: 0.9; letter-spacing: 0.4px; }
    h1 { color: #fff; font-size: 28px; line-height: 1.2; margin-bottom: 20px; }
    .block { margin-top: 24px; }
    h2 { font-size: 18px; margin-bottom: 12px; }
    .head { display: flex; justify-content: space-between; align-items: baseline; }
    .head a { font-size: 13px; font-weight: 600; color: var(--green-700); }
    .note { color: var(--muted); margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .scroller { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory; }
    .events { display: grid; gap: 10px; }
    @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 768px) { h1 { font-size: 38px; } .hero { padding: 56px 0 64px; } }
  `,
})
export class Home {
  private readonly places = inject(PlacesRepository);
  private readonly offers = inject(OffersRepository);
  private readonly router = inject(Router);

  readonly categories = this.places.getCategories();
  readonly featured = signal<Place[]>([]);
  readonly promos = signal<Promotion[]>([]);
  readonly events = signal<EventItem[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.places
      .getFeatured()
      .then((list) => {
        this.featured.set(list);
        this.status.set('ready');
      })
      .catch(() => this.status.set('error'));

    // Promociones y eventos son un extra: si fallan, el inicio se ve igual.
    this.offers.getPromotions().then((l) => this.promos.set(l.slice(0, 6))).catch(() => undefined);
    this.offers.getEvents().then((l) => this.events.set(l.slice(0, 3))).catch(() => undefined);
  }

  onSearch(term: string): void {
    this.router.navigate(['/explorar'], { queryParams: term ? { q: term } : {} });
  }
}
