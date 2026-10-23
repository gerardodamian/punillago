import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  imports: [RouterLink],
  template: `
    <section class="container box">
      <h1>{{ title }}</h1>
      <p>Esta sección se construye en los próximos módulos.</p>
      <a routerLink="/">Volver al inicio</a>
    </section>
  `,
  styles: `
    .box { padding-top: 48px; text-align: center; display: grid; gap: 12px; }
    p { color: var(--muted); margin: 0; }
    a { color: var(--green-700); font-weight: 600; }
  `,
})
export class Placeholder {
  readonly title: string = inject(ActivatedRoute).snapshot.data['title'] ?? 'Próximamente';
}
