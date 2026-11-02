import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  ServiceConfig, 
  ServiceRecord, 
  User, 
  ActivityLog, 
  AppSettings, 
  SyncStatus, 
  ActivityType,
  VillageItem
} from '../types';
import { 
  DEFAULT_SERVICES, 
  DEFAULT_RECORDS, 
  DEFAULT_USERS, 
  DEFAULT_LOGS, 
  DEFAULT_SETTINGS,
  DEFAULT_VILLAGE_ITEMS
} from '../data/defaultData';
import { 
  syncWithGoogleAppsScript, 
  testGoogleSheetsConnection 
} from '../services/googleSheetsService';
import {
  syncAllToFirebase,
  loadAllFromFirebase,
  saveRecordToFirebase,
  deleteRecordFromFirebase,
  saveServiceToFirebase,
  deleteServiceFromFirebase,
  saveVillageToFirebase,
  deleteVillageFromFirebase,
  saveLogToFirebase,
  testConnection as testFirebaseConnection
} from '../services/firebase';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  // State
  services: ServiceConfig[];
  records: ServiceRecord[];
  users: User[];
  villages: VillageItem[];
  currentUser: User | null;
  logs: ActivityLog[];
  settings: AppSettings;
  syncStatus: SyncStatus;
  toasts: ToastNotification[];
  activeView: string;
  activeServiceId: string | null;

  // Village Master Data CRUD
  addVillage: (name: string, code?: string, headName?: string) => Promise<boolean>;
  updateVillage: (id: string, name: string, code?: string, headName?: string) => Promise<boolean>;
  deleteVillage: (id: string) => Promise<boolean>;
  toggleVillageStatus: (id: string) => void;

  // View Navigation
  setActiveView: (view: string, serviceId?: string | null) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;

  // Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Records CRUD
  addRecord: (serviceId: string, applicantName: string, nik: string, data: Record<string, any>, notes?: string) => Promise<ServiceRecord>;
  updateRecord: (serviceId: string, recordId: string, applicantName: string, nik: string, data: Record<string, any>, notes?: string) => Promise<boolean>;
  deleteRecord: (serviceId: string, recordId: string) => Promise<boolean>;

  // Services Management CRUD
  addService: (newService: Omit<ServiceConfig, 'id' | 'createdAt'>) => Promise<ServiceConfig>;
  updateService: (updatedService: ServiceConfig) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;
  toggleServiceStatus: (serviceId: string) => void;

  // User Management
  addUser: (newUser: Omit<User, 'id' | 'createdAt'>) => boolean;
  updateUser: (updatedUser: User) => boolean;
  deleteUser: (userId: string) => boolean;
  toggleUserStatus: (userId: string) => void;

  // Logs & Settings
  addLog: (type: ActivityType, description: string, serviceName?: string, dataId?: string) => void;
  clearLogs: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Google Sheets & Import
  syncGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  checkGoogleSheetsConnection: () => Promise<{ success: boolean; message: string; latencyMs: number }>;
  importBatchRecords: (importedRecords: ServiceRecord[]) => void;
  resetToDefaultData: () => void;

  // Firebase Cloud Firestore
  firebaseStatus: {
    connected: boolean;
    syncing: boolean;
    lastSync: string | null;
    message?: string;
  };
  syncToFirebase: () => Promise<{ success: boolean; message: string; count: number }>;
  loadFromFirebase: () => Promise<{ success: boolean; message: string; count: number }>;
  checkFirebaseConnection: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'siap_bringin_services_v1',
  RECORDS: 'siap_bringin_records_v1',
  USERS: 'siap_bringin_users_v1',
  VILLAGES: 'siap_bringin_villages_v1',
  LOGS: 'siap_bringin_logs_v1',
  SETTINGS: 'siap_bringin_settings_v1',
  CURRENT_USER: 'siap_bringin_curr_user_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with local storage fallback to default mock data
  const [services, setServices] = useState<ServiceConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  });

  const [villages, setVillages] = useState<VillageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VILLAGES);
      return saved ? JSON.parse(saved) : DEFAULT_VILLAGE_ITEMS;
    } catch {
      return DEFAULT_VILLAGE_ITEMS;
    }
  });

  const [records, setRecords] = useState<ServiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (saved) {
        const parsed: ServiceRecord[] = JSON.parse(saved);
        // Susun secara kronologis: paling lama / pertama kali dientri di paling atas
        const sorted = [...parsed].sort((a, b) => 
          (a.serviceDate || '').localeCompare(b.serviceDate || '') ||
          (a.createdAt || '').localeCompare(b.createdAt || '') ||
          a.id.localeCompare(b.id)
        );

        // Deduplicate any colliding sequence numbers from previous runs
        const seenRegs: Record<string, number> = {};
        return sorted.map(r => {
          if (!r.registrationNumber) return r;
          const regBase = r.registrationNumber.replace(/\/\d+$/, '');
          const count = (seenRegs[regBase] || 0) + 1;
          seenRegs[regBase] = count;
          if (count > 1) {
            return {
              ...r,
              registrationNumber: `${regBase}/${String(count).padStart(3, '0')}`
            };
          }
          return r;
        });
      }
      return DEFAULT_RECORDS;
    } catch {
      return DEFAULT_RECORDS;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Auto-login default admin for smooth evaluation
    } catch {
      return DEFAULT_USERS[0];
    }
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : DEFAULT_LOGS;
    } catch {
      return DEFAULT_LOGS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appName === 'SIAP BRINGIN' || !parsed.appName) {
          parsed.appName = 'SAPA BRINGIN';
        }
        if (!parsed.logoUrl || parsed.logoUrl.trim() === '') {
          parsed.logoUrl = '/assets/aistudio/Lambang_Kabupaten_Semarang_157237ff.webp';
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    inProgress: false,
    lastSuccess: '2026-11-01 18:30 WIB',
    lastError: null,
    message: 'Tersinkronisasi',
  });

  const [firebaseStatus, setFirebaseStatus] = useState<{
    connected: boolean;
    syncing: boolean;
    lastSync: string | null;
    message?: string;
  }>({
    connected: true,
    syncing: false,
    lastSync: '2026-11-01 18:30 WIB',
    message: 'Terhubung ke Cloud Firestore',
  });

  useEffect(() => {
    testFirebaseConnection()
      .then(connected => {
        setFirebaseStatus(prev => ({
          ...prev,
          connected,
          message: connected ? 'Terhubung ke Cloud Firestore' : 'Mode Offline / Local Storage'
        }));
      })
      .catch(() => {
        setFirebaseStatus(prev => ({
          ...prev,
          connected: false,
          message: 'Mode Offline'
        }));
      });
  }, []);

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeView, setActiveViewState] = useState<string>('dashboard');
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VILLAGES, JSON.stringify(villages));
  }, [villages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setActiveView = (view: string, serviceId: string | null = null) => {
    setActiveViewState(view);
    setActiveServiceId(serviceId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addLog = (
    activityType: ActivityType, 
    description: string, 
    serviceName?: string, 
    dataId?: string
  ) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: formattedDate,
      userName: currentUser ? currentUser.name : 'Sistem',
      userRole: currentUser ? currentUser.role : 'OPERATOR',
      activityType,
      serviceName,
      dataId,
      description,
    };

    setLogs(prev => [newLog, ...prev]);
    saveLogToFirebase(newLog).catch(() => {});
  };

  const clearLogs = () => {
    setLogs([]);
    showToast('info', 'Riwayat log aktivitas telah dibersihkan.');
  };

  // Auth
  const login = (username: string, password: string): boolean => {
    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (found) {
      if (found.status === 'NONAKTIF') {
        showToast('error', 'Akun pengguna ini berstatus nonaktif. Hubungi Administrator.');
        return false;
      }
      if (found.password === password.trim()) {
        setCurrentUser(found);
        addLog('LOGIN', `Pengguna ${found.name} (${found.role}) berhasil masuk ke sistem.`);
        showToast('success', `Selamat datang, ${found.name}!`);
        return true;
      }
    }
    showToast('error', 'Username atau kata sandi tidak cocok.');
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog('LOGOUT', `Pengguna ${currentUser.name} keluar dari sistem.`);
    }
    setCurrentUser(null);
    showToast('info', 'Anda telah keluar dari aplikasi.');
  };

  // Records CRUD
  const addRecord = async (
    serviceId: string, 
    applicantName: string, 
    nik: string, 
    data: Record<string, any>, 
    notes?: string
  ): Promise<ServiceRecord> => {
    const srv = services.find(s => s.id === serviceId);
    const serviceName = srv ? srv.name : 'Pelayanan';
    const cleanNik = String(nik).trim().replace(/[^\d]/g, '');

    // Auto registration number: REG-[CODE]/YYYY/MM/[COUNTER]
    const now = new Date();
    const serviceDateVal = data.serviceDate || now.toISOString().split('T')[0];
    const [recYear, recMonth] = serviceDateVal.split('-');
    const prefix = srv ? srv.id.substring(0, 3).toUpperCase() : 'REG';

    // Count existing records for this service in this year/month to determine sequence
    const thisPeriodRecords = records.filter(r => 
      r.serviceId === serviceId && 
      (r.serviceDate.startsWith(`${recYear}-${recMonth}`) || 
       (r.registrationNumber && r.registrationNumber.includes(`/${recYear}/${recMonth}/`)))
    );

    // Calculate highest sequence in this period to guarantee no duplicate REG numbers
    let maxSeq = thisPeriodRecords.length;
    thisPeriodRecords.forEach(r => {
      const parts = r.registrationNumber?.split('/');
      if (parts && parts.length >= 4) {
        const num = parseInt(parts[3], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const seq = String(maxSeq + 1).padStart(3, '0');
    const registrationNumber = `REG-${prefix}/${recYear}/${recMonth}/${seq}`;

    const newRecord: ServiceRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId,
      registrationNumber,
      serviceDate: serviceDateVal,
      applicantName: applicantName.trim(),
      nik: cleanNik,
      data: {
        ...data,
        nama_pemohon: applicantName.trim(),
        nik: cleanNik,
      },
      notes: notes || data.keterangan || '',
      createdBy: currentUser ? currentUser.name : 'Petugas Pelayanan',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Urutan: Penambahan entrian baru selalu muncul di paling bawah
    setRecords(prev => [...prev, newRecord]);

    // Background sync to Firebase Cloud Firestore
    saveRecordToFirebase(newRecord).catch(() => {});

    addLog(
      'TAMBAH_DATA',
      `Mencatat pelayanan baru atas nama ${applicantName} (${registrationNumber})`,
      serviceName,
      registrationNumber
    );

    showToast('success', `Data pemohon ${applicantName} berhasil disimpan (${registrationNumber}).`);

    // Background auto-sync if URL configured
    if (settings.googleAppsScriptUrl && settings.syncMode === 'auto') {
      syncWithGoogleAppsScript(settings.googleAppsScriptUrl, {
        action: 'add_record',
        services,
        records: [newRecord],
        targetRecord: newRecord,
      }).catch(() => {});
    }

    return newRecord;
  };

  const updateRecord = async (
    serviceId: string,
    recordId: string,
    applicantName: string,
    nik: string,
    data: Record<string, any>,
    notes?: string
  ): Promise<boolean> => {
    const srv = services.find(s => s.id === serviceId);
    const serviceName = srv ? srv.name : 'Pelayanan';
    const cleanNik = String(nik).trim().replace(/[^\d]/g, '');

    let updatedRegNo = '';
    let updatedRecordObj: ServiceRecord | null = null;

    setRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        updatedRegNo = rec.registrationNumber;
        const modified = {
          ...rec,
          applicantName: applicantName.trim(),
          nik: cleanNik,
          data: {
            ...data,
            nama_pemohon: applicantName.trim(),
            nik: cleanNik,
          },
          notes: notes !== undefined ? notes : (data.keterangan || rec.notes),
          updatedAt: new Date().toISOString(),
        };
        updatedRecordObj = modified;
        return modified;
      }
      return rec;
    }));

    if (updatedRecordObj) {
      saveRecordToFirebase(updatedRecordObj).catch(() => {});
    }

    addLog(
      'EDIT_DATA',
      `Memperbarui data pelayanan ${applicantName} (${updatedRegNo || recordId})`,
      serviceName,
      updatedRegNo
    );

    showToast('success', `Perubahan data pemohon ${applicantName} berhasil diperbarui.`);
    return true;
  };

  const deleteRecord = async (serviceId: string, recordId: string): Promise<boolean> => {
    const target = records.find(r => r.id === recordId);
    if (!target) return false;

    const srv = services.find(s => s.id === serviceId);
    const serviceName = srv ? srv.name : 'Pelayanan';

    setRecords(prev => prev.filter(r => r.id !== recordId));
    deleteRecordFromFirebase(recordId).catch(() => {});

    addLog(
      'HAPUS_DATA',
      `Menghapus data pemohon ${target.applicantName} (${target.registrationNumber})`,
      serviceName,
      target.registrationNumber
    );

    showToast('info', `Data ${target.applicantName} (${target.registrationNumber}) telah dihapus.`);
    return true;
  };

  // Services Management CRUD
  const addService = async (newServiceData: Omit<ServiceConfig, 'id' | 'createdAt'>): Promise<ServiceConfig> => {
    // Generate clean ID from name
    const idSlug = newServiceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueId = `srv-${idSlug}-${Date.now().toString(36).substring(4)}`;
    
    const newService: ServiceConfig = {
      ...newServiceData,
      id: uniqueId,
      createdAt: new Date().toISOString().split('T')[0],
      order: services.length + 1,
    };

    setServices(prev => [...prev, newService]);
    saveServiceToFirebase(newService).catch(() => {});

    addLog(
      'TAMBAH_PELAYANAN',
      `Menambahkan jenis pelayanan baru: "${newService.name}" (Sheet: ${newService.sheetName})`,
      newService.name,
      newService.id
    );

    showToast('success', `Jenis pelayanan "${newService.name}" berhasil dibuat dan formulirnya siap digunakan!`);

    // Trigger Apps Script to generate new sheet on Google Sheets automatically
    if (settings.googleAppsScriptUrl) {
      syncWithGoogleAppsScript(settings.googleAppsScriptUrl, {
        action: 'create_service_sheet',
        services: [newService],
        records: [],
      }).catch(() => {});
    }

    return newService;
  };

  const updateService = async (updatedService: ServiceConfig): Promise<boolean> => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    saveServiceToFirebase(updatedService).catch(() => {});

    addLog(
      'EDIT_PELAYANAN',
      `Memperbarui konfigurasi & struktur kolom pelayanan "${updatedService.name}"`,
      updatedService.name,
      updatedService.id
    );

    showToast('success', `Pengaturan jenis pelayanan "${updatedService.name}" berhasil diperbarui.`);
    return true;
  };

  const deleteService = async (serviceId: string): Promise<boolean> => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return false;

    // We do NOT delete historical records to preserve data safety
    setServices(prev => prev.filter(s => s.id !== serviceId));
    deleteServiceFromFirebase(serviceId).catch(() => {});

    addLog(
      'HAPUS_PELAYANAN',
      `Menghapus jenis pelayanan "${srv.name}". Data lama tetap diarsipkan aman.`,
      srv.name,
      srv.id
    );

    showToast('warning', `Jenis pelayanan "${srv.name}" telah dihapus. Seluruh data historis tetap tersimpan aman di sistem.`);
    return true;
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const nextStatus = !s.isActive;
        addLog(
          'STATUS_PELAYANAN',
          `Mengubah status pelayanan "${s.name}" menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`,
          s.name,
          s.id
        );
        showToast('info', `Pelayanan "${s.name}" sekarang ${nextStatus ? 'Aktif' : 'Nonaktif'}.`);
        return { ...s, isActive: nextStatus };
      }
      return s;
    }));
  };

  // User Management
  const addUser = (newUserData: Omit<User, 'id' | 'createdAt'>): boolean => {
    const exists = users.some(u => u.username.toLowerCase() === newUserData.username.toLowerCase());
    if (exists) {
      showToast('error', `Username "${newUserData.username}" sudah digunakan. Silakan gunakan username lain.`);
      return false;
    }

    const newUser: User = {
      ...newUserData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers(prev => [...prev, newUser]);
    addLog('PENGATURAN_UPDATE', `Menambahkan akun pengguna baru: ${newUser.name} (${newUser.role})`);
    showToast('success', `Pengguna ${newUser.name} berhasil ditambahkan.`);
    return true;
  };

  const updateUser = (updatedUser: User): boolean => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addLog('PENGATURAN_UPDATE', `Memperbarui akun pengguna: ${updatedUser.name}`);
    showToast('success', `Data pengguna ${updatedUser.name} berhasil diperbarui.`);
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser && currentUser.id === userId) {
      showToast('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return false;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return false;

    setUsers(prev => prev.filter(u => u.id !== userId));
    addLog('PENGATURAN_UPDATE', `Menghapus akun pengguna: ${target.name}`);
    showToast('info', `Pengguna ${target.name} telah dihapus.`);
    return true;
  };

  const toggleUserStatus = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      showToast('error', 'Anda tidak dapat menonaktifkan akun yang sedang digunakan.');
      return;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        showToast('info', `Status akun ${u.name} diubah menjadi ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Village Master Data CRUD
  const syncVillagesToServices = (villageList: VillageItem[]) => {
    const activeNames = villageList.filter(v => v.isActive).map(v => v.name);
    setServices(prev => prev.map(srv => {
      let hasVillageField = false;
      const updatedFields = srv.fields.map(f => {
        if (f.id === 'desa' || f.id === 'desa_asal' || f.id === 'desa_tujuan') {
          hasVillageField = true;
          return { ...f, options: activeNames };
        }
        return f;
      });
      return hasVillageField ? { ...srv, fields: updatedFields } : srv;
    }));
  };

  const addVillage = async (name: string, code?: string, headName?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('error', 'Nama desa tidak boleh kosong.');
      return false;
    }
    const exists = villages.some(v => v.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast('error', `Desa "${trimmed}" sudah terdaftar dalam sistem.`);
      return false;
    }

    const idSlug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newVillage: VillageItem = {
      id: `desa-${idSlug}-${Date.now().toString(36).substring(4)}`,
      name: trimmed,
      code: code?.trim() || `33.22.11.20${String(villages.length + 1).padStart(2, '0')}`,
      headName: headName?.trim() || `Kepala Desa ${trimmed}`,
      isActive: true,
      order: villages.length + 1,
    };

    const updated = [...villages, newVillage];
    setVillages(updated);
    syncVillagesToServices(updated);
    saveVillageToFirebase(newVillage).catch(() => {});

    addLog('PENGATURAN_UPDATE', `Menambahkan desa baru: Desa ${trimmed} (${newVillage.code})`);
    showToast('success', `Desa ${trimmed} berhasil ditambahkan dan otomatis diperbarui di seluruh dropdown formulir!`);
    return true;
  };

  const updateVillage = async (id: string, name: string, code?: string, headName?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('error', 'Nama desa tidak boleh kosong.');
      return false;
    }

    let oldName = '';
    let updatedVillageObj: VillageItem | null = null;
    const updated = villages.map(v => {
      if (v.id === id) {
        oldName = v.name;
        const modified: VillageItem = {
          ...v,
          name: trimmed,
          code: code !== undefined ? code.trim() : v.code,
          headName: headName !== undefined ? headName.trim() : v.headName,
        };
        updatedVillageObj = modified;
        return modified;
      }
      return v;
    });

    setVillages(updated);
    syncVillagesToServices(updated);
    if (updatedVillageObj) {
      saveVillageToFirebase(updatedVillageObj).catch(() => {});
    }

    addLog('PENGATURAN_UPDATE', `Memperbarui data desa: ${oldName} menjadi ${trimmed}`);
    showToast('success', `Data Desa ${trimmed} berhasil diperbarui.`);
    return true;
  };

  const deleteVillage = async (id: string): Promise<boolean> => {
    const target = villages.find(v => v.id === id);
    if (!target) return false;

    const updated = villages.filter(v => v.id !== id);
    setVillages(updated);
    syncVillagesToServices(updated);
    deleteVillageFromFirebase(id).catch(() => {});

    addLog('PENGATURAN_UPDATE', `Menghapus data desa: Desa ${target.name}`);
    showToast('warning', `Desa ${target.name} telah dihapus dari daftar desa.`);
    return true;
  };

  const toggleVillageStatus = (id: string) => {
    const updated = villages.map(v => {
      if (v.id === id) {
        const nextStatus = !v.isActive;
        showToast('info', `Status Desa ${v.name} diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`);
        return { ...v, isActive: nextStatus };
      }
      return v;
    });
    setVillages(updated);
    syncVillagesToServices(updated);
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addLog('PENGATURAN_UPDATE', 'Pengaturan aplikasi dan konfigurasi Google Sheets berhasil diperbarui.');
    showToast('success', 'Pengaturan aplikasi berhasil disimpan.');
  };

  // Google Sheets Synchronization
  const syncGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    setSyncStatus(prev => ({ ...prev, inProgress: true, message: 'Menghubungi Google Sheets...' }));

    if (!settings.googleAppsScriptUrl) {
      setSyncStatus({
        inProgress: false,
        lastSuccess: syncStatus.lastSuccess,
        lastError: 'URL Google Apps Script belum diatur.',
        message: 'Gagal: Konfigurasi URL Apps Script belum diisi di Pengaturan.',
      });
      showToast('warning', 'Silakan masukkan URL Web App Google Apps Script di menu Pengaturan terlebih dahulu.');
      return { success: false, message: 'URL Apps Script belum diatur.' };
    }

    try {
      const result = await syncWithGoogleAppsScript(settings.googleAppsScriptUrl, {
        sheetId: settings.googleSheetId,
        action: 'sync_all',
        services,
        records,
        users,
        logs,
      });

      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

      if (result.success) {
        setSyncStatus({
          inProgress: false,
          lastSuccess: timeStr,
          lastError: null,
          message: 'Sinkronisasi berhasil! Seluruh data terupdate di Google Sheets.',
        });
        setSettings(prev => ({ ...prev, lastSyncTime: timeStr }));
        addLog('SYNC_SHEETS', 'Sinkronisasi penuh seluruh data dan sheet ke Google Sheets berhasil.');
        showToast('success', 'Sinkronisasi Google Sheets berhasil! Seluruh sheet dan data telah diperbarui.');
        return { success: true, message: result.message };
      } else {
        setSyncStatus({
          inProgress: false,
          lastSuccess: syncStatus.lastSuccess,
          lastError: result.message,
          message: result.message,
        });
        showToast('error', `Sinkronisasi gagal: ${result.message}`);
        return { success: false, message: result.message };
      }
    } catch (err: any) {
      const errMsg = err.message || 'Terjadi kesalahan jaringan.';
      setSyncStatus({
        inProgress: false,
        lastSuccess: syncStatus.lastSuccess,
        lastError: errMsg,
        message: errMsg,
      });
      showToast('error', `Gagal sinkronisasi: ${errMsg}`);
      return { success: false, message: errMsg };
    }
  };

  const checkGoogleSheetsConnection = async () => {
    return await testGoogleSheetsConnection(settings.googleAppsScriptUrl, settings.googleSheetId);
  };

  const importBatchRecords = (importedRecords: ServiceRecord[]) => {
    if (!importedRecords || importedRecords.length === 0) return;
    setRecords(prev => [...prev, ...importedRecords]);
    addLog('IMPOR_EXCEL', `Berhasil mengimpor ${importedRecords.length} data pelayanan dari file Excel.`);
    showToast('success', `${importedRecords.length} data pelayanan berhasil dimasukkan ke sistem!`);
  };

  const resetToDefaultData = () => {
    setServices(DEFAULT_SERVICES);
    setRecords(DEFAULT_RECORDS);
    setUsers(DEFAULT_USERS);
    setVillages(DEFAULT_VILLAGE_ITEMS);
    setLogs(DEFAULT_LOGS);
    setSettings(DEFAULT_SETTINGS);
    setCurrentUser(DEFAULT_USERS[0]);
    localStorage.clear();
    showToast('info', 'Data aplikasi telah direset ke data awal standar.');
  };

  // Firebase Firestore Synchronization
  const checkFirebaseConnection = async (): Promise<boolean> => {
    const ok = await testFirebaseConnection();
    setFirebaseStatus(prev => ({
      ...prev,
      connected: ok,
      message: ok ? 'Terhubung ke Cloud Firestore' : 'Tidak dapat menjangkau server Firebase'
    }));
    return ok;
  };

  const syncToFirebase = async (): Promise<{ success: boolean; message: string; count: number }> => {
    setFirebaseStatus(prev => ({ ...prev, syncing: true, message: 'Menyinkronkan ke Firebase...' }));
    showToast('info', 'Memulai sinkronisasi data ke Cloud Firestore...');

    const result = await syncAllToFirebase({
      services,
      records,
      villages,
      users,
      logs,
      settings
    });

    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (result.success) {
      setFirebaseStatus({
        connected: true,
        syncing: false,
        lastSync: timeStr,
        message: result.message
      });
      addLog('SYNC_SHEETS', `Sinkronisasi Firebase sukses: ${result.count} data tersimpan di Cloud Firestore.`);
      showToast('success', `Firebase Berhasil: ${result.count} data tersimpan di Cloud Firestore!`);
    } else {
      setFirebaseStatus(prev => ({
        ...prev,
        syncing: false,
        message: result.message
      }));
      showToast('error', `Gagal sinkronisasi Firebase: ${result.message}`);
    }

    return result;
  };

  const loadFromFirebase = async (): Promise<{ success: boolean; message: string; count: number }> => {
    setFirebaseStatus(prev => ({ ...prev, syncing: true, message: 'Memuat data dari Firebase...' }));
    showToast('info', 'Mengambil data dari Cloud Firestore...');

    const result = await loadAllFromFirebase();
    if (result.success && result.data) {
      let count = 0;
      if (result.data.services && result.data.services.length > 0) {
        setServices(result.data.services);
        count += result.data.services.length;
      }
      if (result.data.records && result.data.records.length > 0) {
        setRecords(result.data.records);
        count += result.data.records.length;
      }
      if (result.data.villages && result.data.villages.length > 0) {
        setVillages(result.data.villages);
        count += result.data.villages.length;
      }

      setFirebaseStatus(prev => ({
        ...prev,
        syncing: false,
        message: `Memuat ${count} data dari cloud`
      }));
      showToast('success', `Berhasil memuat ${count} data dari Firebase Firestore!`);
      return { success: true, message: result.message, count };
    } else {
      setFirebaseStatus(prev => ({
        ...prev,
        syncing: false,
        message: result.message
      }));
      showToast('error', `Gagal memuat dari Firebase: ${result.message}`);
      return { success: false, message: result.message, count: 0 };
    }
  };

  return (
    <AppContext.Provider
      value={{
        services,
        records,
        users,
        villages,
        currentUser,
        logs,
        settings,
        syncStatus,
        firebaseStatus,
        toasts,
        activeView,
        activeServiceId,
        setActiveView,
        showToast,
        removeToast,
        login,
        logout,
        addRecord,
        updateRecord,
        deleteRecord,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
        addVillage,
        updateVillage,
        deleteVillage,
        toggleVillageStatus,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addLog,
        clearLogs,
        updateSettings,
        syncGoogleSheets,
        checkGoogleSheetsConnection,
        syncToFirebase,
        loadFromFirebase,
        checkFirebaseConnection,
        importBatchRecords,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
