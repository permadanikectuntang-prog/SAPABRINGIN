import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateAppsScriptCode } from '../../services/googleSheetsService';
import { parseExcelFile, exportAllServicesToExcel } from '../../services/excelService';
import { BringinEmblem, OFFICIAL_KAB_SEMARANG_LOGO } from '../common/BringinEmblem';
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

  React.useEffect(() => {
    setAppName(settings.appName);
    setAppFullName(settings.appFullName);
    setInstitutionName(settings.institutionName);
    setInstitutionAddress(settings.institutionAddress);
    setGoogleSheetId(settings.googleSheetId);
    setGoogleAppsScriptUrl(settings.googleAppsScriptUrl);
    setSyncMode(settings.syncMode);
    setLogoUrl(settings.logoUrl || '');
    if (settings.signers) {
      setCamatName(settings.signers.camatName || '');
      setCamatNip(settings.signers.camatNip || '');
      setKasiName(settings.signers.kasiName || '');
      setKasiNip(settings.signers.kasiNip || '');
    }
  }, [settings]);

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
    a.download = `BACKUP_DATABASE_SAPA_BRINGIN_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Cadangan database (backup JSON) berhasil diunduh.');
  };

  // Direct Excel Export with Multi-Sheet structure (Google Sheets compatible)
  const handleExportAllSheetsExcel = () => {
    const filename = `DATABASE_SAPA_BRINGIN_GOOGLE_SHEETS_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportAllServicesToExcel(services, records, filename);
    showToast('success', `File spreadsheet multi-sheet "${filename}" berhasil diunduh. Anda dapat langsung mengimpornya ke Google Sheets!`);
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllSheetsExcel}
              title="Unduh seluruh data pelayanan dalam format Excel yang siap diimpor ke Google Sheets"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700/60 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Unduh Spreadsheet (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Kode Apps Script & Panduan</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Status Bar */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Status Database:</span>
                {syncStatus.lastError || googleAppsScriptUrl.includes('EXAMPLE') || googleAppsScriptUrl.includes('SIAP_BRINGIN_EXAM') ? (
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
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
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

          {/* Diagnostic Alert if placeholder URL detected */}
          {(googleAppsScriptUrl.includes('EXAMPLE') || googleAppsScriptUrl.includes('SIAP_BRINGIN_EXAM') || googleAppsScriptUrl.includes('AKfycbzSIAP')) && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-xs text-amber-950">
                    Solusi: URL Google Apps Script Masih Berupa Contoh Bawaan (Placeholder)
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Status saat ini <strong>"Terputus / Belum Dikonfigurasi"</strong> karena kolom URL di bawah masih berisi nilai contoh <code>(...EXAMPLE_KEY...)</code>. Agar data dapat tersimpan langsung ke Google Sheets Anda:
                  </p>
                </div>
              </div>

              <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">1. Pasang Apps Script (2 Menit):</span>
                  <span>Buka Spreadsheet Anda, tempelkan skrip otomatis, lalu deploy sebagai Web App dengan akses <strong>"Anyone / Siapa saja"</strong>.</span>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCodeModal(true)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Buka Panduan & Salin Skrip</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
                  <span className="font-bold text-slate-800 block mb-1">2. Buka Lembar Spreadsheet Anda:</span>
                  <span>Klik tautan langsung di bawah untuk membuka spreadsheet Google Anda:</span>
                  <div className="mt-2">
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold underline text-[11px]"
                    >
                      <span>Buka Spreadsheet di Tab Baru</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test connection result notice */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</span>
              </div>
              <p className="mt-1 pl-5.5 leading-relaxed">{testResult.message}</p>
              {!testResult.success && (
                <div className="mt-3 pl-5.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeModal(true)}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Buka Panduan & Salin Skrip Apps Script</span>
                  </button>
                  {googleAppsScriptUrl.includes('EXAMPLE') && (
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleAppsScriptUrl('');
                        setTestResult(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold rounded-lg text-xs transition-colors"
                    >
                      Hapus Teks Contoh Ini
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">
                  GOOGLE_SHEET_ID (ID Spreadsheet)
                </label>
                {googleSheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${googleSheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value.trim())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dapat diambil dari URL Google Sheets Anda: https://docs.google.com/spreadsheets/d/<strong>[ID_SHEET]</strong>/edit
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">
                  URL Google Apps Script (Web App Endpoint)
                </label>
                {googleAppsScriptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleAppsScriptUrl('');
                      setTestResult(null);
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-800 underline font-medium"
                  >
                    Hapus / Kosongkan
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={googleAppsScriptUrl}
                onChange={(e) => setGoogleAppsScriptUrl(e.target.value.trim())}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono text-xs focus:outline-none focus:ring-1 ${
                  googleAppsScriptUrl.includes('EXAMPLE') || googleAppsScriptUrl.includes('SIAP_BRINGIN_EXAM')
                    ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/30'
                    : 'border-slate-300 focus:ring-emerald-600'
                }`}
              />
              {googleAppsScriptUrl.includes('EXAMPLE') || googleAppsScriptUrl.includes('SIAP_BRINGIN_EXAM') ? (
                <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Ini Teks Contoh Bawaan (Bukan URL Asli Anda)</span>
                  </div>
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Sistem tidak bisa tersambung ke teks contoh ini. Anda harus membuat skrip di Google Spreadsheet Anda sendiri untuk mendapatkan URL Web App asli.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowCodeModal(true)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Buka Panduan & Salin Skrip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleAppsScriptUrl('');
                        setTestResult(null);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded text-[11px]"
                    >
                      Hapus Teks Contoh Ini
                    </button>
                  </div>
                </div>
              ) : !googleAppsScriptUrl ? (
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Tempelkan URL Web App (berakhiran <code>/exec</code>) di sini.</span>
                  <button
                    type="button"
                    onClick={() => setShowCodeModal(true)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    Cara Dapatkan URL?
                  </button>
                </div>
              ) : googleAppsScriptUrl.startsWith('https://script.google.com/macros/s/') && googleAppsScriptUrl.endsWith('/exec') ? (
                <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <span>✓ Format URL Web App valid. Klik 'Uji Koneksi' untuk menguji.</span>
                </p>
              ) : (
                <p className="text-[10px] text-rose-600 font-medium mt-1">
                  ⚠️ Format URL belum sesuai. Pastikan berawalan "https://script.google.com/macros/s/..." dan berakhiran "/exec".
                </p>
              )}
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

          <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-800 font-bold mb-2">
              Logo / Lambang Resmi Daerah
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 flex flex-col items-center">
                <BringinEmblem size="lg" logoUrl={logoUrl || OFFICIAL_KAB_SEMARANG_LOGO} className="w-16 h-16" />
                <span className="text-[10px] text-slate-500 font-medium mt-1">Pratinjau Logo</span>
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Lambang resmi <strong>Kabupaten Semarang</strong> ditampilkan pada seluruh header sistem, formulir pelayanan, kop surat laporan resmi, dan bukti tanda terima masyarakat.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="URL gambar logo"
                    className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(OFFICIAL_KAB_SEMARANG_LOGO)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  >
                    Gunakan Lambang Kab. Semarang
                  </button>
                </div>
              </div>
            </div>
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
                  Ikuti 4 langkah mudah ini agar Google Sheets Anda otomatis terhubung dengan aplikasi SAPA BRINGIN.
                </p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Direct Link Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-800 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">Target Spreadsheet Kecamatan Bringin:</span>
                    <span className="font-mono text-[11px] text-emerald-800 break-all">{googleSheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}</span>
                  </div>
                </div>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${googleSheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Step-by-step Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Buka Spreadsheet & Menu Apps Script</div>
                    <p className="text-slate-600 mt-0.5">
                      Buka Google Spreadsheet Anda, lalu di bilah menu atas klik <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>. Tab editor skrip Google akan terbuka.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="w-full">
                    <div className="font-bold text-slate-900">Tempelkan (Paste) Kode Backend SAPA BRINGIN</div>
                    <p className="text-slate-600 mt-0.5 mb-2">
                      Hapus teks kode bawaan (seperti <code>function myFunction() &#123;&#125;</code>), lalu salin seluruh kode dari kotak di bawah dan tempelkan. Tekan ikon disket (Simpan / Ctrl+S).
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyAppsScript}
                      className="px-3 py-1.5 font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isCopiedCode ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode Skrip'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/70 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Deploy sebagai Aplikasi Web (PENTING)</span>
                      <span className="text-[10px] bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded font-bold">Kritis</span>
                    </div>
                    <p className="text-amber-900 mt-0.5">
                      Di pojok kanan atas editor Apps Script, klik tombol biru <strong>Deploy (Terapkan)</strong> &gt; pilih <strong>New deployment (Penerapan baru)</strong>:
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-800 pl-2">
                      <li>• Klik ikon gerigi (Select type) &gt; pilih <strong>Web app (Aplikasi Web)</strong>.</li>
                      <li>• Description: <code className="bg-white px-1 rounded border">SAPA Bringin Backend</code></li>
                      <li>• Execute as (Jalankan sebagai): <strong>Me (Saya - email Anda)</strong></li>
                      <li>• Who has access (Siapa yang memiliki akses): <strong className="text-emerald-800 underline bg-emerald-100/70 px-1 rounded">Anyone (Siapa saja)</strong> ⚠️ <em>Wajib dipilih 'Anyone' agar web app dapat mengirim data tanpa terblokir autentikasi redirect.</em></li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Salin Web App URL ke Aplikasi SAPA BRINGIN</div>
                    <p className="text-slate-600 mt-0.5">
                      Klik <strong>Deploy</strong> (jika diminta izin, klik <em>Review permissions</em> &gt; pilih akun Google Anda &gt; <em>Advanced / Lanjutan</em> &gt; <em>Go to SAPA Bringin</em> &gt; <em>Allow / Izinkan</em>).
                      <br />
                      Salin <strong>Web App URL</strong> yang dihasilkan (berakhiran <code>/exec</code>), tempelkan ke kolom <strong>URL Google Apps Script</strong> di Pengaturan ini, lalu klik <strong>Simpan Semua Pengaturan</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">Kode Google Apps Script Siap Pakai (Otomatis Sesuai Spreadsheet Anda):</span>
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="flex items-center gap-1.5 px-3 py-1 font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-4 rounded-lg overflow-x-auto max-h-64 border border-slate-800">
                  <pre>{generateAppsScriptCode(googleSheetId)}</pre>
                </div>
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
