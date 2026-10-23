import { Component, computed, inject, signal } from '@angular/core';
import { monthLong } from '../../core/dates';
import { OffersRepository } from '../../data-access/offers.repository';
import { EVENT_TYPES, EventItem } from '../../shared/models/models';
import { EventCard } from '../../shared/ui/event-card';

@Component({
  selector: 'app-eventos',
  imports: [EventCard],
  template: `
    <section class="container">
      <h1>Eventos</h1>

      <div class="chips" role="group" aria-label="Tipo de evento">
        <button type="button" [class.on]="!tipo()" (click)="tipo.set('')">Todos</button>
        @for (t of types(); track t.value) {
          <button type="button" [class.on]="tipo() === t.value" (click)="tipo.set(t.value)">{{ t.label }}</button>
        }
      </div>

      @switch (status()) {
        @case ('loading') {
          <p class="note">Cargando…</p>
        }
        @case ('error') {
          <p class="note">No pudimos cargar los eventos. Revisá tu conexión e intentá de nuevo.</p>
        }
        @default {
          @for (g of groups(); track g.label) {
            <h2>{{ g.label }}</h2>
            <div class="list">
              @for (e of g.items; track e.id) {
                <app-event-card [event]="e" />
              }
            </div>
          } @empty {
            <p class="note">No hay eventos próximos cargados.</p>
          }
        }
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 14px; text-transform: capitalize; color: var(--muted); margin: 18px 0 8px; }
    .chips { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0 0; }
    .chips button { flex: none; border: 1px solid var(--border); background: var(--surface); color: var(--text);
      border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 500; }
    .chips button.on { background: var(--green-700); border-color: var(--green-700); color: #fff; }
    .list { display: grid; gap: 10px; }
    .note { color: var(--muted); margin-top: 20px; }
  `,
})
export class Eventos {
  private readonly repo = inject(OffersRepository);

  readonly tipo = signal('');
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly events = signal<EventItem[]>([]);

  /** Solo los tipos que tienen algún evento cargado. */
  readonly types = computed(() => {
    const used = new Set(this.events().map((e) => e.type));
    return EVENT_TYPES.filter((t) => used.has(t.value));
  });

  /** Eventos agrupados por mes (ya vienen ordenados por fecha). */
  readonly groups = computed(() => {
    const tipo = this.tipo();
    const map = new Map<string, EventItem[]>();
    for (const e of this.events().filter((x) => !tipo || x.type === tipo)) {
      const label = monthLong(e.startAt);
      map.set(label, [...(map.get(label) ?? []), e]);
    }
    return [...map].map(([label, items]) => ({ label, items }));
  });

  constructor() {
    this.repo
      .getEvents()
      .then((list) => {
        this.events.set(list);
        this.status.set('ready');
      })
      .catch(() => this.status.set('error'));
  }
}
