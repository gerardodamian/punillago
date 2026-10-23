import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { LatLng, distanceKm, formatKm } from '../../core/geo';
import { PlacesRepository } from '../../data-access/places.repository';
import { Place } from '../../shared/models/models';

const CENTER: L.LatLngTuple = [-31.15, -64.49]; // Valle de Punilla

type WithCoords = Place & { lat: number; lng: number };

@Component({
  selector: 'app-mapa',
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div #mapEl class="map" aria-label="Mapa de comercios"></div>

      <div class="chips" role="group" aria-label="Categorías">
        <button type="button" [class.on]="!categoria()" (click)="categoria.set('')">Todos</button>
        @for (c of categories(); track c.id) {
          <button type="button" [class.on]="categoria() === c.slug" (click)="categoria.set(c.slug)">
            {{ c.icon }} {{ c.name }}
          </button>
        }
      </div>

      <button class="locate" type="button" (click)="locate()" [disabled]="locating()">
        📍 {{ locating() ? 'Buscando…' : 'Cerca de mí' }}
      </button>

      @if (msg()) {
        <p class="msg" role="status">{{ msg() }}</p>
      }

      @if (nearby().length) {
        <section class="nearby" aria-label="Lugares cercanos">
          <h2>Cerca tuyo</h2>
          @for (n of nearby(); track n.place.id) {
            <a [routerLink]="['/lugar', n.place.id]">
              <span class="ico" aria-hidden="true">{{ n.place.icon }}</span>
              <span class="txt"><b>{{ n.place.name }}</b><small>{{ n.place.categoryLabel }} · {{ n.place.locality }}</small></span>
              <span class="km">{{ n.km }}</span>
            </a>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .wrap { position: relative;
      height: calc(100dvh - var(--header-h) - var(--nav-h) - env(safe-area-inset-bottom, 0px) - 16px); }
    .map { position: absolute; inset: 0; }
    .chips { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000; display: flex; gap: 8px; overflow-x: auto; }
    .chips button { flex: none; border: 0; background: var(--surface); color: var(--text); border-radius: 999px;
      padding: 8px 14px; font-size: 13px; font-weight: 500; box-shadow: var(--shadow); }
    .chips button.on { background: var(--green-700); color: #fff; }
    .locate { position: absolute; top: 58px; right: 10px; z-index: 1000; border: 0; border-radius: 999px; padding: 10px 16px;
      background: var(--surface); color: var(--navy-900); font-weight: 600; font-size: 13px; box-shadow: var(--shadow); }
    .locate:disabled { opacity: 0.7; }
    .msg { position: absolute; top: 106px; left: 10px; right: 10px; z-index: 1000; margin: 0; padding: 10px 14px;
      background: var(--surface); border-radius: 12px; font-size: 13px; box-shadow: var(--shadow); }
    .nearby { position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 1000; max-height: 42%; overflow-y: auto;
      background: var(--surface); border-radius: var(--radius); padding: 10px 12px; box-shadow: var(--shadow); }
    h2 { font-size: 15px; margin-bottom: 6px; }
    .nearby a { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--border); }
    .ico { font-size: 22px; }
    .txt { flex: 1; display: grid; min-width: 0; }
    .txt b { font-size: 14px; }
    .txt small { color: var(--muted); font-size: 12px; }
    .km { font-size: 13px; font-weight: 600; color: var(--green-700); }
  `,
})
export class Mapa {
  private readonly repo = inject(PlacesRepository);
  private readonly router = inject(Router);
  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');

  private map?: L.Map;
  private readonly markers = L.layerGroup();
  private userMarker?: L.CircleMarker;

  private readonly places = signal<WithCoords[]>([]);
  readonly categoria = signal('');
  readonly msg = signal('');
  readonly locating = signal(false);
  private readonly userPos = signal<LatLng | null>(null);

  /** Solo muestra las categorías que tienen comercios cargados. */
  readonly categories = computed(() => {
    const used = new Set(this.places().map((p) => p.category));
    return this.repo.getCategories().filter((c) => used.has(c.slug));
  });

  private readonly visible = computed(() => {
    const cat = this.categoria();
    return this.places().filter((p) => !cat || p.category === cat);
  });

  readonly nearby = computed(() => {
    const pos = this.userPos();
    if (!pos) return [];
    return this.visible()
      .map((place) => ({ place, d: distanceKm(pos, place) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(({ place, d }) => ({ place, km: formatKm(d) }));
  });

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const list = this.visible();
      if (this.map) this.renderMarkers(list, true);
    });

    inject(DestroyRef).onDestroy(() => this.map?.remove());

    this.repo
      .getAll()
      .then((all) => this.places.set(all.filter((p): p is WithCoords => p.lat !== undefined && p.lng !== undefined)))
      .catch(() => this.msg.set('No pudimos cargar los comercios. Revisá tu conexión.'));
  }

  private initMap(): void {
    this.map = L.map(this.mapEl().nativeElement, { zoomControl: false }).setView(CENTER, 10);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.markers.addTo(this.map);
    this.renderMarkers(this.visible(), true);
  }

  private renderMarkers(list: WithCoords[], fit: boolean): void {
    this.markers.clearLayers();
    for (const p of list) {
      const pin = document.createElement('span');
      pin.className = 'pin';
      pin.textContent = p.icon;

      const icon = L.divIcon({ className: 'pin-wrap', html: pin, iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -18] });
      L.marker([p.lat, p.lng], { icon, title: p.name }).bindPopup(this.popup(p)).addTo(this.markers);
    }
    if (fit && list.length && this.map && !this.userPos()) {
      this.map.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lng] as L.LatLngTuple)).pad(0.2), { maxZoom: 15 });
    }
  }

  /** El contenido se arma con textContent (no con HTML) para evitar inyección de código. */
  private popup(p: Place): HTMLElement {
    const box = document.createElement('div');
    box.className = 'pop';
    const title = document.createElement('strong');
    title.textContent = p.name;
    const info = document.createElement('span');
    info.textContent = `${p.categoryLabel} · ★ ${p.rating}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Ver ficha';
    btn.addEventListener('click', () => this.router.navigate(['/lugar', p.id]));
    box.append(title, info, btn);
    return box;
  }

  locate(): void {
    if (!('geolocation' in navigator)) {
      this.msg.set('Tu navegador no permite obtener la ubicación.');
      return;
    }
    this.locating.set(true);
    this.msg.set('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.userPos.set(here);
        this.locating.set(false);
        this.userMarker?.remove();
        if (this.map) {
          this.userMarker = L.circleMarker([here.lat, here.lng], {
            radius: 8, color: '#fff', weight: 3, fillColor: '#1f7f8e', fillOpacity: 1,
          }).addTo(this.map);
          this.map.setView([here.lat, here.lng], 13);
        }
      },
      () => {
        this.locating.set(false);
        this.msg.set('No pudimos obtener tu ubicación. Revisá que el navegador tenga permiso para usarla.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
}
