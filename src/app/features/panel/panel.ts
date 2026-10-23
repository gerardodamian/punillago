import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PlacesRepository } from '../../data-access/places.repository';
import { Place, PlanTier } from '../../shared/models/models';
import { effectivePlan } from '../../shared/models/plan';
import { OffersManager } from './offers-manager';

const PLAN_LABEL: Record<PlanTier, string> = { free: 'Gratis', basic: 'Básico', premium: 'Premium', featured: 'Destacado' };
const STATUS_LABEL: Record<string, string> = {
  published: 'Publicado',
  draft: 'Borrador (no visible)',
  pending: 'En revisión (no visible)',
  suspended: 'Suspendido (no visible)',
};

/** Convierte "-31,10" o "-31.10" en número; vacío = null; inválido = NaN. */
function parseCoord(text: string): number | null {
  const t = text.trim().replace(',', '.');
  return t === '' ? null : Number(t);
}

@Component({
  selector: 'app-panel',
  imports: [RouterLink, OffersManager],
  template: `
    <section class="container">
      <h1>Mi comercio</h1>

      @if (!auth.ready() || status() === 'loading') {
        <p class="note">Cargando…</p>
      } @else if (!auth.user()) {
        <p class="note">Ingresá para administrar tu comercio.</p>
        <a class="btn" routerLink="/ingresar" [queryParams]="{ volver: '/panel' }">Ingresar</a>
      } @else if (status() === 'error') {
        <p class="note">No pudimos cargar tu comercio. Revisá tu conexión.</p>
      } @else if (!places().length) {
        <p class="note">Tu cuenta todavía no está vinculada a ningún comercio. Pasale tu código de usuario a PunillaGO para que lo vincule:</p>
        <code>{{ auth.user()?.uid }}</code>
      } @else {
        @if (places().length > 1) {
          <div class="chips">
            @for (p of places(); track p.id) {
              <button type="button" [class.on]="p.id === selectedId()" (click)="select(p)">{{ p.name }}</button>
            }
          </div>
        }

        @if (current(); as p) {
          <div class="card info">
            <div><b>{{ p.name }}</b></div>
            <div class="badges">
              <span class="badge">{{ statusLabel(p) }}</span>
              <span class="badge plan">Plan {{ planLabel(p) }}</span>
            </div>
            <a routerLink="/lugar/{{ p.id }}" class="link">Ver mi ficha pública</a>
            <small>El plan y la publicación los gestiona PunillaGO. Para cambiar de plan, contactanos.</small>
          </div>

          <form (submit)="save($event)">
            <label>Nombre
              <input type="text" maxlength="80" [value]="name()" (input)="name.set($any($event.target).value)" />
            </label>
            <label>Descripción
              <textarea rows="5" maxlength="1500" [value]="description()" (input)="description.set($any($event.target).value)"></textarea>
            </label>
            <label>Servicios <small>separados por coma (ej: Wi-Fi, Pileta, Desayuno)</small>
              <input type="text" [value]="services()" (input)="services.set($any($event.target).value)" />
            </label>
            <label>Horarios
              <input type="text" maxlength="200" placeholder="Todos los días de 9 a 21 hs" [value]="hours()" (input)="hours.set($any($event.target).value)" />
            </label>
            <label>Teléfono
              <input type="tel" maxlength="30" placeholder="+54 3548 123456" [value]="phone()" (input)="phone.set($any($event.target).value)" />
            </label>
            <label>WhatsApp <small>solo números, con código de país y sin el 9 (ej: 543548123456)</small>
              <input type="text" inputmode="numeric" maxlength="15" [value]="whatsapp()" (input)="whatsapp.set($any($event.target).value)" />
            </label>
            <label>Dirección
              <input type="text" maxlength="120" [value]="address()" (input)="address.set($any($event.target).value)" />
            </label>

            <div class="coords">
              <label>Latitud
                <input type="text" inputmode="decimal" placeholder="-31.1017" [value]="lat()" (input)="lat.set($any($event.target).value)" />
              </label>
              <label>Longitud
                <input type="text" inputmode="decimal" placeholder="-64.4944" [value]="lng()" (input)="lng.set($any($event.target).value)" />
              </label>
            </div>
            <button type="button" class="btn" (click)="useMyLocation()">📍 Usar mi ubicación actual</button>
            <small>Si estás en tu local, este botón completa la ubicación para el mapa y "Cómo llegar".</small>

            @if (error()) {
              <p class="err" role="alert">{{ error() }}</p>
            }
            @if (ok()) {
              <p class="ok" role="status">Cambios guardados.</p>
            }
            <button type="submit" class="save" [disabled]="busy()">{{ busy() ? 'Guardando…' : 'Guardar cambios' }}</button>
          </form>

          <app-offers-manager [place]="p" />
        }
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; display: grid; gap: 12px; max-width: 560px; }
    h1 { font-size: 24px; }
    .note { margin: 0; color: var(--muted); }
    code { word-break: break-all; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; font-size: 13px; }
    .chips { display: flex; gap: 8px; overflow-x: auto; }
    .chips button { flex: none; border: 1px solid var(--border); background: var(--surface); border-radius: 999px; padding: 8px 14px; font-size: 13px; }
    .chips button.on { background: var(--green-700); border-color: var(--green-700); color: #fff; }
    .card { display: grid; gap: 8px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { background: #eef2ee; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
    .badge.plan { background: #e8f1e4; color: var(--green-700); }
    .link { color: var(--green-700); font-weight: 600; font-size: 14px; }
    small { color: var(--muted); font-size: 12px; font-weight: 400; }
    form { display: grid; gap: 12px; }
    label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; }
    input, textarea { padding: 11px 14px; border: 1px solid var(--border); border-radius: 12px; font: inherit; font-size: 15px;
      background: var(--surface); outline: 0; width: 100%; }
    input:focus, textarea:focus { border-color: var(--green-500); }
    .coords { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn { justify-self: start; border: 1px solid var(--border); background: var(--surface); border-radius: 999px; padding: 10px 16px;
      font-weight: 600; font-size: 13px; color: var(--text); }
    .save { border: 0; border-radius: 999px; padding: 13px; background: var(--green-700); color: #fff; font-weight: 600; font-size: 15px; }
    .save:disabled { opacity: 0.6; }
    .err { margin: 0; color: #b3261e; font-size: 13px; }
    .ok { margin: 0; color: var(--green-700); font-weight: 600; }
  `,
})
export class Panel {
  readonly auth = inject(AuthService);
  private readonly repo = inject(PlacesRepository);

  readonly places = signal<Place[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly selectedId = signal('');
  readonly current = computed(() => this.places().find((p) => p.id === this.selectedId()) ?? null);

  readonly name = signal('');
  readonly description = signal('');
  readonly services = signal('');
  readonly hours = signal('');
  readonly phone = signal('');
  readonly whatsapp = signal('');
  readonly address = signal('');
  readonly lat = signal('');
  readonly lng = signal('');

  readonly busy = signal(false);
  readonly error = signal('');
  readonly ok = signal(false);

  private readonly uid = computed(() => this.auth.user()?.uid ?? null);

  constructor() {
    effect(() => {
      const uid = this.uid();
      if (uid) void this.load(uid);
      else if (this.auth.ready()) this.status.set('ready');
    });
  }

  planLabel(p: Place): string {
    return PLAN_LABEL[effectivePlan(p)];
  }

  statusLabel(p: Place): string {
    return STATUS_LABEL[p.status] ?? p.status;
  }

  private async load(uid: string): Promise<void> {
    this.status.set('loading');
    try {
      const list = await this.repo.getByOwner(uid);
      this.places.set(list);
      if (list.length) this.select(list[0]);
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  select(p: Place): void {
    this.selectedId.set(p.id);
    this.name.set(p.name);
    this.description.set(p.description ?? '');
    this.services.set((p.services ?? []).join(', '));
    this.hours.set(p.hours ?? '');
    this.phone.set(p.phone ?? '');
    this.whatsapp.set(p.whatsapp ?? '');
    this.address.set(p.address ?? '');
    this.lat.set(p.lat !== undefined ? String(p.lat) : '');
    this.lng.set(p.lng !== undefined ? String(p.lng) : '');
    this.error.set('');
    this.ok.set(false);
  }

  useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.error.set('Tu navegador no permite obtener la ubicación.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lat.set(pos.coords.latitude.toFixed(6));
        this.lng.set(pos.coords.longitude.toFixed(6));
        this.error.set('');
      },
      () => this.error.set('No pudimos obtener tu ubicación. Revisá que el navegador tenga permiso para usarla.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    const p = this.current();
    if (!p) return;
    this.error.set('');
    this.ok.set(false);

    const name = this.name().trim();
    if (name.length < 2) return this.error.set('Escribí el nombre del comercio.');

    const whatsapp = this.whatsapp().trim();
    if (!/^\d{0,15}$/.test(whatsapp)) return this.error.set('El WhatsApp debe tener solo números, sin espacios, + ni guiones.');

    const lat = parseCoord(this.lat());
    const lng = parseCoord(this.lng());
    if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === null) !== (lng === null)) {
      return this.error.set('Completá latitud y longitud con números (o dejá las dos vacías).');
    }
    if ((lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) {
      return this.error.set('La latitud o la longitud están fuera de rango.');
    }

    const services = this.services().split(',').map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 15);
    const changes: Partial<Place> = {
      name,
      description: this.description().trim(),
      services,
      hours: this.hours().trim(),
      phone: this.phone().trim(),
      whatsapp,
      address: this.address().trim(),
    };
    const remove: string[] = [];
    if (lat !== null && lng !== null) {
      changes.lat = lat;
      changes.lng = lng;
    } else {
      remove.push('lat', 'lng');
    }

    this.busy.set(true);
    try {
      await this.repo.updatePlace(p.id, changes, remove);
      const updated: Place = { ...p, ...changes };
      if (remove.length) {
        delete updated.lat;
        delete updated.lng;
      }
      this.places.update((list) => list.map((x) => (x.id === p.id ? updated : x)));
      this.ok.set(true);
    } catch {
      this.error.set('No pudimos guardar los cambios. Revisá tu conexión e intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }
}
