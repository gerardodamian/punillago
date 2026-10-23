import { Component, effect, input, signal, inject } from '@angular/core';
import { startOfToday } from '../../core/dates';
import { OffersRepository } from '../../data-access/offers.repository';
import { EventItem, Promotion } from '../../shared/models/models';
import { EventCard } from '../../shared/ui/event-card';
import { PromoCard } from '../../shared/ui/promo-card';

/** Promociones vigentes y próximos eventos de un comercio, para su ficha pública. */
@Component({
  selector: 'app-place-offers',
  imports: [PromoCard, EventCard],
  template: `
    @if (promos().length) {
      <h2>Promociones</h2>
      <div class="list">
        @for (p of promos(); track p.id) {
          <app-promo-card [promo]="p" [fluid]="true" />
        }
      </div>
    }
    @if (events().length) {
      <h2>Próximos eventos</h2>
      <div class="list">
        @for (e of events(); track e.id) {
          <app-event-card [event]="e" />
        }
      </div>
    }
  `,
  styles: `
    :host { display: contents; }
    h2 { font-size: 16px; margin-top: 16px; }
    .list { display: grid; gap: 10px; }
  `,
})
export class PlaceOffers {
  readonly placeId = input.required<string>();
  private readonly repo = inject(OffersRepository);

  readonly promos = signal<Promotion[]>([]);
  readonly events = signal<EventItem[]>([]);

  constructor() {
    effect(() => void this.load(this.placeId()));
  }

  private async load(placeId: string): Promise<void> {
    try {
      const now = new Date();
      const [promos, events] = await Promise.all([this.repo.promotionsByPlace(placeId), this.repo.eventsByPlace(placeId)]);
      this.promos.set(promos.filter((p) => p.validFrom <= now && p.validTo >= now));
      this.events.set(events.filter((e) => e.startAt >= startOfToday()));
    } catch {
      // si falla, la ficha se muestra igual, sin esta sección
    }
  }
}
