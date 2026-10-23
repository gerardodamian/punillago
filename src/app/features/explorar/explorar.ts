import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesRepository } from '../../data-access/places.repository';
import { Place } from '../../shared/models/models';
import { isFeatured } from '../../shared/models/plan';
import { PlaceCard } from '../../shared/ui/place-card';

/** Minúsculas y sin tildes, para que "cabana" encuentre "Cabañas". */
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

@Component({
  selector: 'app-explorar',
  imports: [PlaceCard],
  template: `
    <section class="container">
      <h1>Explorar</h1>

      <input
        class="search"
        type="search"
        placeholder="Buscar por nombre, rubro o localidad"
        aria-label="Buscar"
        [value]="q()"
        (input)="setQ($any($event.target).value)" />

      <div class="chips" role="group" aria-label="Categorías">
        <button type="button" [class.on]="!categoria()" (click)="setCategoria('')">Todas</button>
        @for (c of categories; track c.id) {
          <button type="button" [class.on]="categoria() === c.slug" (click)="setCategoria(c.slug)">
            {{ c.icon }} {{ c.name }}
          </button>
        }
      </div>

      <div class="chips" role="group" aria-label="Precio">
        @for (p of prices; track p.value) {
          <button type="button" [class.on]="precio() === p.value" (click)="setPrecio(p.value)">{{ p.label }}</button>
        }
      </div>

      @switch (status()) {
        @case ('loading') {
          <p class="note">Cargando…</p>
        }
        @case ('error') {
          <p class="note">No pudimos cargar los comercios. Revisá tu conexión e intentá de nuevo.</p>
        }
        @default {
          <p class="count">{{ results().length }} {{ results().length === 1 ? 'resultado' : 'resultados' }}</p>
          @if (results().length) {
            <div class="list">
              @for (place of results(); track place.id) {
                <app-place-card [place]="place" [fluid]="true" />
              }
            </div>
          } @else {
            <p class="note">No encontramos nada con esos filtros. Probá con otra búsqueda.</p>
          }
        }
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    .search { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 999px;
      font: inherit; font-size: 15px; background: var(--surface); outline: 0; }
    .search:focus { border-color: var(--green-500); }
    .chips { display: flex; gap: 8px; overflow-x: auto; padding: 12px 0 0; }
    .chips button { flex: none; border: 1px solid var(--border); background: var(--surface); color: var(--text);
      border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 500; }
    .chips button.on { background: var(--green-700); border-color: var(--green-700); color: #fff; }
    .count { margin: 16px 0 10px; color: var(--muted); font-size: 13px; }
    .note { color: var(--muted); margin-top: 20px; }
    .list { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
  `,
})
export class Explorar {
  private readonly repo = inject(PlacesRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly categories = this.repo.getCategories();
  readonly prices = [
    { value: 0, label: 'Cualquier precio' },
    { value: 1, label: '$' },
    { value: 2, label: '$$' },
    { value: 3, label: '$$$' },
  ];

  readonly q = signal('');
  readonly categoria = signal('');
  readonly precio = signal(0);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly places = signal<Place[]>([]);

  readonly results = computed(() => {
    const term = norm(this.q());
    const cat = this.categoria();
    const price = this.precio();
    return this.places()
      .filter(
        (p) =>
          (!cat || p.category === cat) &&
          (!price || p.priceLevel <= price) &&
          (!term || norm(`${p.name} ${p.categoryLabel} ${p.locality} ${p.description}`).includes(term)),
      )
      .sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)) || b.rating - a.rating);
  });

  constructor() {
    // Los filtros viven en la URL (/explorar?q=...&categoria=...), así se pueden compartir.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      this.q.set(p.get('q') ?? '');
      this.categoria.set(p.get('categoria') ?? '');
      this.precio.set(Number(p.get('precio')) || 0);
    });

    this.repo
      .getAll()
      .then((list) => {
        this.places.set(list);
        this.status.set('ready');
      })
      .catch(() => this.status.set('error'));
  }

  setQ(v: string): void {
    this.q.set(v);
    this.syncUrl();
  }

  setCategoria(v: string): void {
    this.categoria.set(v);
    this.syncUrl();
  }

  setPrecio(v: number): void {
    this.precio.set(v);
    this.syncUrl();
  }

  private syncUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: { q: this.q() || null, categoria: this.categoria() || null, precio: this.precio() || null },
    });
  }
}
