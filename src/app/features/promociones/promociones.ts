import { Component, inject, signal } from '@angular/core';
import { OffersRepository } from '../../data-access/offers.repository';
import { Promotion } from '../../shared/models/models';
import { PromoCard } from '../../shared/ui/promo-card';

@Component({
  selector: 'app-promociones',
  imports: [PromoCard],
  template: `
    <section class="container">
      <h1>Promociones</h1>
      <p class="sub">Beneficios y descuentos de los comercios de Punilla.</p>

      @switch (status()) {
        @case ('loading') {
          <p class="note">Cargando…</p>
        }
        @case ('error') {
          <p class="note">No pudimos cargar las promociones. Revisá tu conexión e intentá de nuevo.</p>
        }
        @default {
          @if (promos().length) {
            <div class="list">
              @for (p of promos(); track p.id) {
                <app-promo-card [promo]="p" [fluid]="true" />
              }
            </div>
          } @else {
            <p class="note">Todavía no hay promociones vigentes.</p>
          }
        }
      }
    </section>
  `,
  styles: `
    section { padding-top: 16px; }
    h1 { font-size: 24px; }
    .sub { margin: 4px 0 16px; color: var(--muted); }
    .note { color: var(--muted); margin-top: 20px; }
    .list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  `,
})
export class Promociones {
  readonly promos = signal<Promotion[]>([]);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    inject(OffersRepository)
      .getPromotions()
      .then((list) => {
        this.promos.set(list);
        this.status.set('ready');
      })
      .catch(() => this.status.set('error'));
  }
}
