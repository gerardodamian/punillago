import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthService } from './auth.service';

/** Una persona es administradora si existe el documento admins/{su uid} (se crea a mano en la consola). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly db = inject(FirebaseService).db;
  private readonly auth = inject(AuthService);
  private readonly uid = computed(() => this.auth.user()?.uid ?? null);

  readonly isAdmin = signal(false);
  /** false hasta que se terminó de averiguar si es administradora */
  readonly ready = signal(false);

  constructor() {
    effect(() => {
      const uid = this.uid();
      if (!this.auth.ready()) return;
      if (!uid) {
        this.isAdmin.set(false);
        this.ready.set(true);
        return;
      }
      this.ready.set(false);
      getDoc(doc(this.db, 'admins', uid))
        .then((s) => {
          console.log('Chequeo de administración → código:', uid, '| existe el documento:', s.exists());
          this.isAdmin.set(s.exists());
        })
        .catch((e) => {
          console.error('Chequeo de administración falló:', e);
          this.isAdmin.set(false);
        })
        .finally(() => this.ready.set(true));
    });
  }
}
