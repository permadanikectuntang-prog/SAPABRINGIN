import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateAppsScriptCode } from '../../services/googleSheetsService';
import { parseExcelFile } from '../../services/excelService';
import { 
  Settings, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Upload, 
  Download, 
  Save, 
  Database, 
  ShieldCheck, 
  FileText,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MapPin,
  Sliders,
  Cloud,
  ArrowDownToLine,
  ArrowUpToLine
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    syncGoogleSheets, 
    checkGoogleSheetsConnection, 
    syncStatus, 
    firebaseStatus,
    syncToFirebase,
    loadFromFirebase,
    checkFirebaseConnection,
    services, 
    records, 
    villages,
    logs,
    setActiveView,
    importBatchRecords, 
    resetToDefaultData,
    currentUser,
    showToast
  } = useApp();

  const [appName, setAppName] = useState<string>(settings.appName);
  const [appFullName, setAppFullName] = useState<string>(settings.appFullName);
  const [institutionName, setInstitutionName] = useState<string>(settings.institutionName);
  const [institutionAddress, setInstitutionAddress] = useState<string>(settings.institutionAddress);
  const [googleSheetId, setGoogleSheetId] = useState<string>(settings.googleSheetId);
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState<string>(settings.googleAppsScriptUrl);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>(settings.syncMode);
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');

  // Signer names
  const [camatName, setCamatName] = useState<string>(settings.signers?.camatName || '');
  const [camatNip, setCamatNip] = useState<string>(settings.signers?.camatNip || '');
  const [kasiName, setKasiName] = useState<string>(settings.signers?.kasiName || '');
  const [kasiNip, setKasiNip] = useState<string>(settings.signers?.kasiNip || '');

  // Test status
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  // Firebase integration state
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(false);
  const [isFirebaseTesting, setIsFirebaseTesting] = useState<boolean>(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Excel Import state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      appName: appName.trim(),
      appFullName: appFullName.trim(),
      institutionName: institutionName.trim(),
      institutionAddress: institutionAddress.trim(),
      googleSheetId: googleSheetId.trim(),
      googleAppsScriptUrl: googleAppsScriptUrl.trim(),
      syncMode,
      logoUrl: logoUrl.trim(),
      signers: {
        camatName: camatName.trim(),
        camatNip: camatNip.trim(),
        kasiName: kasiName.trim(),
        kasiNip: kasiNip.trim(),
      },
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await checkGoogleSheetsConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncGoogleSheets();
    setIsSyncing(false);
  };

  const handleCopyAppsScript = () => {
    const code = generateAppsScriptCode(googleSheetId);
    navigator.clipboard.writeText(code);
    setIsCopiedCode(true);
    showToast('success', 'Skrip Google Apps Script berhasil disalin ke clipboard!');
    setTimeout(() => setIsCopiedCode(false), 3000);
  };

  const handleFirebaseSync = async () => {
    setIsFirebaseSyncing(true);
    await syncToFirebase();
    setIsFirebaseSyncing(false);
  };

  const handleFirebaseLoad = async () => {
    setIsFirebaseLoading(true);
    await loadFromFirebase();
    setIsFirebaseLoading(false);
  };

  const handleFirebaseTest = async () => {
    setIsFirebaseTesting(true);
    setFirebaseTestResult(null);
    const ok = await checkFirebaseConnection();
    setFirebaseTestResult({
      success: ok,
      message: ok 
        ? 'Koneksi ke Google Cloud Firestore Enterprise aktif dan merespon cepat.' 
        : 'Tidak dapat terhubung ke Google Cloud Firestore. Periksa koneksi internet.'
    });
    setIsFirebaseTesting(false);
  };

  // Excel file import handler
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsImporting(true);
    setImportSummary(null);

    try {
      const summary = await parseExcelFile(
        file,
        services,
        records,
        currentUser ? currentUser.name : 'Petugas Impor'
      );

      setImportSummary(summary);
      if (summary.importedRecords.length > 0) {
        importBatchRecords(summary.importedRecords);
      } else {
        showToast('info', 'File Excel telah diproses, namun tidak ada baris data baru yang ditambahkan.');
      }
    } catch (err: any) {
      showToast('error', `Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Database JSON Backup
  const handleDownloadBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      institution: settings.institutionName,
      services,
      records,
      settings,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_DATABASE_SIAP_BRINGIN_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Cadangan database (backup JSON) berhasil diunduh.');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.services && json.records) {
          if (window.confirm(`Pulihkan database? Tindakan ini akan memulihkan ${json.records.length} data pelayanan.`)) {
            importBatchRecords(json.records);
            showToast('success', 'Database berhasil dipulihkan dari file backup!');
          }
        } else {
          showToast('error', 'Format file backup JSON tidak valid.');
        }
      } catch (err: any) {
        showToast('error', `Gagal membaca file backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Aplikasi & Integrasi Database
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Kelola koneksi Google Sheets, impor data Excel 2026, identitas instansi, dan backup database.
        </p>
      </div>

      {/* Card 0: Integrasi Cloud Database Firebase Firestore */}
      <div className="bg-white rounded-xl border border-amber-500/30 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Database Cloud Firebase Firestore
                </h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-semibold">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                Penyimpanan cloud real-time terpusat untuk rekaman pelayanan, desa, dan audit trail Kecamatan Bringin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              firebaseStatus.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-red-500/20 text-red-300 border border-red-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${firebaseStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {firebaseStatus.connected ? 'Terhubung' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Cloud Info & Action bar */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Status Sinkronisasi Cloud:</span>
                <span className="text-emerald-700 font-semibold">{firebaseStatus.message || 'Aktif'}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Terakhir Sinkron: <span className="font-mono text-slate-800 font-semibold">{firebaseStatus.lastSync || 'Belum dilakukan'}</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                <span>Project: <strong className="text-slate-700 font-mono">dotted-cascade-rv4kj</strong></span>
                <span>•</span>
                <span>Database: <strong className="text-slate-700 font-mono">ai-studio-siapbringinsiste-...</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFirebaseTest}
                disabled={isFirebaseTesting}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Database className={`w-3.5 h-3.5 text-slate-500 ${isFirebaseTesting ? 'animate-spin' : ''}`} />
                <span>{isFirebaseTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>

              <button
                type="button"
                onClick={handleFirebaseLoad}
                disabled={isFirebaseLoading || isFirebaseSyncing}
                title="Tarik pembaruan data dari cloud ke aplikasi lokal"
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 text-emerald-700 ${isFirebaseLoading ? 'animate-bounce' : ''}`} />
                <span>{isFirebaseLoading ? 'Mengunduh...' : 'Tarik dari Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleFirebaseSync}
                disabled={isFirebaseSyncing || isFirebaseLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
              >
                <ArrowUpToLine className={`w-3.5 h-3.5 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
                <span>{isFirebaseSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Test connection result notice */}
          {firebaseTestResult && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              firebaseTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold">{firebaseTestResult.success ? 'Koneksi Firestore Berhasil' : 'Koneksi Gagal'}</div>
                <p className="mt-0.5 text-[11px]">{firebaseTestResult.message}</p>
              </div>
            </div>
          )}

          {/* Synced collections overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Pelayanan</span>
              <span className="text-base font-bold text-slate-800">{services.length} Layanan</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">/services</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Data Pemohon</span>
              <span className="text-base font-bold text-slate-800">{records.length} Berkas</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">/records</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Desa Bringin</span>
              <span className="text-base font-bold text-slate-800">{villages.length} Desa</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">/villages</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Audit Trail</span>
              <span className="text-base font-bold text-slate-800">{logs.length} Log</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">/logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 1: Integrasi Google Sheets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Integrasi Database Google Sheets
              </h2>
              <p className="text-[11px] text-emerald-300">
                Penyimpanan utama data seluruh jenis pelayanan Kecamatan Bringin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Kode Apps Script & Panduan</span>
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Status Bar */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Status Database:</span>
                {syncStatus.lastError ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Terputus / Belum Dikonfigurasi</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Siap & Aktif Sinkronisasi</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Terakhir Sinkron: <span className="font-mono text-slate-700">{syncStatus.lastSuccess || 'Belum pernah'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {isTesting ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="font-semibold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</div>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          )}

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                GOOGLE_SHEET_ID (ID Spreadsheet)
              </label>
              <input
                type="text"
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dapat diambil dari URL Google Sheets Anda: https://docs.google.com/spreadsheets/d/<strong>[ID_SHEET]</strong>/edit
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                URL Google Apps Script (Web App Endpoint)
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={googleAppsScriptUrl}
                onChange={(e) => setGoogleAppsScriptUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dihasilkan setelah Anda men-deploy skrip Apps Script sebagai 'Web App'.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mode Sinkronisasi
              </label>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="auto">Otomatis (Tiap kali ada input/edit/hapus data)</option>
                <option value="manual">Manual (Hanya saat tombol sinkronisasi ditekan)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Format Tanggal & Zona Waktu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled
                  value="DD-MM-YYYY (Asia/Jakarta / WIB)"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Card 2: Pengolahan & Impor Data Excel 2026 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Upload className="w-5 h-5 text-emerald-800" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Impor Data Excel Pelayanan Tahun 2026
            </h2>
            <p className="text-[11px] text-slate-500">
              Mekanisme impor massal file Excel sumber ke dalam sistem dan Google Sheets.
            </p>
          </div>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Unggah file Excel pelayanan tahun 2026 (.xlsx / .xls). Sistem secara otomatis:
          <br />
          1. Memetakan setiap sheet Excel ke jenis pelayanan yang sesuai (KK, KTP, SKCK, Pindah, Ahli Waris, dll).
          <br />
          2. Menjaga NIK dan nomor identitas sebagai teks agar angka nol di depan tidak hilang.
          <br />
          3. Menormalkan format tanggal dan mencegah duplikasi data jika diimpor berulang.
        </p>

        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Pilih File Excel Pelayanan (.xlsx, .xls)</div>
              <div className="text-[11px] text-slate-500">Mendukung multi-sheet otomatis</div>
            </div>
          </div>

          <label className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shadow-xs">
            <span>{isImporting ? 'Memproses Impor...' : 'Pilih File & Impor Sekarang'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelFileUpload}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>

        {/* Import Summary Results */}
        {importSummary && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Laporan Hasil Impor File: {importSummary.fileName}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px]">Total Baris Dibaca</span>
                <div className="font-bold font-mono text-slate-800 text-sm">{importSummary.totalRowsRead}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-emerald-600 text-[10px]">Berhasil Diimpor</span>
                <div className="font-bold font-mono text-emerald-700 text-sm">{importSummary.successfullyImported}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-amber-600 text-[10px]">Data Ganda Dilewati</span>
                <div className="font-bold font-mono text-amber-700 text-sm">{importSummary.skippedDuplicates}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-400 text-[10px]">Sheet Diproses</span>
                <div className="font-bold font-mono text-slate-800 text-sm">{importSummary.sheetCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Master Data Desa Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Master Data Desa & Kelurahan ({villages.length} Desa Terdaftar)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tambah desa baru, ubah nama, atau hapus wilayah desa di Kecamatan Bringin. Otomatis sinkron ke seluruh formulir pelayanan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('villages')}
          className="flex items-center gap-1.5 px-4 py-2 font-bold text-xs text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4 text-emerald-950" />
          <span>Buka Manajemen Data Desa</span>
        </button>
      </div>

      {/* Card 3: Identitas Aplikasi & Kop Surat */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 text-xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Settings className="w-5 h-5 text-emerald-800" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Identitas Aplikasi & Pejabat Penandatangan
            </h2>
            <p className="text-[11px] text-slate-500">
              Digunakan pada header aplikasi, kop surat resmi, dan pengesahan laporan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Aplikasi</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kepanjangan Nama Aplikasi</label>
            <input
              type="text"
              value={appFullName}
              onChange={(e) => setAppFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Instansi</label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Alamat Kantor Instansi</label>
            <input
              type="text"
              value={institutionAddress}
              onChange={(e) => setInstitutionAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">
              URL Logo / Lambang Kustom (Opsional)
            </label>
            <input
              type="text"
              placeholder="Kosongkan untuk menggunakan lambang heraldik resmi Kecamatan Bringin yang sudah terpasang"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Signers */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Camat Bringin</label>
            <input
              type="text"
              value={camatName}
              onChange={(e) => setCamatName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">NIP Camat</label>
            <input
              type="text"
              value={camatNip}
              onChange={(e) => setCamatNip(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Kasi Pelayanan Umum</label>
            <input
              type="text"
              value={kasiName}
              onChange={(e) => setKasiName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">NIP Kasi Pelayanan Umum</label>
            <input
              type="text"
              value={kasiNip}
              onChange={(e) => setKasiNip(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-950" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Card 4: Backup, Restore & Reset Database */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
          <Database className="w-5 h-5 text-emerald-800" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cadangan Database (Backup & Restore)
            </h2>
            <p className="text-[11px] text-slate-500">
              Amankan salinan lengkap database sistem kapan saja.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Unduh Cadangan Database (JSON)</span>
          </button>

          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Pulihkan dari File Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset seluruh data aplikasi ke keadaan awal standar 2026?')) {
                resetToDefaultData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset ke Data Awal Standar</span>
          </button>
        </div>
      </div>

      {/* Apps Script Guide Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-xs">
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Panduan Pemasangan Backend Google Apps Script
                </h3>
                <p className="text-[11px] text-emerald-300">
                  Ikuti 4 langkah mudah ini agar Google Sheets Anda otomatis terhubung dengan aplikasi SIAP BRINGIN.
                </p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-amber-900 space-y-1">
                <div className="font-bold">Langkah Pemasangan di Google Spreadsheet:</div>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Buka Google Spreadsheet Anda (atau buat baru di Google Drive).</li>
                  <li>Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan, lalu tempel (paste) kode di bawah ini.</li>
                  <li>Klik tombol <strong>Deploy (Terapkan)</strong> &gt; <strong>New deployment (Penerapan baru)</strong>.</li>
                  <li>Pilih jenis <strong>Web app</strong>, isi execute as <strong>Me</strong>, dan Who has access: <strong>Anyone (Siapa saja)</strong>.</li>
                  <li>Salin <strong>Web App URL</strong> yang dihasilkan dan masukkan ke Pengaturan SIAP BRINGIN!</li>
                </ol>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Kode Google Apps Script Siap Pakai:</span>
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-4 rounded-lg overflow-x-auto max-h-72 border border-slate-800">
                <pre>{generateAppsScriptCode(googleSheetId)}</pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
