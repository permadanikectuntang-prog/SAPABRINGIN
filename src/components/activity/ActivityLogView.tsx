import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityType } from '../../types';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ShieldCheck, 
  UserCheck, 
  FileCheck, 
  RefreshCw, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { logs, clearLogs, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const isAdmin = currentUser?.role === 'ADMINISTRATOR';

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedType !== 'all' && log.activityType !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = log.userName.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchService = (log.serviceName || '').toLowerCase().includes(q);
        const matchDataId = (log.dataId || '').toLowerCase().includes(q);
        if (!matchUser && !matchDesc && !matchService && !matchDataId) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedType, searchQuery]);

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'LOGIN':
        return <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">LOGIN</span>;
      case 'LOGOUT':
        return <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">LOGOUT</span>;
      case 'TAMBAH_DATA':
        return <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">TAMBAH DATA</span>;
      case 'EDIT_DATA':
        return <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">EDIT DATA</span>;
      case 'HAPUS_DATA':
        return <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">HAPUS DATA</span>;
      case 'SYNC_SHEETS':
        return <span className="text-[10px] font-semibold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">SYNC SHEETS</span>;
      case 'IMPOR_EXCEL':
        return <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">IMPOR EXCEL</span>;
      default:
        return <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{type}</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Audit Trail & Keamanan</span>
            <span aria-hidden="true">·</span>
            <span>Sheet: LOG_AKTIVITAS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Log Aktivitas Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Pencatatan rekam jejak setiap aksi petugas: login, input data, pengeditan, penghapusan, dan sinkronisasi.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bersihkan seluruh riwayat log aktivitas saat ini?')) {
                clearLogs();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors self-start md:self-auto"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Bersihkan Log</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama petugas, jenis pelayanan, atau keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-slate-500 whitespace-nowrap">Jenis Aksi:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
          >
            <option value="all">Semua Aktivitas</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="TAMBAH_DATA">Tambah Data</option>
            <option value="EDIT_DATA">Edit Data</option>
            <option value="HAPUS_DATA">Hapus Data</option>
            <option value="TAMBAH_PELAYANAN">Tambah Pelayanan</option>
            <option value="EDIT_PELAYANAN">Edit Pelayanan</option>
            <option value="SYNC_SHEETS">Sync Google Sheets</option>
            <option value="IMPOR_EXCEL">Impor Excel</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-950 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 w-44 whitespace-nowrap">Waktu Aktivitas</th>
                <th className="py-3 px-3.5 w-44">Nama Petugas</th>
                <th className="py-3 px-3.5 w-32">Jenis Aksi</th>
                <th className="py-3 px-3.5 w-36">Pelayanan / ID</th>
                <th className="py-3 px-3.5">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada catatan log aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-400">
                      {index + 1}
                    </td>

                    <td className="py-3 px-3.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{log.userRole.toLowerCase()}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      {getActivityBadge(log.activityType)}
                    </td>

                    <td className="py-3 px-3.5 text-slate-600">
                      {log.serviceName && (
                        <div className="font-medium text-emerald-900">{log.serviceName}</div>
                      )}
                      {log.dataId && (
                        <div className="font-mono text-[10px] text-slate-400">{log.dataId}</div>
                      )}
                      {!log.serviceName && !log.dataId && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-slate-800 leading-relaxed">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
