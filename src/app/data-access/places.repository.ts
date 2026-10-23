import { Injectable, inject } from '@angular/core';
import {
  DocumentSnapshot, Timestamp, collection, deleteField, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { FirebaseService } from '../core/firebase/firebase.service';
import { Category, Place } from '../shared/models/models';
import { isFeatured } from '../shared/models/plan';

/** Convierte un documento de Firestore en un Place (la fecha del plan pasa de Timestamp a Date). */
export function mapPlace(d: DocumentSnapshot): Place {
  const x = (d.data() ?? {}) as Record<string, unknown>;
  const until = x['planUntil'];
  return { ...x, id: d.id, planUntil: until instanceof Timestamp ? until.toDate() : undefined } as Place;
}

@Injectable({ providedIn: 'root' })
export class PlacesRepository {
  private readonly fb = inject(FirebaseService);
  private cache?: Promise<Place[]>;

  private readonly categories: Category[] = [
    { id: 'dormir', name: 'Dormí', icon: '🛏️', slug: 'dormir' },
    { id: 'comer', name: 'Comé', icon: '🍴', slug: 'comer' },
    { id: 'explorar', name: 'Explorá', icon: '⛰️', slug: 'excursiones' },
    { id: 'eventos', name: 'Eventos', icon: '📅', slug: 'eventos' },
    { id: 'comercios', name: 'Comercios', icon: '🛍️', slug: 'comercios' },
    { id: 'servicios', name: 'Servicios', icon: '🏥', slug: 'servicios' },
    { id: 'naturaleza', name: 'Ríos y diques', icon: '🌊', slug: 'naturaleza' },
    { id: 'promos', name: 'Promociones', icon: '🏷️', slug: 'promociones' },
  ];

  getCategories(): Category[] {
    return this.categories;
  }

  /** Trae todos los comercios publicados de la región (se guarda en memoria para no repetir lecturas). */
  getAll(): Promise<Place[]> {
    this.cache ??= this.fetchAll().catch((err) => {
      this.cache = undefined;
      throw err;
    });
    return this.cache;
  }

  /** Fuerza que la próxima consulta vuelva a leer de Firestore. */
  clearCache(): void {
    this.cache = undefined;
  }

  async getFeatured(): Promise<Place[]> {
    return (await this.getAll()).filter(isFeatured);
  }

  async getById(id: string): Promise<Place | null> {
    try {
      const snap = await getDoc(doc(this.fb.db, 'places', id));
      return snap.exists() ? mapPlace(snap) : null;
    } catch {
      return null;
    }
  }

  /** Comercios cuyo dueño es este usuario (incluye los que todavía no están publicados). */
  async getByOwner(uid: string): Promise<Place[]> {
    const snap = await getDocs(query(collection(this.fb.db, 'places'), where('ownerId', '==', uid)));
    return snap.docs.map(mapPlace);
  }

  /** Guarda los cambios del dueño. Los campos de `remove` se borran del documento. */
  async updatePlace(id: string, changes: Partial<Place>, remove: string[] = []): Promise<void> {
    const data: Record<string, unknown> = { ...changes, updatedAt: serverTimestamp() };
    for (const key of remove) data[key] = deleteField();
    await updateDoc(doc(this.fb.db, 'places', id), data);
    this.cache = undefined;
  }

  private async fetchAll(): Promise<Place[]> {
    const q = query(
      collection(this.fb.db, 'places'),
      where('status', '==', 'published'),
      where('regionId', '==', this.fb.regionId),
    );
    return (await getDocs(q)).docs.map(mapPlace);
  }
}
