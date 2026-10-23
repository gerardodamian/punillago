import { Injectable, inject } from '@angular/core';
import { Timestamp, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../core/firebase/firebase.service';
import { Review } from '../shared/models/models';

/** Reseñas: places/{placeId}/reviews/{uid}. El id es el uid, así cada persona deja una sola reseña por comercio. */
@Injectable({ providedIn: 'root' })
export class ReviewsRepository {
  private readonly db = inject(FirebaseService).db;

  async list(placeId: string): Promise<Review[]> {
    const q = query(collection(this.db, 'places', placeId, 'reviews'), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: d.id,
        userName: String(data['userName'] ?? 'Usuario'),
        rating: Number(data['rating'] ?? 0),
        text: String(data['text'] ?? ''),
        createdAt: (data['createdAt'] as Timestamp | null)?.toDate() ?? null,
      };
    });
  }

  save(placeId: string, uid: string, userName: string, rating: number, text: string): Promise<void> {
    return setDoc(doc(this.db, 'places', placeId, 'reviews', uid), {
      userId: uid,
      userName,
      rating,
      text,
      createdAt: serverTimestamp(),
    });
  }

  remove(placeId: string, uid: string): Promise<void> {
    return deleteDoc(doc(this.db, 'places', placeId, 'reviews', uid));
  }
}
