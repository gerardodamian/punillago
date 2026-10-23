export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export type PlanTier = 'free' | 'basic' | 'premium' | 'featured';

export type PlaceStatus = 'draft' | 'pending' | 'published' | 'suspended';

export interface Place {
  id: string;
  regionId: string;
  status: PlaceStatus;
  name: string;
  /** slug de la categoría (dormir, comer, excursiones, naturaleza, servicios, comercios) */
  category: string;
  /** nombre visible del rubro (Cabañas, Cafetería, Farmacia…) */
  categoryLabel: string;
  locality: string;
  description: string;
  services: string[];
  rating: number;
  reviews: number;
  priceLevel: 1 | 2 | 3 | 4;
  icon: string;
  featured: boolean;
  phone?: string;
  /** solo números, con código de país y sin el 9 (ej: 543548123456) */
  whatsapp?: string;
  address?: string;
  lat?: number;
  lng?: number;
  hours?: string;
  /** uid del usuario dueño del comercio (lo asigna el administrador) */
  ownerId?: string;
  plan?: PlanTier;
  /** el plan vale hasta este día (inclusive); después cuenta como gratis */
  planUntil?: Date;
}

export interface Review {
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: Date | null;
}

export interface Promotion {
  id: string;
  placeId: string;
  placeName: string;
  title: string;
  description: string;
  couponCode?: string;
  validFrom: Date;
  validTo: Date;
}

export interface EventItem {
  id: string;
  placeId: string;
  placeName: string;
  title: string;
  description: string;
  type: string;
  location: string;
  price: string;
  startAt: Date;
}

export const EVENT_TYPES = [
  { value: 'festival', label: 'Festival' },
  { value: 'recital', label: 'Recital' },
  { value: 'pena', label: 'Peña' },
  { value: 'feria', label: 'Feria' },
  { value: 'carrera', label: 'Carrera' },
  { value: 'encuentro', label: 'Encuentro' },
  { value: 'otro', label: 'Otro' },
];
