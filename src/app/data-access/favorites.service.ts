import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthService } from '../core/auth/auth.service';
import { FirebaseService } from '../core/firebase/firebase.service';

/** Favoritos del usuario: users/{uid}/favorites/{placeId}. */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly db = inject(FirebaseService).db;
  private readonly auth = inject(AuthService);
  private readonly uid = computed(() => this.auth.user()?.uid ?? null);

  readonly ids = signal<ReadonlySet<string>>(new Set());
  readonly loading = signal(false);

  constructor() {
    effect(() => {
      const uid = this.uid();
      if (uid) {
        void this.load(uid);
      } else {
        this.ids.set(new Set());
      }
    });
  }

  private async load(uid: string): Promise<void> {
    this.loading.set(true);
    try {
      const snap = await getDocs(collection(this.db, 'users', uid, 'favorites'));
      if (this.uid() === uid) this.ids.set(new Set(snap.docs.map((d) => d.id)));
    } catch {
      // sin conexión o sin permisos: dejamos la lista vacía
    } finally {
      this.loading.set(false);
    }
  }

  /** Agrega o quita el favorito. Actualiza la pantalla al instante y revierte si falla. */
  async toggle(placeId: string): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    const before = this.ids();
    const next = new Set(before);
    const ref = doc(this.db, 'users', uid, 'favorites', placeId);
    const adding = !next.has(placeId);
    if (adding) next.add(placeId);
    else next.delete(placeId);
    this.ids.set(next);
    try {
      if (adding) await setDoc(ref, { createdAt: serverTimestamp() });
      else await deleteDoc(ref);
    } catch {
      this.ids.set(before);
    }
  }
}
