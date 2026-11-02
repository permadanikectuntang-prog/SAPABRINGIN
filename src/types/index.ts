/**
 * Types definition for SAPA BRINGIN
 * Sistem Aplikasi Pelayanan Kecamatan Bringin, Kabupaten Semarang
 */

export type InputFieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'dropdown' 
  | 'radio' 
  | 'checkbox' 
  | 'nik' 
  | 'email' 
  | 'phone';

export interface VillageItem {
  id: string;
  name: string;
  code?: string;
  headName?: string; // Kepala Desa / Lurah
  isActive: boolean;
  order: number;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  options?: string[]; // for dropdown, radio, checkbox
  placeholder?: string;
  defaultValue?: string;
  order: number;
  helpText?: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  sheetName: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface ServiceRecord {
  id: string;
  serviceId: string;
  registrationNumber: string; // e.g. "REG-KK/2026/001"
  serviceDate: string; // "YYYY-MM-DD"
  applicantName: string;
  nik: string; // strictly string to preserve leading zero
  data: Record<string, any>;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMINISTRATOR' | 'OPERATOR';
export type UserStatus = 'AKTIF' | 'NONAKTIF';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type ActivityType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'TAMBAH_DATA' 
  | 'EDIT_DATA' 
  | 'HAPUS_DATA' 
  | 'TAMBAH_PELAYANAN' 
  | 'EDIT_PELAYANAN' 
  | 'HAPUS_PELAYANAN' 
  | 'STATUS_PELAYANAN'
  | 'EKSPOR_DATA' 
  | 'IMPOR_EXCEL' 
  | 'SYNC_SHEETS'
  | 'PENGATURAN_UPDATE';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  userName: string;
  userRole: UserRole;
  activityType: ActivityType;
  serviceName?: string;
  dataId?: string;
  description: string;
}

export interface AppSettings {
  appName: string;
  appFullName: string;
  institutionName: string;
  institutionAddress: string;
  logoUrl?: string;
  googleSheetId: string;
  googleAppsScriptUrl: string;
  syncMode: 'auto' | 'manual';
  lastSyncTime: string | null;
  dateFormat: string;
  timezone: string;
  signers: {
    camatName: string;
    camatNip: string;
    kasiName: string;
    kasiNip: string;
  };
}

export interface SyncStatus {
  inProgress: boolean;
  lastSuccess: string | null;
  lastError: string | null;
  message?: string;
}
