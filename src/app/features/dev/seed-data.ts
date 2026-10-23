import { Place } from '../../shared/models/models';

export type SeedPlace = Omit<Place, 'regionId'>;

const base = {
  status: 'published' as const,
  phone: '+543548000000', // número ficticio
  whatsapp: '543548000000', // ficticio: con código de país y sin el 9
  services: ['WhatsApp', 'Wi-Fi'],
  hours: 'Todos los días de 9 a 21 hs',
};

export const SEED_PLACES: SeedPlace[] = [
  { ...base, id: 'cabanas-del-rio', name: 'Cabañas del Río', category: 'dormir', categoryLabel: 'Cabañas', locality: 'Valle Hermoso',
    description: 'Cabañas entre árboles a metros del río. Comercio de ejemplo para pruebas.', services: ['Pileta', 'Parrilla', 'Wi-Fi', 'Mascotas'],
    rating: 4.8, reviews: 126, priceLevel: 2, icon: '🏡', featured: true, address: 'Av. San Martín 100', lat: -31.1017, lng: -64.4944 },
  { ...base, id: 'hotel-las-sierras', name: 'Hotel Las Sierras', category: 'dormir', categoryLabel: 'Hotel', locality: 'La Falda',
    description: 'Hotel céntrico con desayuno incluido. Comercio de ejemplo para pruebas.', services: ['Desayuno', 'Pileta', 'Estacionamiento'],
    rating: 4.4, reviews: 87, priceLevel: 3, icon: '🏨', featured: false, address: 'Av. Edén 200', lat: -31.087, lng: -64.4885 },
  { ...base, id: 'camping-el-arroyo', name: 'Camping El Arroyo', category: 'dormir', categoryLabel: 'Camping', locality: 'Capilla del Monte',
    description: 'Parcelas con sombra junto al arroyo. Comercio de ejemplo para pruebas.', services: ['Duchas calientes', 'Fogones', 'Proveeduría'],
    rating: 4.3, reviews: 64, priceLevel: 1, icon: '🏕️', featured: false, address: 'Camino al Arroyo s/n', lat: -30.8603, lng: -64.5262 },
  { ...base, id: 'hostel-del-mochilero', name: 'Hostel del Mochilero', category: 'dormir', categoryLabel: 'Hostel', locality: 'Cosquín',
    description: 'Habitaciones compartidas y privadas, ambiente relajado. Comercio de ejemplo para pruebas.', services: ['Cocina compartida', 'Wi-Fi'],
    rating: 4.5, reviews: 52, priceLevel: 1, icon: '🎒', featured: false, address: 'Calle Tucumán 300', lat: -31.2417, lng: -64.465 },
  { ...base, id: 'parrilla-la-cumbre', name: 'Parrilla La Cumbre', category: 'comer', categoryLabel: 'Restaurante', locality: 'La Falda',
    description: 'Asado criollo y carnes a la parrilla. Comercio de ejemplo para pruebas.', services: ['Salón', 'Delivery', 'Reservas'],
    rating: 4.6, reviews: 98, priceLevel: 2, icon: '🥩', featured: true, address: 'Av. Argentina 450', lat: -31.0905, lng: -64.4871, hours: 'Mié a Dom de 12 a 15 y de 20 a 24 hs' },
  { ...base, id: 'cafe-del-dique', name: 'Café del Dique', category: 'comer', categoryLabel: 'Cafetería', locality: 'Villa Carlos Paz',
    description: 'Café de especialidad y pastelería con vista al lago. Comercio de ejemplo para pruebas.', services: ['Pastelería', 'Wi-Fi', 'Terraza'],
    rating: 4.5, reviews: 210, priceLevel: 1, icon: '☕', featured: true, address: 'Costanera 50', lat: -31.4241, lng: -64.4978, hours: 'Todos los días de 8 a 22 hs' },
  { ...base, id: 'rotiseria-don-pepe', name: 'Rotisería Don Pepe', category: 'comer', categoryLabel: 'Rotisería', locality: 'Cosquín',
    description: 'Pollo al spiedo, empanadas y minutas para llevar. Comercio de ejemplo para pruebas.', services: ['Para llevar', 'Delivery'],
    rating: 4.2, reviews: 73, priceLevel: 1, icon: '🍗', featured: false, address: 'Calle Sarmiento 120', lat: -31.2432, lng: -64.4668 },
  { ...base, id: 'cabalgatas-sierras', name: 'Cabalgatas Sierras', category: 'excursiones', categoryLabel: 'Cabalgatas', locality: 'Cosquín',
    description: 'Cabalgatas guiadas por las sierras, para principiantes y avanzados. Comercio de ejemplo para pruebas.', services: ['Guía', 'Seguro', 'Reservas'],
    rating: 4.9, reviews: 54, priceLevel: 2, icon: '🐎', featured: true, address: 'Camino a las Sierras km 3', lat: -31.25, lng: -64.48, hours: 'Salidas a las 10 y a las 16 hs' },
  { ...base, id: 'trekking-uritorco', name: 'Trekking Guiado Uritorco', category: 'excursiones', categoryLabel: 'Senderismo', locality: 'Capilla del Monte',
    description: 'Ascensos guiados con guía habilitado. Comercio de ejemplo para pruebas.', services: ['Guía', 'Seguro', 'Reservas'],
    rating: 4.7, reviews: 91, priceLevel: 2, icon: '🥾', featured: false, address: 'Acceso al Cerro', lat: -30.8, lng: -64.5, hours: 'Salidas a las 7 hs' },
  { ...base, id: 'balneario-del-rio', name: 'Balneario del Río', category: 'naturaleza', categoryLabel: 'Balneario', locality: 'Huerta Grande',
    description: 'Balneario con sombra, quinchos y proveeduría. Comercio de ejemplo para pruebas.', services: ['Sombra', 'Quinchos', 'Proveeduría'],
    rating: 4.4, reviews: 140, priceLevel: 1, icon: '🌊', featured: false, address: 'Camino al Río', lat: -31.0678, lng: -64.49, hours: 'Todos los días de 9 a 19 hs' },
  { ...base, id: 'farmacia-central', name: 'Farmacia Central', category: 'servicios', categoryLabel: 'Farmacia', locality: 'La Falda',
    description: 'Farmacia con turnos rotativos. Comercio de ejemplo para pruebas.', services: ['Turnos de guardia', 'Delivery'],
    rating: 4.3, reviews: 40, priceLevel: 1, icon: '💊', featured: false, address: 'Av. Edén 500', lat: -31.0885, lng: -64.489, hours: 'Lun a Sáb de 8 a 21 hs' },
  { ...base, id: 'artesanias-punilla', name: 'Artesanías de Punilla', category: 'comercios', categoryLabel: 'Artesanías', locality: 'Valle Hermoso',
    description: 'Tejidos, cerámica y productos regionales hechos a mano. Comercio de ejemplo para pruebas.', services: ['Envíos', 'Regalería'],
    rating: 4.6, reviews: 33, priceLevel: 2, icon: '🧺', featured: false, address: 'Av. San Martín 250', lat: -31.103, lng: -64.495 },
];
