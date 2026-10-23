import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Place } from '../models/models';

@Component({
  selector: 'app-place-card',
  imports: [RouterLink],
  template: `
    <a class="card" [class.fluid]="fluid()" [routerLink]="['/lugar', place().id]">
      <div class="cover" aria-hidden="true">{{ place().icon }}</div>
      <div class="body">
        <span class="cat">{{ place().categoryLabel }} · {{ place().locality }}</span>
        <h3>{{ place().name }}</h3>
        <div class="meta">
          <span class="rating">★ {{ place().rating }} <small>({{ place().reviews }})</small></span>
          <span class="price" [attr.aria-label]="'Nivel de precio ' + place().priceLevel">{{ price() }}</span>
        </div>
      </div>
    </a>
  `,
  styles: `
    .card { display: block; width: 230px; background: var(--surface); border-radius: var(--radius); overflow: hidden;
      box-shadow: var(--shadow); flex: none; scroll-snap-align: start; transition: transform 0.15s; }
    .card:hover { transform: translateY(-2px); }
    .card.fluid { width: 100%; }
    .cover { height: 120px; display: grid; place-items: center; font-size: 46px;
      background: linear-gradient(135deg, var(--green-500), var(--teal-600)); }
    .body { padding: 12px 14px 14px; display: grid; gap: 4px; }
    .cat { font-size: 12px; color: var(--muted); }
    h3 { font-size: 16px; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; }
    .rating { font-weight: 600; color: var(--orange-500); }
    .rating small { color: var(--muted); font-weight: 400; }
    .price { color: var(--green-700); font-weight: 600; }
  `,
})
export class PlaceCard {
  readonly place = input.required<Place>();
  readonly fluid = input(false);
  readonly price = computed(() => '$'.repeat(this.place().priceLevel));
}
