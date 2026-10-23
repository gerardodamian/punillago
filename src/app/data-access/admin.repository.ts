import { Injectable, inject } from '@angular/core';
import { addDoc, collection, deleteField, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { FirebaseService } from '../core/firebase/firebase.service';
import { Place, PlaceStatus, PlanTier } from '../shared/models/models';
import { PlacesRepository, mapPlace } from './places.repository';

/** Operaciones de administración sobre los comercios (las reglas exigen que seas administradora). */
@Injectable({ providedIn: 'root' })
export class AdminRepository {
  private readonly fb = inject(FirebaseService);
  private readonly places = inject(PlacesRepository);

  /** Todos los comercios de la región, publicados o no. */
  async listPlaces(): Promise<Place[]> {
    const snap = await getDocs(query(collection(this.fb.db, 'places'), where('regionId', '==', this.fb.regionId)));
    return snap.docs.map(mapPlace).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async savePlace(
    id: string,
    f: { status: PlaceStatus; plan: PlanTier; planUntil: Date | null; featured: boolean; ownerId: string },
  ): Promise<void> {
    await updateDoc(doc(this.fb.db, 'places', id), {
      status: f.status,
      plan: f.plan,
      featured: f.featured,
      planUntil: f.planUntil ?? deleteField(),
      ownerId: f.ownerId || deleteField(),
      updatedAt: serverTimestamp(),
    });
    this.places.clearCache();
  }

  /** Crea un comercio en borrador (no se ve hasta que lo publiques). */
  async createPlace(f: { name: string; category: string; categoryLabel: string; locality: string; icon: string }): Promise<void> {
    await addDoc(collection(this.fb.db, 'places'), {
      ...f,
      regionId: this.fb.regionId,
      status: 'draft',
      description: '',
      services: [],
      rating: 0,
      reviews: 0,
      priceLevel: 2,
      featured: false,
      plan: 'free',
      createdAt: serverTimestamp(),
    });
    this.places.clearCache();
  }
}
