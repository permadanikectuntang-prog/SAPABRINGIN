import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceRecord, ServiceConfig } from '../../types';
import { BRINGIN_VILLAGES } from '../../data/defaultData';
import { exportRecordsToExcel, exportToCsv } from '../../services/excelService';
import { ServiceDetailModal } from './ServiceDetailModal';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  AlertTriangle, 
  RotateCcw,
  Calendar,
  Layers,
  MapPin,
  ArrowUpDown
} from 'lucide-react';

interface ServiceDataViewProps {
  serviceId: string | null; // null or 'all' for all services
  onEditRecord: (record: ServiceRecord) => void;
  onAddNewRecord: (targetServiceId?: string) => void;
}

export const ServiceDataView: React.FC<ServiceDataViewProps> = ({
  serviceId,
  onEditRecord,
  onAddNewRecord,
}) => {
  const { services, records, deleteRecord, villages } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<ServiceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<ServiceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Active Service
  const currentService: ServiceConfig | undefined = useMemo(() => {
    if (!serviceId || serviceId === 'all') return undefined;
    return services.find(s => s.id === serviceId);
  }, [services, serviceId]);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter(rec => {
        // Service filter
        if (serviceId && serviceId !== 'all' && rec.serviceId !== serviceId) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = rec.applicantName?.toLowerCase().includes(q);
          const matchNik = rec.nik?.includes(q);
          const matchReg = rec.registrationNumber?.toLowerCase().includes(q);
          const matchNotes = rec.notes?.toLowerCase().includes(q);
          const matchDesa = (rec.data?.desa || rec.data?.desa_asal || rec.data?.desa_tujuan || '')
            .toLowerCase()
            .includes(q);

          if (!matchName && !matchNik && !matchReg && !matchNotes && !matchDesa) {
            return false;
          }
        }

        // Village filter
        if (selectedVillage !== 'all') {
          const desa = rec.data?.desa || rec.data?.desa_asal || rec.data?.desa_tujuan;
          if (desa !== selectedVillage) return false;
        }

        // Year & Month filter
        if (filterYear !== 'all') {
          if (!rec.serviceDate.startsWith(filterYear)) return false;
        }
        if (filterMonth !== 'all') {
          const monthPad = String(filterMonth).padStart(2, '0');
          const ym = `${filterYear !== 'all' ? filterYear : '2026'}-${monthPad}`;
          if (!rec.serviceDate.startsWith(ym)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return b.serviceDate.localeCompare(a.serviceDate) || b.createdAt.localeCompare(a.createdAt);
        } else {
          return a.serviceDate.localeCompare(b.serviceDate) || a.createdAt.localeCompare(b.createdAt);
        }
      });
  }, [records, serviceId, searchQuery, selectedVillage, filterMonth, filterYear, sortOrder]);

  // Pagination calculation
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handlers
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    await deleteRecord(recordToDelete.serviceId, recordToDelete.id);
    setIsDeleting(false);
    setRecordToDelete(null);
  };

  const handleExportExcel = () => {
    if (currentService) {
      exportRecordsToExcel(currentService, filteredRecords, `DATA_PELAYANAN_${currentService.name.replace(/[^A-Za-z0-9]/g, '_')}`);
    } else {
      // Export all generic view
      const dummyService: ServiceConfig = {
        id: 'semua-pelayanan',
        name: 'Semua Pelayanan',
        sheetName: 'SEMUA_PELAYANAN',
        icon: 'FileText',
        order: 1,
        isActive: true,
        createdAt: '2026-01-01',
        fields: [
          { id: 'desa', label: 'Desa', type: 'text', required: false, order: 1 },
          { id: 'jenis', label: 'Jenis/Keperluan', type: 'text', required: false, order: 2 },
        ],
      };
      exportRecordsToExcel(dummyService, filteredRecords, 'DATA_SEMUA_PELAYANAN_BRINGIN');
    }
  };

  const handleExportCsv = () => {
    const headers = ['No', 'No. Registrasi', 'Tanggal', 'Nama Pemohon', 'NIK', 'Desa', 'Keterangan', 'Petugas'];
    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.registrationNumber,
      r.serviceDate,
      r.applicantName,
      r.nik,
      r.data?.desa || r.data?.desa_asal || '-',
      r.notes || r.data?.keterangan || '-',
      r.createdBy,
    ]);
    exportToCsv(headers, rows, `DATA_PELAYANAN_${(currentService?.name || 'SEMUA').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner & Header info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Data Pelayanan</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-800">
              {currentService ? currentService.name : 'Seluruh Pelayanan'}
            </span>
            {currentService && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-400">Sheet: {currentService.sheetName}</span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {currentService ? `Daftar Berkas ${currentService.name}` : 'Seluruh Berkas Pelayanan Administrasi'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {currentService?.description || 'Kelola dan cari seluruh data permohonan masyarakat di Kecamatan Bringin.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
            title="Download file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download file CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onAddNewRecord(currentService?.id)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>Tambah Data Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama Pemohon, NIK, No. Registrasi, Desa..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desa Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => {
                setSelectedVillage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Desa ({villages.length} Desa Bringin)</option>
              {villages.map(v => (
                <option key={v.id} value={v.name}>{v.name} {!v.isActive ? '(Nonaktif)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Month & Year Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

        </div>

        {/* Status Strip & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Ditemukan <strong className="font-mono text-slate-800">{filteredRecords.length}</strong> berkas</span>
            {(searchQuery || selectedVillage !== 'all' || filterMonth !== 'all' || filterYear !== '2026') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVillage('all');
                  setFilterMonth('all');
                  setFilterYear('2026');
                }}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
            </button>

            <div className="flex items-center gap-1">
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none text-slate-800 font-mono"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-950 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">No</th>
                <th className="py-3 px-3.5 whitespace-nowrap">No. Registrasi</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3.5">Nama Pemohon</th>
                <th className="py-3 px-3.5 whitespace-nowrap">NIK</th>
                <th className="py-3 px-3.5">Desa / Alamat</th>
                {!currentService && (
                  <th className="py-3 px-3.5">Jenis Pelayanan</th>
                )}
                <th className="py-3 px-3.5">Keterangan</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={currentService ? 8 : 9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">Tidak ada data pelayanan yang sesuai</p>
                      <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => {
                  const srv = services.find(s => s.id === record.serviceId);
                  const desa = record.data?.desa || record.data?.desa_asal || record.data?.desa_tujuan || '-';
                  const rtRw = (record.data?.rt && record.data?.rw) ? `RT ${record.data.rt} / RW ${record.data.rw}` : '';
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-emerald-50/40 transition-colors group"
                    >
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums text-slate-500">
                        {rowNumber}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-emerald-900 whitespace-nowrap">
                        {record.registrationNumber}
                      </td>

                      <td className="py-3 px-3.5 font-mono tabular-nums whitespace-nowrap text-slate-600">
                        {record.serviceDate}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {record.applicantName}
                        </div>
                        {record.data?.pekerjaan && (
                          <div className="text-[10px] text-slate-400">{record.data.pekerjaan}</div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {record.nik}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-800">{desa}</div>
                        {rtRw && <div className="text-[10px] text-slate-400">{rtRw}</div>}
                      </td>

                      {!currentService && (
                        <td className="py-3 px-3.5">
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {srv ? srv.name : record.serviceId}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-3.5 max-w-xs truncate text-slate-600" title={record.notes || record.data?.keterangan || ''}>
                        {record.notes || record.data?.keterangan || '-'}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForDetail(record)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(record)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-mono tabular-nums font-semibold text-slate-800">{paginatedRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> sampai{' '}
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{' '}
            dari <span className="font-mono tabular-nums font-semibold text-slate-800">{totalItems}</span> data
          </div>

          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono tabular-nums text-xs font-semibold text-emerald-950 bg-slate-100 rounded">
              Halaman {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecordForDetail && (
        <ServiceDetailModal
          record={selectedRecordForDetail}
          service={services.find(s => s.id === selectedRecordForDetail.serviceId)}
          onClose={() => setSelectedRecordForDetail(null)}
          onEdit={() => {
            const rec = selectedRecordForDetail;
            setSelectedRecordForDetail(null);
            onEditRecord(rec);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Data</h3>
                <p className="text-slate-500 text-[11px]">Tindakan ini akan menghapus data dari sistem dan Google Sheets.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 my-4 space-y-1.5">
              <div>
                <span className="text-slate-500">Nama Pemohon:</span>{' '}
                <strong className="text-slate-900 font-semibold">{recordToDelete.applicantName}</strong>
              </div>
              <div>
                <span className="text-slate-500">NIK:</span>{' '}
                <strong className="text-slate-900 font-mono">{recordToDelete.nik}</strong>
              </div>
              <div>
                <span className="text-slate-500">No. Registrasi:</span>{' '}
                <strong className="text-emerald-900 font-mono">{recordToDelete.registrationNumber}</strong>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data permohonan ini? Data yang terhapus tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
