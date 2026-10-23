import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { endOfDay, fmtDate, fmtTime, startOfDay, toDateInput } from '../../core/dates';
import { OffersRepository } from '../../data-access/offers.repository';
import { EVENT_TYPES, EventItem, Place, PlanTier, Promotion } from '../../shared/models/models';
import { effectivePlan } from '../../shared/models/plan';

const PROMO_LIMIT: Record<PlanTier, number> = { free: 0, basic: 1, premium: 3, featured: 10 };
const EVENT_LIMIT: Record<PlanTier, number> = { free: 0, basic: 0, premium: 3, featured: 10 };

/** Alta y baja de promociones y eventos del comercio, según su plan. */
@Component({
  selector: 'app-offers-manager',
  template: `
    <h2>Promociones</h2>
    @if (!canPromo()) {
      <p class="lock">🔒 Publicar promociones está disponible desde el plan Básico.</p>
    } @else {
      <ul class="items">
        @for (p of promos(); track p.id) {
          <li>
            <span><b>{{ p.title }}</b><small>{{ p.validTo < now() ? 'Vencida el ' : 'Hasta el ' }}{{ date(p.validTo) }}</small></span>
            <button type="button" (click)="remove('promotions', p.id)" [disabled]="busy()">Eliminar</button>
          </li>
        } @empty {
          <li class="empty">Todavía no publicaste promociones.</li>
        }
      </ul>
      <small>Tu plan permite {{ promoLimit() }} promoción(es) vigente(s). Vigentes ahora: {{ activePromos() }}.</small>

      <div class="form">
        <input type="text" maxlength="80" placeholder="Título (ej: 2x1 en desayunos)" [value]="pTitle()" (input)="pTitle.set($any($event.target).value)" />
        <textarea rows="2" maxlength="300" placeholder="Detalle (opcional)" [value]="pDesc()" (input)="pDesc.set($any($event.target).value)"></textarea>
        <input type="text" maxlength="20" placeholder="Código de cupón (opcional)" [value]="pCode()" (input)="pCode.set($any($event.target).value)" />
        <div class="two">
          <label>Desde <input type="date" [value]="pFrom()" (input)="pFrom.set($any($event.target).value)" /></label>
          <label>Hasta <input type="date" [value]="pTo()" (input)="pTo.set($any($event.target).value)" /></label>
        </div>
        @if (pError()) { <p class="err" role="alert">{{ pError() }}</p> }
        <button type="button" class="add" (click)="addPromo()" [disabled]="busy()">Publicar promoción</button>
      </div>
    }

    <h2>Eventos</h2>
    @if (!canEvent()) {
      <p class="lock">🔒 Publicar eventos está disponible desde el plan Premium.</p>
    } @else {
      <ul class="items">
        @for (e of events(); track e.id) {
          <li>
            <span><b>{{ e.title }}</b><small>{{ date(e.startAt) }} · {{ time(e.startAt) }} hs</small></span>
            <button type="button" (click)="remove('events', e.id)" [disabled]="busy()">Eliminar</button>
          </li>
        } @empty {
          <li class="empty">Todavía no publicaste eventos.</li>
        }
      </ul>
      <small>Tu plan permite {{ eventLimit() }} evento(s) próximo(s). Próximos ahora: {{ upcomingEvents() }}.</small>

      <div class="form">
        <input type="text" maxlength="80" placeholder="Nombre del evento" [value]="eTitle()" (input)="eTitle.set($any($event.target).value)" />
        <textarea rows="2" maxlength="500" placeholder="Detalle (opcional)" [value]="eDesc()" (input)="eDesc.set($any($event.target).value)"></textarea>
        <div class="two">
          <label>Tipo
            <select [value]="eType()" (change)="eType.set($any($event.target).value)">
              @for (t of types; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
            </select>
          </label>
          <label>Fecha y hora <input type="datetime-local" [value]="eStart()" (input)="eStart.set($any($event.target).value)" /></label>
        </div>
        <input type="text" maxlength="120" placeholder="Lugar (opcional)" [value]="eLocation()" (input)="eLocation.set($any($event.target).value)" />
        <input type="text" maxlength="40" placeholder="Precio (ej: Gratis, $5000)" [value]="ePrice()" (input)="ePrice.set($any($event.target).value)" />
        @if (eError()) { <p class="err" role="alert">{{ eError() }}</p> }
        <button type="button" class="add" (click)="addEvent()" [disabled]="busy()">Publicar evento</button>
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: 8px; margin-top: 8px; }
    h2 { font-size: 17px; margin-top: 14px; }
    small { color: var(--muted); font-size: 12px; font-weight: 400; }
    .lock { margin: 0; padding: 12px 14px; background: #f3f5f3; border-radius: 12px; font-size: 13px; color: var(--muted); }
    .items { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .items li { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 12px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
    .items li span { display: grid; font-size: 14px; }
    .items li.empty { color: var(--muted); font-size: 13px; }
    .items button { border: 0; background: none; color: #b3261e; font-weight: 600; font-size: 13px; }
    .form { display: grid; gap: 8px; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
    input, textarea, select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font: inherit;
      font-size: 14px; background: #fff; outline: 0; }
    label { display: grid; gap: 4px; font-size: 12px; font-weight: 600; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .add { border: 0; border-radius: 999px; padding: 11px; background: var(--green-700); color: #fff; font-weight: 600; }
    button:disabled { opacity: 0.6; }
    .err { margin: 0; color: #b3261e; font-size: 13px; }
  `,
})
export class OffersManager {
  readonly place = input.required<Place>();
  private readonly repo = inject(OffersRepository);

  readonly types = EVENT_TYPES;
  readonly promos = signal<Promotion[]>([]);
  readonly events = signal<EventItem[]>([]);
  readonly busy = signal(false);
  readonly now = signal(new Date());

  private readonly plan = computed<PlanTier>(() => effectivePlan(this.place()));
  readonly canPromo = computed(() => PROMO_LIMIT[this.plan()] > 0);
  readonly canEvent = computed(() => EVENT_LIMIT[this.plan()] > 0);
  readonly promoLimit = computed(() => PROMO_LIMIT[this.plan()]);
  readonly eventLimit = computed(() => EVENT_LIMIT[this.plan()]);
  readonly activePromos = computed(() => this.promos().filter((p) => p.validTo >= this.now()).length);
  readonly upcomingEvents = computed(() => this.events().filter((e) => e.startAt >= this.now()).length);

  readonly pTitle = signal('');
  readonly pDesc = signal('');
  readonly pCode = signal('');
  readonly pFrom = signal(toDateInput(new Date()));
  readonly pTo = signal('');
  readonly pError = signal('');

  readonly eTitle = signal('');
  readonly eDesc = signal('');
  readonly eType = signal('festival');
  readonly eStart = signal('');
  readonly eLocation = signal('');
  readonly ePrice = signal('');
  readonly eError = signal('');

  date = fmtDate;
  time = fmtTime;

  constructor() {
    effect(() => void this.load(this.place().id));
  }

  private async load(placeId: string): Promise<void> {
    this.now.set(new Date());
    try {
      const [promos, events] = await Promise.all([this.repo.promotionsByPlace(placeId), this.repo.eventsByPlace(placeId)]);
      this.promos.set(promos);
      this.events.set(events);
    } catch {
      // se mostrarán las listas vacías
    }
  }

  async addPromo(): Promise<void> {
    this.pError.set('');
    const title = this.pTitle().trim();
    if (title.length < 3) return this.pError.set('Escribí un título de al menos 3 letras.');
    if (!this.pFrom() || !this.pTo()) return this.pError.set('Elegí las fechas de inicio y de fin.');
    const validFrom = startOfDay(this.pFrom());
    const validTo = endOfDay(this.pTo());
    if (validTo <= validFrom) return this.pError.set('La fecha de fin tiene que ser posterior a la de inicio.');
    if (this.activePromos() >= this.promoLimit()) {
      return this.pError.set('Llegaste al máximo de promociones vigentes de tu plan. Eliminá una o cambiá de plan.');
    }
    this.busy.set(true);
    try {
      await this.repo.createPromotion(this.place(), {
        title, description: this.pDesc().trim(), couponCode: this.pCode().trim().toUpperCase(), validFrom, validTo,
      });
      this.pTitle.set(''); this.pDesc.set(''); this.pCode.set(''); this.pTo.set('');
      await this.load(this.place().id);
    } catch {
      this.pError.set('No pudimos publicar la promoción. Revisá tu plan y tu conexión e intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  async addEvent(): Promise<void> {
    this.eError.set('');
    const title = this.eTitle().trim();
    if (title.length < 3) return this.eError.set('Escribí el nombre del evento (al menos 3 letras).');
    if (!this.eStart()) return this.eError.set('Elegí la fecha y la hora del evento.');
    const startAt = new Date(this.eStart());
    if (startAt < new Date()) return this.eError.set('La fecha del evento ya pasó.');
    if (this.upcomingEvents() >= this.eventLimit()) {
      return this.eError.set('Llegaste al máximo de eventos próximos de tu plan. Eliminá uno o cambiá de plan.');
    }
    this.busy.set(true);
    try {
      await this.repo.createEvent(this.place(), {
        title, description: this.eDesc().trim(), type: this.eType(), location: this.eLocation().trim(),
        price: this.ePrice().trim(), startAt,
      });
      this.eTitle.set(''); this.eDesc.set(''); this.eLocation.set(''); this.ePrice.set(''); this.eStart.set('');
      await this.load(this.place().id);
    } catch {
      this.eError.set('No pudimos publicar el evento. Revisá tu plan y tu conexión e intentá de nuevo.');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(kind: 'promotions' | 'events', id: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.repo.remove(kind, id);
      await this.load(this.place().id);
    } catch {
      const msg = 'No pudimos eliminarlo. Intentá de nuevo.';
      if (kind === 'promotions') this.pError.set(msg);
      else this.eError.set(msg);
    } finally {
      this.busy.set(false);
    }
  }
}
