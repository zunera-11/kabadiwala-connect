import {
  AppNotification,
  Language,
  LotStatus,
  PickupStatus,
  Role,
  ServiceActor,
  StructuredLocation,
  WorkflowPickupRequest,
  WorkflowWasteLot,
} from '../types';

const STORE_KEY = 'kabadiwala_connect_workflow_v1';
const USERS_KEY = 'kabadiwala_connect_auth_users_v1';
const EVENT_NAME = 'kabadiwala-workflow-updated';

interface WorkflowState {
  pickupRequests: WorkflowPickupRequest[];
  wasteLots: WorkflowWasteLot[];
  notifications: AppNotification[];
}

const CITY_COORDS: Record<string, { state: string; latitude: number; longitude: number }> = {
  jalgaon: { state: 'Maharashtra', latitude: 21.0077, longitude: 75.5626 },
  nashik: { state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
  pune: { state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  mumbai: { state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  delhi: { state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  'new delhi': { state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
};

export const SERVICE_ACTORS: ServiceActor[] = [
  { id: 'demo-collector', name: 'Ramesh Kumar', role: 'COLLECTOR', phone: '+91 98765 43210', location: parseLocation('Malviya Nagar, New Delhi'), serviceCities: ['New Delhi', 'Delhi'], materials: ['Plastic', 'E-Waste', 'Paper / Raddi', 'Metal / Loha'], rating: 4.9 },
  { id: 'collector-jalgaon-1', name: 'Suresh Patil', role: 'COLLECTOR', phone: '+91 98765 10021', location: parseLocation('Jalgaon, Maharashtra'), serviceCities: ['Jalgaon'], materials: ['Plastic', 'Paper / Raddi', 'Metal / Loha', 'E-Waste'], rating: 4.8 },
  { id: 'collector-nashik-1', name: 'Anita Shinde', role: 'COLLECTOR', phone: '+91 98765 10022', location: parseLocation('Nashik, Maharashtra'), serviceCities: ['Nashik'], materials: ['Plastic', 'Paper / Raddi', 'Metal / Loha'], rating: 4.7 },
  { id: 'collector-pune-1', name: 'Imran Shaikh', role: 'COLLECTOR', phone: '+91 98765 10023', location: parseLocation('Pune, Maharashtra'), serviceCities: ['Pune', 'Mumbai'], materials: ['E-Waste', 'Metal / Loha', 'Plastic'], rating: 4.8 },
  { id: 'demo-recycler', name: 'EcoCycle Hub #04', role: 'RECYCLER', phone: '+91 98765 12345', location: parseLocation('Okhla Industrial Area, New Delhi'), serviceCities: ['New Delhi', 'Delhi'], materials: ['E-Waste', 'Plastic', 'Metal / Loha'], capacity: '25 MT/day' },
  { id: 'recycler-jalgaon-1', name: 'Jalgaon Green Recovery', role: 'RECYCLER', phone: '+91 98765 20031', location: parseLocation('Jalgaon, Maharashtra'), serviceCities: ['Jalgaon', 'Nashik'], materials: ['Plastic', 'Paper / Raddi', 'Metal / Loha'], capacity: '12 MT/day' },
  { id: 'recycler-pune-1', name: 'Pune E-Waste Refiners', role: 'RECYCLER', phone: '+91 98765 20032', location: parseLocation('Pune, Maharashtra'), serviceCities: ['Pune', 'Mumbai', 'Nashik'], materials: ['E-Waste', 'Metal / Loha'], capacity: '30 MT/day' },
];

function getServiceActors(): ServiceActor[] {
  let authActors: ServiceActor[] = [];
  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    authActors = users
      .filter((user: any) => (user.role === 'COLLECTOR' || user.role === 'RECYCLER') && user.verificationStatus === 'approved')
      .map((user: any) => ({
        id: user.uid,
        name: user.organizationName || user.name,
        role: user.role,
        phone: user.mobile || '',
        location: parseLocation(user.location || ''),
        serviceCities: [parseLocation(user.location || '').city].filter(Boolean),
        materials: user.role === 'RECYCLER' ? ['E-Waste', 'Plastic', 'Metal / Loha', 'Paper / Raddi'] : ['E-Waste', 'Plastic', 'Metal / Loha', 'Paper / Raddi'],
        rating: 4.7,
        capacity: user.role === 'RECYCLER' ? user.details : undefined,
      }));
  } catch {
    authActors = [];
  }

  const byId = new Map<string, ServiceActor>();
  [...SERVICE_ACTORS, ...authActors].forEach((actor) => byId.set(actor.id, actor));
  return Array.from(byId.values());
}

const initialState: WorkflowState = {
  pickupRequests: [],
  wasteLots: [],
  notifications: [],
};

export function subscribeWorkflow(listener: () => void) {
  window.addEventListener(EVENT_NAME, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT_NAME, listener);
    window.removeEventListener('storage', listener);
  };
}

export function readWorkflow(): WorkflowState {
  try {
    const stored = window.localStorage.getItem(STORE_KEY);
    return stored ? JSON.parse(stored) : initialState;
  } catch {
    return initialState;
  }
}

function writeWorkflow(state: WorkflowState) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT_NAME));
}

function mutateWorkflow(updater: (state: WorkflowState) => WorkflowState) {
  const next = updater(readWorkflow());
  writeWorkflow(next);
  return next;
}

export function parseLocation(rawLocation: string): StructuredLocation {
  const raw = (rawLocation || '').trim();
  const lower = raw.toLowerCase();
  const pincode = raw.match(/\b\d{6}\b/)?.[0];
  const cityKey = Object.keys(CITY_COORDS).find((city) => lower.includes(city));
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const city = cityKey ? titleCase(cityKey) : parts[0];
  const known = cityKey ? CITY_COORDS[cityKey] : undefined;
  return {
    raw,
    city,
    state: known?.state || parts[1],
    pincode,
    latitude: known?.latitude,
    longitude: known?.longitude,
  };
}

export function formatLocation(location: StructuredLocation | string) {
  if (typeof location === 'string') return location;
  return location.raw || [location.city, location.state, location.pincode].filter(Boolean).join(', ');
}

export function matchActors(role: 'COLLECTOR' | 'RECYCLER', location: StructuredLocation | string, material?: string) {
  const target = typeof location === 'string' ? parseLocation(location) : location;
  const ranked = getServiceActors()
    .filter((actor) => actor.role === role)
    .filter((actor) => !material || actor.materials.some((m) => normalize(m) === normalize(material)))
    .map((actor) => {
      const distanceKm = distanceBetween(target, actor.location);
      const cityMatch = normalize(actor.location.city) === normalize(target.city) || actor.serviceCities.some((city) => normalize(city) === normalize(target.city));
      const stateMatch = normalize(actor.location.state) === normalize(target.state);
      return { actor, distanceKm, cityMatch, stateMatch };
    })
    .sort((a, b) => {
      if (a.cityMatch !== b.cityMatch) return a.cityMatch ? -1 : 1;
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
      if (a.stateMatch !== b.stateMatch) return a.stateMatch ? -1 : 1;
      return (b.actor.rating || 0) - (a.actor.rating || 0);
    });

  const exact = ranked.filter((item) => item.cityMatch || (item.distanceKm !== undefined && item.distanceKm <= 75));
  return {
    matches: (exact.length ? exact : ranked).map((item) => item.actor),
    usedFallback: exact.length === 0 && ranked.length > 0,
  };
}

export function createPickupRequest(input: {
  citizenId: string;
  citizenName: string;
  material: string;
  quantityKg: number;
  payout: number;
  location: string;
  preferredTime?: string;
  details?: string;
}) {
  const now = new Date().toISOString();
  const location = parseLocation(input.location);
  const matched = matchActors('COLLECTOR', location, input.material).matches.slice(0, 3);
  const requestId = nextId('REQ');
  const request: WorkflowPickupRequest = {
    id: crypto.randomUUID(),
    requestId,
    citizenId: input.citizenId,
    citizenName: input.citizenName,
    material: input.material,
    quantityKg: input.quantityKg,
    payout: input.payout,
    location,
    preferredTime: input.preferredTime || 'Today',
    details: input.details,
    status: 'PENDING_COLLECTOR',
    matchedCollectorIds: matched.map((actor) => actor.id),
    createdAt: now,
    updatedAt: now,
  };

  mutateWorkflow((state) => ({
    ...state,
    pickupRequests: [request, ...state.pickupRequests],
    notifications: [
      ...matched.map((collector) => notification(collector.id, 'COLLECTOR', 'pickup_created', 'notification.pickupCreated.title', 'notification.pickupCreated.message', { requestId, material: input.material, location: formatLocation(location) }, requestId)),
      ...state.notifications,
    ],
  }));

  return request;
}

export function acceptPickupRequest(requestId: string, collectorId: string, collectorName: string) {
  const now = new Date().toISOString();
  let lot: WorkflowWasteLot | undefined;
  mutateWorkflow((state) => {
    const request = state.pickupRequests.find((item) => item.requestId === requestId);
    if (!request || request.status !== 'PENDING_COLLECTOR') return state;
    const lotId = nextId('LOT');
    lot = {
      id: crypto.randomUUID(),
      lotId,
      requestId: request.requestId,
      citizenId: request.citizenId,
      citizenName: request.citizenName,
      collectorId,
      collectorName,
      material: request.material,
      quantityKg: request.quantityKg,
      location: request.location,
      status: 'AWAITING_RECYCLER',
      createdAt: now,
      updatedAt: now,
    };
    return {
      ...state,
      pickupRequests: state.pickupRequests.map((item) =>
        item.requestId === requestId
          ? { ...item, status: 'COLLECTOR_ASSIGNED', collectorId, collectorName, lotId, updatedAt: now }
          : item,
      ),
      wasteLots: [lot, ...state.wasteLots],
      notifications: [
        notification(request.citizenId, 'USER', 'collector_accepted', 'notification.collectorAccepted.title', 'notification.collectorAccepted.message', { requestId, collectorName, lotId }, requestId),
        ...state.notifications,
      ],
    };
  });
  return lot;
}

export function rejectPickupRequest(requestId: string, collectorId: string) {
  mutateWorkflow((state) => ({
    ...state,
    pickupRequests: state.pickupRequests.map((item) =>
      item.requestId === requestId
        ? { ...item, matchedCollectorIds: item.matchedCollectorIds.filter((id) => id !== collectorId), updatedAt: new Date().toISOString() }
        : item,
    ),
  }));
}

export function sendLotToRecycler(lotId: string, recyclerId: string, recyclerName: string) {
  const now = new Date().toISOString();
  mutateWorkflow((state) => ({
    ...state,
    wasteLots: state.wasteLots.map((lot) =>
      lot.lotId === lotId
        ? { ...lot, recyclerId, recyclerName, status: 'RECYCLER_REQUESTED', recyclerRequestSentAt: now, updatedAt: now }
        : lot,
    ),
    notifications: [
      notification(recyclerId, 'RECYCLER', 'lot_requested', 'notification.lotRequested.title', 'notification.lotRequested.message', { lotId, material: state.wasteLots.find((lot) => lot.lotId === lotId)?.material || '', collectorName: state.wasteLots.find((lot) => lot.lotId === lotId)?.collectorName || '' }, lotId),
      ...state.notifications,
    ],
  }));
}

export function recyclerDecision(lotId: string, recyclerId: string, recyclerName: string, accepted: boolean) {
  const now = new Date().toISOString();
  mutateWorkflow((state) => {
    const lot = state.wasteLots.find((item) => item.lotId === lotId);
    if (!lot) return state;
    return {
      ...state,
      wasteLots: state.wasteLots.map((item) =>
        item.lotId === lotId
          ? { ...item, recyclerId, recyclerName, status: accepted ? 'RECYCLER_ACCEPTED' : 'RECYCLER_REJECTED', updatedAt: now }
          : item,
      ),
      notifications: [
        notification(lot.collectorId, 'COLLECTOR', accepted ? 'recycler_accepted' : 'recycler_rejected', accepted ? 'notification.recyclerAccepted.title' : 'notification.recyclerRejected.title', accepted ? 'notification.recyclerAccepted.message' : 'notification.recyclerRejected.message', { lotId, recyclerName }, lotId),
        ...state.notifications,
      ],
    };
  });
}

export function updateLotTransport(lotId: string, input: WorkflowWasteLot['transport']) {
  const now = new Date().toISOString();
  mutateWorkflow((state) => {
    const lot = state.wasteLots.find((item) => item.lotId === lotId);
    if (!lot) return state;
    return {
      ...state,
      wasteLots: state.wasteLots.map((item) =>
        item.lotId === lotId
          ? { ...item, transport: { ...input, dispatchedAt: now }, status: 'TRANSPORT_DISPATCHED', updatedAt: now }
          : item,
      ),
      notifications: [
        notification(lot.collectorId, 'COLLECTOR', 'transport_dispatched', 'notification.transportDispatched.title', 'notification.transportDispatched.message', { lotId, vehicleNumber: input?.vehicleNumber || 'vehicle' }, lotId),
        ...(lot.citizenId ? [notification(lot.citizenId, 'USER', 'pickup_status', 'notification.pickupStatus.title', 'notification.pickupStatus.message', { requestId: lot.requestId || lotId, status: 'Transport Dispatched' }, lotId)] : []),
        ...state.notifications,
      ],
    };
  });
}

export function advanceLotStatus(lotId: string, status: LotStatus) {
  const now = new Date().toISOString();
  mutateWorkflow((state) => {
    const lot = state.wasteLots.find((item) => item.lotId === lotId);
    if (!lot) return state;
    const pickupStatus: PickupStatus | undefined =
      status === 'LOT_COLLECTED' ? 'PICKUP_COMPLETED' : status === 'COMPLETED' ? 'PICKUP_COMPLETED' : undefined;
    return {
      ...state,
      wasteLots: state.wasteLots.map((item) => (item.lotId === lotId ? { ...item, status, updatedAt: now } : item)),
      pickupRequests: pickupStatus
        ? state.pickupRequests.map((request) => (request.requestId === lot.requestId ? { ...request, status: pickupStatus, updatedAt: now } : request))
        : state.pickupRequests,
      notifications: [
        ...(lot.citizenId ? [notification(lot.citizenId, 'USER', 'pickup_status', 'notification.pickupStatus.title', 'notification.pickupStatus.message', { requestId: lot.requestId || lotId, status }, lotId)] : []),
        notification(lot.collectorId, 'COLLECTOR', 'lot_status', 'notification.lotStatus.title', 'notification.lotStatus.message', { lotId, status }, lotId),
        ...state.notifications,
      ],
    };
  });
}

export function notificationsFor(userId: string, role: Role) {
  return readWorkflow().notifications.filter((item) => item.userId === userId || item.role === role);
}

export function markNotificationsRead(userId: string, role: Role) {
  mutateWorkflow((state) => ({
    ...state,
    notifications: state.notifications.map((item) => (item.userId === userId || item.role === role ? { ...item, read: true } : item)),
  }));
}

export function statusLabelKey(status: PickupStatus | LotStatus) {
  return `status.${status}`;
}

export function notificationText(key: string, language: Language, params?: Record<string, string | number>) {
  const templates: Record<Language, Record<string, string>> = {
    EN: {
      'notification.pickupCreated.title': 'New nearby pickup request',
      'notification.pickupCreated.message': '{requestId}: {material} pickup in {location}.',
      'notification.collectorAccepted.title': 'Collector assigned',
      'notification.collectorAccepted.message': '{collectorName} accepted {requestId}. Lot {lotId} created.',
      'notification.lotRequested.title': 'Incoming waste lot request',
      'notification.lotRequested.message': '{collectorName} requested processing for {lotId} ({material}).',
      'notification.recyclerAccepted.title': 'Recycler accepted lot',
      'notification.recyclerAccepted.message': '{recyclerName} accepted {lotId}.',
      'notification.recyclerRejected.title': 'Recycler rejected lot',
      'notification.recyclerRejected.message': '{recyclerName} rejected {lotId}. Please choose another recycler.',
      'notification.transportDispatched.title': 'Transport dispatched',
      'notification.transportDispatched.message': '{vehicleNumber} dispatched for {lotId}.',
      'notification.pickupStatus.title': 'Pickup status updated',
      'notification.pickupStatus.message': '{requestId} is now {status}.',
      'notification.lotStatus.title': 'Lot status updated',
      'notification.lotStatus.message': '{lotId} is now {status}.',
    },
    HI: {
      'notification.pickupCreated.title': 'नया नजदीकी पिकअप अनुरोध',
      'notification.pickupCreated.message': '{requestId}: {location} में {material} पिकअप।',
      'notification.collectorAccepted.title': 'कबाड़ीवाला असाइन हुआ',
      'notification.collectorAccepted.message': '{collectorName} ने {requestId} स्वीकार किया। लॉट {lotId} बना।',
      'notification.lotRequested.title': 'नया वेस्ट लॉट अनुरोध',
      'notification.lotRequested.message': '{collectorName} ने {lotId} ({material}) प्रोसेसिंग के लिए भेजा।',
      'notification.recyclerAccepted.title': 'रीसायकलर ने लॉट स्वीकार किया',
      'notification.recyclerAccepted.message': '{recyclerName} ने {lotId} स्वीकार किया।',
      'notification.recyclerRejected.title': 'रीसायकलर ने लॉट अस्वीकार किया',
      'notification.recyclerRejected.message': '{recyclerName} ने {lotId} अस्वीकार किया। कृपया दूसरा रीसायकलर चुनें।',
      'notification.transportDispatched.title': 'परिवहन भेजा गया',
      'notification.transportDispatched.message': '{lotId} के लिए {vehicleNumber} भेजा गया।',
      'notification.pickupStatus.title': 'पिकअप स्थिति अपडेट हुई',
      'notification.pickupStatus.message': '{requestId} अब {status} है।',
      'notification.lotStatus.title': 'लॉट स्थिति अपडेट हुई',
      'notification.lotStatus.message': '{lotId} अब {status} है।',
    },
    MR: {
      'notification.pickupCreated.title': 'नवीन जवळची पिकअप विनंती',
      'notification.pickupCreated.message': '{requestId}: {location} येथे {material} पिकअप.',
      'notification.collectorAccepted.title': 'कबाडीवाला नेमला',
      'notification.collectorAccepted.message': '{collectorName} यांनी {requestId} स्वीकारले. लॉट {lotId} तयार.',
      'notification.lotRequested.title': 'नवीन कचरा लॉट विनंती',
      'notification.lotRequested.message': '{collectorName} यांनी {lotId} ({material}) प्रक्रियेसाठी पाठवले.',
      'notification.recyclerAccepted.title': 'रिसायकलरने लॉट स्वीकारला',
      'notification.recyclerAccepted.message': '{recyclerName} यांनी {lotId} स्वीकारला.',
      'notification.recyclerRejected.title': 'रिसायकलरने लॉट नाकारला',
      'notification.recyclerRejected.message': '{recyclerName} यांनी {lotId} नाकारला. कृपया दुसरा रिसायकलर निवडा.',
      'notification.transportDispatched.title': 'वाहतूक रवाना झाली',
      'notification.transportDispatched.message': '{lotId} साठी {vehicleNumber} रवाना झाले.',
      'notification.pickupStatus.title': 'पिकअप स्थिती अपडेट झाली',
      'notification.pickupStatus.message': '{requestId} आता {status} आहे.',
      'notification.lotStatus.title': 'लॉट स्थिती अपडेट झाली',
      'notification.lotStatus.message': '{lotId} आता {status} आहे.',
    },
  };
  return interpolate(templates[language]?.[key] || templates.EN[key] || key, params);
}

function notification(userId: string, role: Role, type: string, titleKey: string, messageKey: string, messageParams?: Record<string, string | number>, entityId?: string): AppNotification {
  return {
    id: crypto.randomUUID(),
    userId,
    role,
    type,
    titleKey,
    messageKey,
    messageParams,
    entityId,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function nextId(prefix: 'REQ' | 'LOT') {
  const year = new Date().getFullYear();
  const count = readWorkflow().pickupRequests.length + readWorkflow().wasteLots.length + 124;
  return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
}

function normalize(value?: string) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function distanceBetween(a: StructuredLocation, b: StructuredLocation) {
  if ([a.latitude, a.longitude, b.latitude, b.longitude].some((value) => typeof value !== 'number')) return undefined;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  const dLat = toRad((b.latitude || 0) - (a.latitude || 0));
  const dLon = toRad((b.longitude || 0) - (a.longitude || 0));
  const lat1 = toRad(a.latitude || 0);
  const lat2 = toRad(b.latitude || 0);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function interpolate(template: string, params?: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params?.[key] ?? ''));
}
