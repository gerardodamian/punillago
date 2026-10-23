import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../models/models';

@Component({
  selector: 'app-category-tile',
  imports: [RouterLink],
  template: `
    <a class="tile" [routerLink]="link().path" [queryParams]="link().query">
      <span class="icon" aria-hidden="true">{{ category().icon }}</span>
      <span class="name">{{ category().name }}</span>
    </a>
  `,
  styles: `
    .tile { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 6px;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      transition: transform 0.15s, box-shadow 0.15s; }
    .tile:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .icon { font-size: 26px; }
    .name { font-size: 12px; font-weight: 600; color: var(--navy-900); text-align: center; }
  `,
})
export class CategoryTile {
  readonly category = input.required<Category>();

  /** Eventos y promociones tienen su propia pantalla; el resto filtra en Explorar. */
  readonly link = computed<{ path: string[]; query?: Record<string, string> }>(() => {
    const slug = this.category().slug;
    if (slug === 'eventos') return { path: ['/eventos'] };
    if (slug === 'promociones') return { path: ['/promociones'] };
    return { path: ['/explorar'], query: { categoria: slug } };
  });
}
