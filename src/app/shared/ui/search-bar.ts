import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="bar">
      <span aria-hidden="true">🔍</span>
      <input
        type="search"
        placeholder="¿Qué estás buscando?"
        aria-label="Buscar en Punilla"
        [value]="term()"
        (input)="term.set($any($event.target).value)"
        (keyup.enter)="submit()" />
      <button type="button" (click)="submit()">Buscar</button>
    </div>
  `,
  styles: `
    .bar { display: flex; align-items: center; gap: 8px; background: var(--surface); border-radius: 999px;
      padding: 6px 6px 6px 16px; box-shadow: var(--shadow); }
    input { flex: 1; min-width: 0; border: 0; outline: 0; font: inherit; font-size: 15px; background: transparent; color: var(--text); }
    button { border: 0; border-radius: 999px; padding: 10px 18px; background: var(--green-700); color: #fff; font-weight: 600; }
  `,
})
export class SearchBar {
  readonly term = signal('');
  readonly search = output<string>();

  submit(): void {
    this.search.emit(this.term().trim());
  }
}
