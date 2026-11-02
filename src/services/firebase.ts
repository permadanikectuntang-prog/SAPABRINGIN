import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ServiceConfig, ServiceRecord, VillageItem, User, ActivityLog, AppSettings } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot (per skill requirement)
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    return false;
  }
}

// Execute connection test
testConnection();

// Push all local data into Cloud Firestore
export async function syncAllToFirebase(payload: {
  services: ServiceConfig[];
  records: ServiceRecord[];
  villages: VillageItem[];
  users: User[];
  logs: ActivityLog[];
  settings: AppSettings;
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let count = 0;

    // 1. Sync Services
    for (const service of payload.services) {
      const path = `services/${service.id}`;
      try {
        await setDoc(doc(db, 'services', service.id), {
          id: service.id,
          name: service.name,
          sheetName: service.sheetName,
          icon: service.icon,
          order: service.order,
          isActive: service.isActive,
          createdAt: service.createdAt,
          description: service.description || '',
          fields: service.fields || []
        });
        count++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 2. Sync Records
    for (const record of payload.records) {
      const path = `records/${record.id}`;
      try {
        await setDoc(doc(db, 'records', record.id), {
          id: record.id,
          serviceId: record.serviceId,
          registrationNumber: record.registrationNumber,
          serviceDate: record.serviceDate,
          applicantName: record.applicantName,
          nik: String(record.nik),
          data: record.data || {},
          notes: record.notes || '',
          createdBy: record.createdBy,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        });
        count++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 3. Sync Villages
    for (const village of payload.villages) {
      const path = `villages/${village.id}`;
      try {
        await setDoc(doc(db, 'villages', village.id), {
          id: village.id,
          name: village.name,
          code: village.code || '',
          headName: village.headName || '',
          isActive: village.isActive,
          order: village.order
        });
        count++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 4. Sync Settings
    const settingsPath = 'settings/general';
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        appName: payload.settings.appName,
        appFullName: payload.settings.appFullName,
        institutionName: payload.settings.institutionName,
        institutionAddress: payload.settings.institutionAddress,
        googleSheetId: payload.settings.googleSheetId,
        googleAppsScriptUrl: payload.settings.googleAppsScriptUrl,
        syncMode: payload.settings.syncMode,
        lastSyncTime: payload.settings.lastSyncTime || new Date().toISOString(),
        dateFormat: payload.settings.dateFormat,
        timezone: payload.settings.timezone,
        signers: payload.settings.signers || {}
      });
      count++;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, settingsPath);
    }

    // 5. Sync Users
    for (const u of payload.users) {
      const path = `users/${u.id}`;
      try {
        await setDoc(doc(db, 'users', u.id), {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt
        });
        count++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 6. Sync recent Logs
    const recentLogs = payload.logs.slice(0, 50);
    for (const l of recentLogs) {
      const path = `logs/${l.id}`;
      try {
        await setDoc(doc(db, 'logs', l.id), {
          id: l.id,
          timestamp: l.timestamp,
          userName: l.userName,
          userRole: l.userRole,
          activityType: l.activityType,
          serviceName: l.serviceName || '',
          dataId: l.dataId || '',
          description: l.description
        });
        count++;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    return {
      success: true,
      message: `Berhasil menyinkronkan ${count} item ke Firebase Cloud Firestore.`,
      count
    };
  } catch (error: any) {
    console.error('Firebase syncAll error:', error);
    return {
      success: false,
      message: error?.message || 'Gagal sinkronisasi data ke Firebase Firestore.',
      count: 0
    };
  }
}

// Pull data from Cloud Firestore
export async function loadAllFromFirebase(): Promise<{
  success: boolean;
  data?: {
    services?: ServiceConfig[];
    records?: ServiceRecord[];
    villages?: VillageItem[];
    users?: User[];
    settings?: Partial<AppSettings>;
  };
  message: string;
}> {
  try {
    const servicesSnap = await getDocs(collection(db, 'services'));
    const recordsSnap = await getDocs(collection(db, 'records'));
    const villagesSnap = await getDocs(collection(db, 'villages'));

    const services: ServiceConfig[] = [];
    servicesSnap.forEach(d => services.push(d.data() as ServiceConfig));

    const records: ServiceRecord[] = [];
    recordsSnap.forEach(d => records.push(d.data() as ServiceRecord));

    const villages: VillageItem[] = [];
    villagesSnap.forEach(d => villages.push(d.data() as VillageItem));

    return {
      success: true,
      data: {
        services: services.length > 0 ? services : undefined,
        records: records.length > 0 ? records : undefined,
        villages: villages.length > 0 ? villages : undefined
      },
      message: `Berhasil memuat data dari Firebase: ${records.length} rekaman, ${services.length} pelayanan, ${villages.length} desa.`
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, 'collections');
    return {
      success: false,
      message: err?.message || 'Gagal mengambil data dari Firebase.'
    };
  }
}

// Single item mutations helper
export async function saveRecordToFirebase(record: ServiceRecord): Promise<void> {
  const path = `records/${record.id}`;
  try {
    await setDoc(doc(db, 'records', record.id), {
      ...record,
      nik: String(record.nik)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteRecordFromFirebase(recordId: string): Promise<void> {
  const path = `records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'records', recordId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveServiceToFirebase(service: ServiceConfig): Promise<void> {
  const path = `services/${service.id}`;
  try {
    await setDoc(doc(db, 'services', service.id), service);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteServiceFromFirebase(serviceId: string): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveVillageToFirebase(village: VillageItem): Promise<void> {
  const path = `villages/${village.id}`;
  try {
    await setDoc(doc(db, 'villages', village.id), village);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteVillageFromFirebase(villageId: string): Promise<void> {
  const path = `villages/${villageId}`;
  try {
    await deleteDoc(doc(db, 'villages', villageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveLogToFirebase(log: ActivityLog): Promise<void> {
  const path = `logs/${log.id}`;
  try {
    await setDoc(doc(db, 'logs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
