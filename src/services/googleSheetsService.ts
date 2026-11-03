/**
 * Google Sheets Integration Service for SAPA BRINGIN
 * Handles communication with Google Sheets via Google Apps Script Web App / API.
 */

import { ServiceConfig, ServiceRecord, User, ActivityLog } from '../types';

export interface GoogleSheetsSyncPayload {
  sheetId?: string;
  action: 'sync_all' | 'create_service_sheet' | 'add_record' | 'update_record' | 'delete_record' | 'test';
  services: ServiceConfig[];
  records: ServiceRecord[];
  users?: User[];
  logs?: ActivityLog[];
  targetServiceId?: string;
  targetRecord?: ServiceRecord;
}

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  data?: any;
}

/**
 * Tests connection to Google Apps Script endpoint or Google Sheet
 */
export async function testGoogleSheetsConnection(
  appsScriptUrl: string,
  sheetId: string
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();
  
  if (!appsScriptUrl || appsScriptUrl.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi. Klik tombol kuning "Kode Apps Script & Panduan" di atas untuk menyalin skrip, pasang di Google Spreadsheet Anda, lalu tempelkan URL Web App (berakhiran /exec) di sini.',
      latencyMs: 0,
    };
  }

  const cleanUrl = appsScriptUrl.trim();

  // Detect placeholder/dummy URL
  if (cleanUrl.includes('EXAMPLE') || cleanUrl.includes('SIAP_BRINGIN_EXAM') || cleanUrl.includes('AKfycbzSIAP')) {
    return {
      success: false,
      message: 'Penyebab: Kolom URL saat ini masih terisi teks contoh bawaan (...EXAMPLE_KEY...). Solusi: Hapus teks tersebut, lalu masukkan URL Web App asli dari menu "Deploy > New deployment" di Google Spreadsheet Anda.',
      latencyMs: 0,
    };
  }

  if (!cleanUrl.startsWith('https://script.google.com/macros/s/') || !cleanUrl.endsWith('/exec')) {
    return {
      success: false,
      message: 'Format URL tidak sesuai. URL Google Apps Script yang valid harus berawalan "https://script.google.com/macros/s/..." dan berakhiran "/exec".',
      latencyMs: 0,
    };
  }

  try {
    const url = new URL(cleanUrl);
    url.searchParams.set('action', 'test');
    if (sheetId) {
      url.searchParams.set('sheetId', sheetId.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      const resJson = await response.json().catch(() => ({ success: true, message: 'Endpoint aktif' }));
      return {
        success: true,
        message: `Koneksi Google Sheets berhasil! Respon diterima dalam ${latency}ms. (${resJson.message || 'Database siap digunakan'})`,
        latencyMs: latency,
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: `URL Web App tidak ditemukan (HTTP 404). Pastikan Web App sudah di-deploy dengan benar dan berakhiran '/exec'.`,
        latencyMs: latency,
      };
    } else {
      return {
        success: false,
        message: `Server Google Apps Script merespon dengan status ${response.status}: ${response.statusText}`,
        latencyMs: latency,
      };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      message: `Gagal menghubungi endpoint: ${error.message || 'Koneksi ditolak'}. Pastikan saat Deployment di Apps Script, opsi 'Who has access' (Akses) dipilih 'Anyone' (Siapa saja).`,
      latencyMs: latency,
    };
  }
}

/**
 * Sends a sync payload to Google Apps Script
 */
export async function syncWithGoogleAppsScript(
  appsScriptUrl: string,
  payload: GoogleSheetsSyncPayload
): Promise<GoogleSheetsSyncResult> {
  const timestamp = new Date().toISOString();

  if (!appsScriptUrl || appsScriptUrl.trim() === '') {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di Pengaturan.',
      timestamp,
    };
  }

  const cleanUrl = appsScriptUrl.trim();

  // Detect placeholder/dummy URL
  if (cleanUrl.includes('EXAMPLE') || cleanUrl.includes('SIAP_BRINGIN_EXAM') || cleanUrl.includes('AKfycbzSIAP')) {
    return {
      success: false,
      message: 'URL Google Apps Script masih menggunakan nilai contoh (placeholder). Silakan deploy Apps Script di Google Sheets Anda terlebih dahulu untuk mendapatkan URL deployment asli.',
      timestamp,
    };
  }

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script handles text/plain without OPTIONS preflight
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json().catch(() => ({ success: true, message: 'Data berhasil disinkronkan ke Google Sheets' }));
      return {
        success: true,
        message: result.message || 'Sinkronisasi dengan Google Sheets berhasil!',
        timestamp,
        data: result,
      };
    } else {
      return {
        success: false,
        message: `HTTP Error ${response.status} dari Google Apps Script: ${response.statusText}`,
        timestamp,
      };
    }
  } catch (err: any) {
    // Attempt no-cors fallback if direct CORS fails due to Google redirect
    try {
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: 'Permintaan sinkronisasi telah dikirim ke Google Apps Script (Mode no-cors). Periksa lembar Google Sheets Anda dalam beberapa saat.',
        timestamp,
      };
    } catch {
      return {
        success: false,
        message: `Gagal sinkronisasi: ${err.message || 'Koneksi terputus'}. Pastikan URL Web App valid dan pengaturan akses 'Anyone' (Siapa saja).`,
        timestamp,
      };
    }
  }
}

/**
 * Generates the official ready-to-deploy Google Apps Script Code
 * that users can copy-paste into Google Sheets -> Extensions -> Apps Script
 */
export function generateAppsScriptCode(spreadsheetId: string = ''): string {
  return `/**
 * ======================================================================
 * BACKEND GOOGLE APPS SCRIPT - SAPA BRINGIN
 * SISTEM APLIKASI PELAYANAN KECAMATAN BRINGIN, KABUPATEN SEMARANG
 * ======================================================================
 * 
 * PETUNJUK PEMASANGAN:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus seluruh isi kode lama dan tempel (paste) seluruh skrip ini.
 * 4. Klik tombol 'Save' (ikon disket).
 * 5. Klik 'Deploy' (Terapkan) > 'New deployment' (Penerapan baru).
 * 6. Pilih jenis: 'Web app' (Aplikasi web).
 * 7. Isi keterangan: 'SAPA Bringin v1'.
 * 8. Execute as: 'Me' (Email Anda).
 * 9. Who has access: 'Anyone' (Siapa saja - penting agar web app bisa kirim data).
 * 10. Klik 'Deploy', izinkan otorisasi akun Google Anda.
 * 11. Salin 'Web app URL' dan tempel ke Pengaturan SAPA BRINGIN.
 */

const TARGET_SPREADSHEET_ID = "${spreadsheetId || ''}";

function getSpreadsheet() {
  if (TARGET_SPREADSHEET_ID && TARGET_SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : "test";
  
  if (action === "test") {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "SAPA BRINGIN Google Apps Script Backend aktif dan terhubung!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "get_all") {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      sheets: sheetNames
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: "online"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    let data;
    
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No POST body provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = data.action;

    // 1. SINKRONISASI SELURUH DATA & INISIALISASI STRUKTUR SHEET
    if (action === "sync_all") {
      initCoreSheets(ss, data.services, data.users, data.logs);
      
      // Sinkronkan data tiap pelayanan ke sheet masing-masing
      if (data.services && data.records) {
        data.services.forEach(function(service) {
          syncServiceSheet(ss, service, data.records.filter(r => r.serviceId === service.id));
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Seluruh sheet dan data berhasil disinkronkan ke Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. BUAT ATAU PERBARUI SHEET PELAYANAN BARU
    if (action === "create_service_sheet") {
      const service = data.targetService || (data.services && data.services[0]);
      if (service) {
        const records = (data.records || []).filter(r => r.serviceId === service.id);
        syncServiceSheet(ss, service, records);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Sheet pelayanan '" + service.sheetName + "' berhasil dibuat/diperbarui!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. TAMBAH RECORD DATA PELAYANAN
    if (action === "add_record" && data.targetRecord) {
      const rec = data.targetRecord;
      const srv = data.services ? data.services.find(s => s.id === rec.serviceId) : null;
      if (srv) {
        let sheet = ss.getSheetByName(srv.sheetName);
        if (!sheet) {
          syncServiceSheet(ss, srv, [rec]);
        } else {
          appendRecordRow(sheet, srv, rec);
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Data pemohon berhasil dicatat ke Google Sheets!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Operasi berhasil diproses."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan di Google Apps Script: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Inisialisasi Sheet Inti: CONFIG_PELAYANAN, USERS, LOG_AKTIVITAS
function initCoreSheets(ss, services, users, logs) {
  // A. CONFIG_PELAYANAN
  let configSheet = ss.getSheetByName("CONFIG_PELAYANAN");
  if (!configSheet) {
    configSheet = ss.insertSheet("CONFIG_PELAYANAN");
  }
  configSheet.clear();
  const configHeaders = ["ID Pelayanan", "Nama Pelayanan", "Nama Sheet Database", "Status", "Ikon", "Urutan", "Tanggal Dibuat", "Keterangan"];
  configSheet.appendRow(configHeaders);
  formatHeaderRow(configSheet, 8);
  
  if (services && services.length > 0) {
    const configRows = services.map(s => [
      s.id,
      s.name,
      s.sheetName,
      s.isActive ? "Aktif" : "Nonaktif",
      s.icon,
      s.order,
      s.createdAt,
      s.description || ""
    ]);
    configSheet.getRange(2, 1, configRows.length, 8).setValues(configRows);
  }

  // B. USERS
  let usersSheet = ss.getSheetByName("USERS");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("USERS");
  }
  usersSheet.clear();
  const userHeaders = ["ID Pengguna", "Nama Lengkap", "Username", "Role", "Status Akun", "Tanggal Dibuat"];
  usersSheet.appendRow(userHeaders);
  formatHeaderRow(usersSheet, 6);
  
  if (users && users.length > 0) {
    const userRows = users.map(u => [
      u.id,
      u.name,
      u.username,
      u.role,
      u.status,
      u.createdAt
    ]);
    usersSheet.getRange(2, 1, userRows.length, 6).setValues(userRows);
  }

  // C. LOG_AKTIVITAS
  let logSheet = ss.getSheetByName("LOG_AKTIVITAS");
  if (!logSheet) {
    logSheet = ss.insertSheet("LOG_AKTIVITAS");
  }
  if (logSheet.getLastRow() === 0) {
    const logHeaders = ["Waktu Aktivitas", "Nama Pengguna", "Jenis Aktivitas", "Jenis Pelayanan", "ID Data", "Keterangan"];
    logSheet.appendRow(logHeaders);
    formatHeaderRow(logSheet, 6);
  }
  
  if (logs && logs.length > 0) {
    logSheet.clear();
    const logHeaders = ["Waktu Aktivitas", "Nama Pengguna", "Jenis Aktivitas", "Jenis Pelayanan", "ID Data", "Keterangan"];
    logSheet.appendRow(logHeaders);
    formatHeaderRow(logSheet, 6);
    const logRows = logs.map(l => [
      l.timestamp,
      l.userName,
      l.activityType,
      l.serviceName || "-",
      l.dataId || "-",
      l.description
    ]);
    logSheet.getRange(2, 1, logRows.length, 6).setValues(logRows);
  }
}

// Sinkronkan satu sheet pelayanan dengan kolom dinamisnya
function syncServiceSheet(ss, service, records) {
  let sheet = ss.getSheetByName(service.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(service.sheetName);
  }
  sheet.clear();

  // Susun header kolom dinamis:
  // Kolom standar: ID Data, No. Registrasi, Tanggal Pelayanan, Nama Pemohon, NIK
  // + kolom kustom pelayanan
  // + Keterangan, Petugas, Waktu Input
  const headers = ["ID Data", "No. Registrasi", "Tanggal Pelayanan", "Nama Pemohon", "NIK"];
  
  const customFields = (service.fields || []).filter(f => 
    f.id !== "nama_pemohon" && f.id !== "nik" && f.id !== "keterangan"
  );
  
  customFields.forEach(f => headers.push(f.label));
  headers.push("Keterangan", "Petugas Input", "Waktu Input");
  
  sheet.appendRow(headers);
  formatHeaderRow(sheet, headers.length);
  
  // NIK & No Registrasi format string (cegah angka nol di depan hilang)
  sheet.getRange(1, 5, Math.max(100, (records || []).length + 2), 1).setNumberFormat("@");
  sheet.getRange(1, 2, Math.max(100, (records || []).length + 2), 1).setNumberFormat("@");

  if (records && records.length > 0) {
    const rows = records.map(r => {
      const row = [
        r.id,
        "'" + r.registrationNumber,
        r.serviceDate,
        r.applicantName,
        "'" + r.nik // awalan kutip cegah excel stripping nol
      ];
      
      customFields.forEach(f => {
        const val = r.data && r.data[f.id] !== undefined ? r.data[f.id] : "";
        row.push(Array.isArray(val) ? val.join(", ") : val);
      });
      
      row.push(r.notes || (r.data && r.data.keterangan) || "");
      row.push(r.createdBy || "Petugas");
      row.push(r.createdAt || "");
      
      return row;
    });
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function appendRecordRow(sheet, service, record) {
  const customFields = (service.fields || []).filter(f => 
    f.id !== "nama_pemohon" && f.id !== "nik" && f.id !== "keterangan"
  );
  
  const row = [
    record.id,
    "'" + record.registrationNumber,
    record.serviceDate,
    record.applicantName,
    "'" + record.nik
  ];
  
  customFields.forEach(f => {
    const val = record.data && record.data[f.id] !== undefined ? record.data[f.id] : "";
    row.push(Array.isArray(val) ? val.join(", ") : val);
  });
  
  row.push(record.notes || (record.data && record.data.keterangan) || "");
  row.push(record.createdBy || "Petugas");
  row.push(record.createdAt || new Date().toISOString());
  
  sheet.appendRow(row);
}

function formatHeaderRow(sheet, colCount) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground("#064E3B"); // Hijau tua khas Bringin
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  sheet.setFrozenRows(1);
}
`;
}
