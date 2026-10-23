import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/auth/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { endOfDay, fmtDate, toDateInput } from '../../core/dates';
import { AdminRepository } from '../../data-access/admin.repository';
import { Place, PlaceStatus, PlanTier } from '../../shared/models/models';
import { PLAN_OPTIONS, effectivePlan, planLabel } from '../../shared/models/plan';

const STATUS_LABEL: Record<PlaceStatus, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  pending: 'En revisión',
  suspended: 'Suspendido',
};
const STATUSES = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as PlaceStatus, label }));
const CATEGORIES = [
  { slug: 'dormir', label: 'Dormir' },
  { slug: 'comer', label: 'Comer' },
  { slug: 'excursiones', label: 'Excursiones' },
  { slug: 'naturaleza', label: 'Ríos y diques' },
  { slug: 'servicios', label: 'Servicios' },
  { slug: 'comercios', label: 'Comercios' },
];

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  template: `
    <section class="container">
      <h1>Administración</h1>

      @if (!auth.ready() || !admin.ready()) {
        <p class="note">Cargando…</p>
      } @else if (!auth.user()) {
        <p class="note">Ingresá para continuar.</p>
        <a class="link" routerLink="/ingresar" [queryParams]="{ volver: '/admin' }">Ingresar</a>
      } @else if (!admin.isAdmin()) {
        <p class="note">Tu cuenta no tiene permisos de administración.</p>
      } @else {
        <div class="stats">
          <span><b>{{ stats().total }}</b> comercios</span>
          <span><b>{{ stats().published }}</b> publicados</span>
          <span><b>{{ stats().paid }}</b> con plan pago</span>
        </div>

        <button type="button" class="toggle" (click)="showNew.set(!showNew())">{{ showNew() ? 'Cerrar' : '+ Nuevo comercio' }}</button>
        @if (showNew()) {
          <div class="form">
            <input type="text" maxlength="80" placeholder="Nombre del comercio" [value]="nName()" (input)="nName.set($any($event.target).value)" />
            <div class="two">
              <label>Categoría
                <select [value]="nCat()" (change)="nCat.set($any($event.target).value)">
                  @for (c of categories; track c.slug) { <option [value]="c.slug">{{ c.label }}</option> }
                </select>
              </label>
              <label>Rubro (ej: Cabañas) <input type="text" maxlength="30" [value]="nLabel()" (input)="nLabel.set($any($event.target).value)" /></label>
            </div>
            <div class="two">
              <label>Localidad <input type="text" maxlength="40" [value]="nLocality()" (input)="nLocality.set($any($event.target).value)" /></label>
              <label>Ícono (un emoji) <input type="text" maxlength="4" [value]="nIcon()" (input)="nIcon.set($any($event.target).value)" /></label>
            </div>
            @if (newError()) { <p class="err" role="alert">{{ newError() }}</p> }
            <button type="button" class="save" (click)="create()" [disabled]="busy()">Crear en borrador</button>
          </div>
        }

        <input class="search" type="search" placeholder="Buscar comercio o localidad" [value]="q()" (input)="q.set($any($event.target).value)" />
        <div class="chips">
          @for (f of filters; track f.value) {
            <button type="button" [class.on]="filter() === f.value" (click)="filter.set(f.value)">{{ f.label }}</button>
          }
        </div>

        @if (status() === 'loading') {
          <p class="note">Cargando comercios…</p>
        } @else if (status() === 'error') {
          <p class="note">No pudimos cargar los comercios. Revisá las reglas de Firestore.</p>
        }

        @for (p of visible(); track p.id) {
          <article class="row">
            <button type="button" class="head" (click)="toggle(p)">
              <span class="ttl"><b>{{ p.name }}</b><small>{{ p.locality }} · {{ p.categoryLabel }}</small></span>
              <span class="badges">
                <span class="b" [class.off]="p.status !== 'published'">{{ statusLabel(p.status) }}</span>
                <span class="b plan">{{ planName(p) }}</span>
                @if (p.featured) { <span class="b star">★</span> }
              </span>
            </button>

            @if (openId() === p.id) {
              <div class="edit">
                <div class="two">
                  <label>Estado
                    <select [value]="fStatus()" (change)="fStatus.set($any($event.target).value)">
                      @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
                    </select>
                  </label>
                  <label>Plan
                    <select [value]="fPlan()" (change)="fPlan.set($any($event.target).value)">
                      @for (o of plans; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
                    </select>
                  </label>
                </div>
                <label>El plan vale hasta (vacío = sin vencimiento)
                  <input type="date" [value]="fUntil()" (input)="fUntil.set($any($event.target).value)" />
                </label>
                <label class="check">
                  <input type="checkbox" [checked]="fFeatured()" (change)="fFeatured.set($any($event.target).checked)" /> Destacado (aparece primero)
                </label>
                <label>Código del dueño (ownerId)
                  <input type="text" [value]="fOwner()" (input)="fOwner.set($any($event.target).value)" />
                </label>
                @if (err()) { <p class="err" role="alert">{{ err() }}</p> }
                @if (msg()) { <p class="ok" role="status">{{ msg() }}</p> }
                <div class="actions">
                  <button type="button" class="save" (click)="save(p)" [disabled]="busy()">{{ busy() ? 'Guardando…' : 'Guardar' }}</button>
                  <a class="link" [routerLink]="['/lugar', p.id]">Ver ficha</a>
                </div>
              </div>
            }
          </article>
        } @empty {
          @if (status() === 'ready') { <p class="note">No hay comercios con ese filtro.</p> }
        }
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; display: grid; gap: 12px; max-width: 640px; }
    h1 { font-size: 24px; }
    .note { margin: 0; color: var(--muted); }
    .stats { display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
    .stats b { color: var(--navy-900); font-size: 16px; }
    .toggle { justify-self: start; border: 1px solid var(--border); background: var(--surface); border-radius: 999px; padding: 9px 16px; font-weight: 600; font-size: 13px; }
    .form, .edit { display: grid; gap: 10px; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    .search, input:not([type=checkbox]), select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font: inherit; font-size: 14px; background: #fff; outline: 0; }
    label { display: grid; gap: 4px; font-size: 12px; font-weight: 600; }
    label.check { display: flex; align-items: center; gap: 8px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .chips { display: flex; gap: 8px; }
    .chips button { border: 1px solid var(--border); background: var(--surface); border-radius: 999px; padding: 7px 14px; font-size: 13px; }
    .chips button.on { background: var(--green-700); border-color: var(--green-700); color: #fff; }
    .row { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .head { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px; border: 0; background: none; text-align: left; font: inherit; }
    .ttl { display: grid; min-width: 0; }
    .ttl small { color: var(--muted); font-size: 12px; }
    .badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .b { background: #e8f1e4; color: var(--green-700); border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 700; }
    .b.off { background: #fdecea; color: #b3261e; }
    .b.plan { background: #eef2ee; color: var(--navy-900); }
    .b.star { background: #fff3e3; color: var(--orange-500); }
    .edit { border: 0; border-top: 1px solid var(--border); border-radius: 0; }
    .actions { display: flex; align-items: center; gap: 14px; }
    .save { border: 0; border-radius: 999px; padding: 10px 20px; background: var(--green-700); color: #fff; font-weight: 600; }
    button:disabled { opacity: 0.6; }
    .link { color: var(--green-700); font-weight: 600; font-size: 14px; }
    .err { margin: 0; color: #b3261e; font-size: 13px; }
    .ok { margin: 0; color: var(--green-700); font-weight: 600; font-size: 13px; }
  `,
})
export class Admin {
  readonly auth = inject(AuthService);
  readonly admin = inject(AdminService);
  private readonly repo = inject(AdminRepository);

  readonly statuses = STATUSES;
  readonly plans = PLAN_OPTIONS;
  readonly categories = CATEGORIES;
  readonly filters = [
    { value: 'all', label: 'Todos' },
    { value: 'published', label: 'Publicados' },
    { value: 'hidden', label: 'No publicados' },
  ];

  readonly places = signal<Place[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly q = signal('');
  readonly filter = signal('all');
  readonly openId = signal('');

  readonly fStatus = signal<PlaceStatus>('draft');
  readonly fPlan = signal<PlanTier>('free');
  readonly fUntil = signal('');
  readonly fFeatured = signal(false);
  readonly fOwner = signal('');
  readonly busy = signal(false);
  readonly msg = signal('');
  readonly err = signal('');

  readonly showNew = signal(false);
  readonly nName = signal('');
  readonly nCat = signal('dormir');
  readonly nLabel = signal('');
  readonly nLocality = signal('');
  readonly nIcon = signal('🏠');
  readonly newError = signal('');

  readonly stats = computed(() => {
    const list = this.places();
    return {
      total: list.length,
      published: list.filter((p) => p.status === 'published').length,
      paid: list.filter((p) => effectivePlan(p) !== 'free').length,
    };
  });

  readonly visible = computed(() => {
    const term = this.q().trim().toLowerCase();
    const f = this.filter();
    return this.places().filter(
      (p) =>
        (f === 'all' || (f === 'published') === (p.status === 'published')) &&
        (!term || `${p.name} ${p.locality}`.toLowerCase().includes(term)),
    );
  });

  constructor() {
    effect(() => {
      if (this.admin.isAdmin()) void this.load();
    });
  }

  statusLabel(s: PlaceStatus): string {
    return STATUS_LABEL[s] ?? s;
  }

  planName(p: Place): string {
    const eff = effectivePlan(p);
    const expired = p.plan && p.plan !== 'free' && eff === 'free';
    return expired ? 'Vencido' : planLabel(eff) + (p.planUntil ? ` · hasta ${fmtDate(p.planUntil)}` : '');
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      this.places.set(await this.repo.listPlaces());
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }

  toggle(p: Place): void {
    if (this.openId() === p.id) {
      this.openId.set('');
      return;
    }
    this.openId.set(p.id);
    this.fStatus.set(p.status);
    this.fPlan.set(p.plan ?? 'free');
    this.fUntil.set(p.planUntil ? toDateInput(p.planUntil) : '');
    this.fFeatured.set(p.featured);
    this.fOwner.set(p.ownerId ?? '');
    this.msg.set('');
    this.err.set('');
  }

  async save(p: Place): Promise<void> {
    this.msg.set('');
    this.err.set('');
    const planUntil = this.fUntil() ? endOfDay(this.fUntil()) : null;
    const owner = this.fOwner().trim();
    this.busy.set(true);
    try {
      await this.repo.savePlace(p.id, {
        status: this.fStatus(), plan: this.fPlan(), planUntil, featured: this.fFeatured(), ownerId: owner,
      });
      this.places.update((list) =>
        list.map((x) =>
          x.id === p.id
            ? { ...x, status: this.fStatus(), plan: this.fPlan(), planUntil: planUntil ?? undefined, featured: this.fFeatured(), ownerId: owner || undefined }
            : x,
        ),
      );
      this.msg.set('Guardado.');
    } catch {
      this.err.set('No pudimos guardar. Revisá las reglas de Firestore y tu conexión.');
    } finally {
      this.busy.set(false);
    }
  }

  async create(): Promise<void> {
    this.newError.set('');
    const name = this.nName().trim();
    const label = this.nLabel().trim();
    if (name.length < 2 || !label || !this.nLocality().trim()) {
      return this.newError.set('Completá nombre, rubro y localidad.');
    }
    this.busy.set(true);
    try {
      await this.repo.createPlace({
        name, category: this.nCat(), categoryLabel: label, locality: this.nLocality().trim(), icon: this.nIcon().trim() || '🏠',
      });
      this.nName.set('');
      this.nLabel.set('');
      this.nLocality.set('');
      this.showNew.set(false);
      await this.load();
    } catch {
      this.newError.set('No pudimos crear el comercio. Revisá las reglas de Firestore y tu conexión.');
    } finally {
      this.busy.set(false);
    }
  }
}
