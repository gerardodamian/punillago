import { Component, inject, signal } from '@angular/core';
import { doc, writeBatch } from 'firebase/firestore';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { SEED_PLACES } from './seed-data';

/** Pantalla solo para desarrollo: carga comercios de ejemplo en Firestore. */
@Component({
  selector: 'app-seed',
  template: `
    <section class="container box">
      <h1>Cargar datos de ejemplo</h1>
      <p>Escribe {{ total }} comercios de ejemplo en Firestore (colección <code>places</code>). Solo para desarrollo.</p>
      <button type="button" (click)="run()" [disabled]="busy()">{{ busy() ? 'Cargando…' : 'Cargar comercios' }}</button>
      @if (msg()) {
        <p class="msg" [class.err]="isError()">{{ msg() }}</p>
      }
    </section>
  `,
  styles: `
    .box { padding-top: 32px; display: grid; gap: 14px; }
    p { margin: 0; line-height: 1.5; }
    button { justify-self: start; border: 0; border-radius: 999px; padding: 12px 22px; background: var(--green-700);
      color: #fff; font-weight: 600; }
    button:disabled { opacity: 0.6; }
    .msg { color: var(--green-700); font-weight: 600; }
    .msg.err { color: #b3261e; }
  `,
})
export class Seed {
  private readonly fb = inject(FirebaseService);
  readonly total = SEED_PLACES.length;
  readonly busy = signal(false);
  readonly msg = signal('');
  readonly isError = signal(false);

  async run(): Promise<void> {
    this.busy.set(true);
    this.msg.set('');
    try {
      const { db, regionId } = this.fb;
      const batch = writeBatch(db);
      for (const { id, ...data } of SEED_PLACES) {
        batch.set(doc(db, 'places', id), { ...data, regionId });
      }
      await batch.commit();
      this.isError.set(false);
      this.msg.set(`Listo: ${this.total} comercios cargados. Ya podés ir a Explorar.`);
    } catch (e) {
      this.isError.set(true);
      this.msg.set(`No se pudo escribir. Si dice permission-denied, faltan las reglas temporales del LEEME. Detalle: ${(e as Error).message}`);
    } finally {
      this.busy.set(false);
    }
  }
}
