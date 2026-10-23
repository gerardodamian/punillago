import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fmtTime, monthShort } from '../../core/dates';
import { EVENT_TYPES, EventItem } from '../models/models';

@Component({
  selector: 'app-event-card',
  imports: [RouterLink],
  template: `
    <a class="card" [routerLink]="['/lugar', event().placeId]">
      <div class="date" aria-hidden="true">
        <b>{{ event().startAt.getDate() }}</b>
        <span>{{ month() }}</span>
      </div>
      <div class="info">
        <span class="type">{{ typeLabel() }} · {{ time() }} hs</span>
        <h3>{{ event().title }}</h3>
        <span class="meta">{{ event().placeName }}@if (event().location) { · {{ event().location }} }</span>
        @if (event().price) {
          <span class="price">{{ event().price }}</span>
        }
      </div>
    </a>
  `,
  styles: `
    .card { display: flex; gap: 14px; padding: 12px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
    .date { flex: none; width: 56px; height: 62px; display: grid; place-items: center; align-content: center; border-radius: 12px;
      background: var(--green-700); color: #fff; }
    .date b { font-size: 22px; line-height: 1; }
    .date span { font-size: 11px; letter-spacing: 1px; }
    .info { display: grid; gap: 2px; min-width: 0; }
    .type { font-size: 12px; font-weight: 600; color: var(--teal-600); }
    h3 { font-size: 15px; }
    .meta { font-size: 13px; color: var(--muted); }
    .price { font-size: 13px; font-weight: 600; color: var(--green-700); }
  `,
})
export class EventCard {
  readonly event = input.required<EventItem>();
  readonly month = computed(() => monthShort(this.event().startAt));
  readonly time = computed(() => fmtTime(this.event().startAt));
  readonly typeLabel = computed(() => EVENT_TYPES.find((t) => t.value === this.event().type)?.label ?? 'Evento');
}
