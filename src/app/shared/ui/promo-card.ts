import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fmtDate } from '../../core/dates';
import { Promotion } from '../models/models';

@Component({
  selector: 'app-promo-card',
  imports: [RouterLink],
  template: `
    <a class="card" [class.fluid]="fluid()" [routerLink]="['/lugar', promo().placeId]">
      <span class="tag">🏷️ Promoción</span>
      <h3>{{ promo().title }}</h3>
      <span class="place">{{ promo().placeName }}</span>
      @if (promo().description) {
        <p>{{ promo().description }}</p>
      }
      <div class="foot">
        @if (promo().couponCode) {
          <span class="code">Cupón {{ promo().couponCode }}</span>
        }
        <small>Hasta {{ until() }}</small>
      </div>
    </a>
  `,
  styles: `
    .card { display: grid; gap: 6px; width: 260px; padding: 14px; background: var(--surface); border-radius: var(--radius);
      border-left: 5px solid var(--orange-500); box-shadow: var(--shadow); flex: none; scroll-snap-align: start; align-content: start; }
    .card.fluid { width: 100%; }
    .tag { font-size: 12px; font-weight: 600; color: var(--orange-500); }
    h3 { font-size: 16px; }
    .place { font-size: 13px; color: var(--muted); }
    p { margin: 0; font-size: 13px; line-height: 1.4; }
    .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 4px; }
    .code { background: #fff3e3; color: #9a5a00; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
    small { color: var(--muted); }
  `,
})
export class PromoCard {
  readonly promo = input.required<Promotion>();
  readonly fluid = input(false);
  readonly until = computed(() => fmtDate(this.promo().validTo));
}
