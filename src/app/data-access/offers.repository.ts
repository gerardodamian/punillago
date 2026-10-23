import { Injectable, inject } from '@angular/core';
import {
  QueryDocumentSnapshot, Timestamp, addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where,
} from 'firebase/firestore';
import { startOfToday } from '../core/dates';
import { FirebaseService } from '../core/firebase/firebase.service';
import { EventItem, Place, Promotion } from '../shared/models/models';

const toDate = (v: unknown): Date => (v as Timestamp).toDate();

function mapPromo(d: QueryDocumentSnapshot): Promotion {
  const x = d.data();
  return {
    id: d.id,
    placeId: String(x['placeId']),
    placeName: String(x['placeName'] ?? ''),
    title: String(x['title'] ?? ''),
    description: String(x['description'] ?? ''),
    couponCode: x['couponCode'] ? String(x['couponCode']) : undefined,
    validFrom: toDate(x['validFrom']),
    validTo: toDate(x['validTo']),
  };
}

function mapEvent(d: QueryDocumentSnapshot): EventItem {
  const x = d.data();
  return {
    id: d.id,
    placeId: String(x['placeId']),
    placeName: String(x['placeName'] ?? ''),
    title: String(x['title'] ?? ''),
    description: String(x['description'] ?? ''),
    type: String(x['type'] ?? 'otro'),
    location: String(x['location'] ?? ''),
    price: String(x['price'] ?? ''),
    startAt: toDate(x['startAt']),
  };
}

/** Promociones y eventos de los comercios (colecciones `promotions` y `events`). */
@Injectable({ providedIn: 'root' })
export class OffersRepository {
  private readonly fb = inject(FirebaseService);
  private promos?: Promise<Promotion[]>;
  private events?: Promise<EventItem[]>;

  /** Promociones vigentes hoy, las que vencen antes primero. */
  getPromotions(): Promise<Promotion[]> {
    this.promos ??= this.fetchPromos().catch((e) => {
      this.promos = undefined;
      throw e;
    });
    return this.promos;
  }

  /** Eventos que todavía no pasaron, los más próximos primero. */
  getEvents(): Promise<EventItem[]> {
    this.events ??= this.fetchEvents().catch((e) => {
      this.events = undefined;
      throw e;
    });
    return this.events;
  }

  async promotionsByPlace(placeId: string): Promise<Promotion[]> {
    const q = query(collection(this.fb.db, 'promotions'), where('placeId', '==', placeId), where('status', '==', 'published'));
    return (await getDocs(q)).docs.map(mapPromo).sort((a, b) => b.validTo.getTime() - a.validTo.getTime());
  }

  async eventsByPlace(placeId: string): Promise<EventItem[]> {
    const q = query(collection(this.fb.db, 'events'), where('placeId', '==', placeId), where('status', '==', 'published'));
    return (await getDocs(q)).docs.map(mapEvent).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  async createPromotion(
    place: Place,
    f: { title: string; description: string; couponCode: string; validFrom: Date; validTo: Date },
  ): Promise<void> {
    await addDoc(collection(this.fb.db, 'promotions'), {
      placeId: place.id,
      placeName: place.name,
      regionId: place.regionId,
      title: f.title,
      description: f.description,
      ...(f.couponCode ? { couponCode: f.couponCode } : {}),
      validFrom: f.validFrom,
      validTo: f.validTo,
      status: 'published',
      createdAt: serverTimestamp(),
    });
    this.promos = undefined;
  }

  async createEvent(
    place: Place,
    f: { title: string; description: string; type: string; location: string; price: string; startAt: Date },
  ): Promise<void> {
    await addDoc(collection(this.fb.db, 'events'), {
      placeId: place.id,
      placeName: place.name,
      regionId: place.regionId,
      ...f,
      status: 'published',
      createdAt: serverTimestamp(),
    });
    this.events = undefined;
  }

  async remove(kind: 'promotions' | 'events', id: string): Promise<void> {
    await deleteDoc(doc(this.fb.db, kind, id));
    if (kind === 'promotions') this.promos = undefined;
    else this.events = undefined;
  }

  private async fetchPromos(): Promise<Promotion[]> {
    const q = query(collection(this.fb.db, 'promotions'), where('status', '==', 'published'), where('regionId', '==', this.fb.regionId));
    const now = new Date();
    return (await getDocs(q)).docs
      .map(mapPromo)
      .filter((p) => p.validFrom <= now && p.validTo >= now)
      .sort((a, b) => a.validTo.getTime() - b.validTo.getTime());
  }

  private async fetchEvents(): Promise<EventItem[]> {
    const q = query(collection(this.fb.db, 'events'), where('status', '==', 'published'), where('regionId', '==', this.fb.regionId));
    const from = startOfToday();
    return (await getDocs(q)).docs
      .map(mapEvent)
      .filter((e) => e.startAt >= from)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }
}
