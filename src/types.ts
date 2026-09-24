export type Role = 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
export type Language = 'EN' | 'HI' | 'MR';

export interface StructuredLocation {
  raw: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export type PickupStatus =
  | 'PENDING_COLLECTOR'
  | 'ACCEPTED_BY_COLLECTOR'
  | 'COLLECTOR_ASSIGNED'
  | 'PICKUP_IN_PROGRESS'
  | 'PICKUP_COMPLETED'
  | 'REJECTED';

export type LotStatus =
  | 'AWAITING_RECYCLER'
  | 'RECYCLER_REQUESTED'
  | 'RECYCLER_ACCEPTED'
  | 'RECYCLER_REJECTED'
  | 'TRANSPORT_ASSIGNED'
  | 'TRANSPORT_DISPATCHED'
  | 'PICKUP_IN_PROGRESS'
  | 'LOT_COLLECTED'
  | 'RECEIVED_BY_RECYCLER'
  | 'PROCESSING'
  | 'COMPLETED';

export interface AppNotification {
  id: string;
  userId: string;
  role: Role;
  type: string;
  titleKey: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  createdAt: string;
  read: boolean;
  entityId?: string;
}

export interface WorkflowPickupRequest {
  id: string;
  requestId: string;
  citizenId: string;
  citizenName: string;
  material: string;
  quantityKg: number;
  payout: number;
  location: StructuredLocation;
  preferredTime: string;
  details?: string;
  status: PickupStatus;
  matchedCollectorIds: string[];
  collectorId?: string;
  collectorName?: string;
  lotId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowWasteLot {
  id: string;
  lotId: string;
  requestId?: string;
  citizenId?: string;
  citizenName?: string;
  collectorId: string;
  collectorName: string;
  recyclerId?: string;
  recyclerName?: string;
  material: string;
  quantityKg: number;
  location: StructuredLocation;
  status: LotStatus;
  recyclerRequestSentAt?: string;
  transport?: {
    vehicleNumber?: string;
    driverName?: string;
    expectedPickupTime?: string;
    dispatchedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceActor {
  id: string;
  name: string;
  role: 'COLLECTOR' | 'RECYCLER';
  phone: string;
  location: StructuredLocation;
  serviceCities: string[];
  materials: string[];
  rating?: number;
  capacity?: string;
}

export interface ScrapCategory {
  id: string;
  name: string;
  hindiName: string;
  marathiName: string;
  rate: number;
  icon: string;
  caution?: boolean;
  desc: string;
}

export interface PickupRequest {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  material: string;
  weight: string;
  payout: number;
  avatar: string;
  phone: string;
  caution?: boolean;
}

export interface ManifestItem {
  lotId: string;
  time: string;
  citizen: string;
  location: string;
  collector: string;
  collectorId: string;
  hub: string;
  hubArea: string;
  material: string;
  weight: string;
  payout: string;
  payoutType: string;
  status: 'Completed' | 'In Facility Intake' | 'Pending';
  certId: string;
}

export interface LoadingOverlayConfig {
  isLoading: boolean;
  title: string;
  subtitle?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint?: string;
  payloadSummary?: string;
}

export interface QueuedOfflineRequest {
  id: string;
  title: string;
  method: 'POST' | 'PUT';
  endpoint: string;
  payload: any;
  timestamp: number;
  screen: 'USER' | 'COLLECTOR' | 'RECYCLER';
  description: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount?: number;
}

export interface NetworkConnectivityState {
  isConnected: boolean;
  isSimulatedOffline: boolean;
  type: 'wifi' | 'cellular' | 'none';
  pendingQueue: QueuedOfflineRequest[];
}
