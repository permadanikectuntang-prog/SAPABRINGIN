import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BRINGIN_VILLAGES } from '../../data/defaultData';
import { BringinEmblem } from '../common/BringinEmblem';
import { exportRecordsToExcel, exportToCsv, exportAllServicesToExcel } from '../../services/excelService';
import { 
  Printer, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  RotateCcw, 
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { services, records, settings, villages } = useApp();

  // Filters
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'daily' | 'monthly' | 'yearly' | 'custom'>('all');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [dailyDate, setDailyDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [monthlyDate, setMonthlyDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [yearlyDate, setYearlyDate] = useState<string>('2026');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Service
  const activeService = useMemo(() => {
    if (selectedServiceId === 'all') return null;
    return services.find(s => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Filtered records for report
  const reportRecords = useMemo(() => {
    return records.filter(rec => {
      // Service filter
      if (selectedServiceId !== 'all' && rec.serviceId !== selectedServiceId) {
        return false;
      }

      // Village filter
      if (selectedVillage !== 'all') {
        const desa = rec.data?.desa || rec.data?.desa_asal || rec.data?.desa_tujuan;
        if (desa !== selectedVillage) return false;
      }

      // Period filter
      if (filterPeriod === 'daily') {
        if (rec.serviceDate !== dailyDate) return false;
      } else if (filterPeriod === 'monthly') {
        if (!rec.serviceDate.startsWith(monthlyDate)) return false;
      } else if (filterPeriod === 'yearly') {
        if (!rec.serviceDate.startsWith(yearlyDate)) return false;
      } else if (filterPeriod === 'custom') {
        if (startDate && rec.serviceDate < startDate) return false;
        if (endDate && rec.serviceDate > endDate) return false;
      }

      return true;
    }).sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  }, [records, selectedServiceId, selectedVillage, filterPeriod, dailyDate, monthlyDate, yearlyDate, startDate, endDate]);

  // Period label for report header
  const periodLabel = useMemo(() => {
    if (filterPeriod === 'daily') return `Hari/Tanggal: ${dailyDate}`;
    if (filterPeriod === 'monthly') {
      const [y, m] = monthlyDate.split('-');
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `Bulan: ${monthNames[parseInt(m, 10)]} ${y}`;
    }
    if (filterPeriod === 'yearly') return `Tahun Anggaran: ${yearlyDate}`;
    if (filterPeriod === 'custom') return `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`;
    return 'Semua Periode (Tahun 2026)';
  }, [filterPeriod, dailyDate, monthlyDate, yearlyDate, startDate, endDate]);

  const printDateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (activeService) {
      exportRecordsToExcel(activeService, reportRecords, `LAPORAN_${activeService.name.replace(/[^A-Za-z0-9]/g, '_')}`);
    } else {
      exportAllServicesToExcel(services, reportRecords, `LAPORAN_REKAP_PELAYANAN_BRINGIN_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleExportCsv = () => {
    const headers = ['No', 'No. Registrasi', 'Tanggal', 'Nama Pemohon', 'NIK', 'Desa', 'Jenis Pelayanan', 'Keterangan', 'Petugas'];
    const rows = reportRecords.map((r, idx) => {
      const srv = services.find(s => s.id === r.serviceId);
      return [
        idx + 1,
        r.registrationNumber,
        r.serviceDate,
        r.applicantName,
        r.nik,
        r.data?.desa || r.data?.desa_asal || '-',
        srv?.name || r.serviceId,
        r.notes || r.data?.keterangan || '-',
        r.createdBy,
      ];
    });
    exportToCsv(headers, rows, `LAPORAN_PELAYANAN_BRINGIN_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Export Toolbar (Hidden during print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan & Rekapitulasi Pelayanan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Saring berkas berdasarkan jenis, tanggal, atau desa, lalu cetak dengan format kop resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Cetak Laporan / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Unduh Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
          
          {/* Service Selector */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Jenis Pelayanan</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Jenis Pelayanan ({records.length} berkas)</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Period Type */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Periode Laporan</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Periode</option>
              <option value="daily">Laporan Harian</option>
              <option value="monthly">Laporan Bulanan</option>
              <option value="yearly">Laporan Tahunan</option>
              <option value="custom">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {/* Dynamic Period Input */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Waktu Spesifik</label>
            {filterPeriod === 'daily' && (
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            )}
            {filterPeriod === 'monthly' && (
              <input
                type="month"
                value={monthlyDate}
                onChange={(e) => setMonthlyDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            )}
            {filterPeriod === 'yearly' && (
              <select
                value={yearlyDate}
                onChange={(e) => setYearlyDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            )}
            {filterPeriod === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-[11px]"
                />
              </div>
            )}
            {filterPeriod === 'all' && (
              <input
                type="text"
                disabled
                value="Tahun 2026 Aktif"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
            )}
          </div>

          {/* Village Filter */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Filter Desa / Wilayah</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Desa ({villages.length} Desa)</option>
              {villages.map(v => (
                <option key={v.id} value={v.name}>{v.name} {!v.isActive ? '(Nonaktif)' : ''}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Result counts bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Ditemukan <strong className="text-slate-900 font-mono font-bold">{reportRecords.length}</strong> berkas siap cetak.
          </div>
          {(selectedServiceId !== 'all' || filterPeriod !== 'all' || selectedVillage !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedServiceId('all');
                setFilterPeriod('all');
                setSelectedVillage('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter Laporan</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Printable Report Document Canvas */}
      <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-md print:border-none print:shadow-none print:p-0">
        
        {/* Official Kop Surat */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-center gap-5">
            <BringinEmblem size="xl" logoUrl={settings.logoUrl} className="shrink-0 w-20 h-20" />
            
            <div className="text-center">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900">
                Pemerintah Kabupaten Semarang
              </h3>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-emerald-950 mt-0.5">
                Kecamatan Bringin
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto leading-tight">
                {settings.institutionAddress || 'Jl. Raya Bringin No. 1 Bringin, Kab. Semarang, Jawa Tengah 50772'}
                <br />
                Pos-el: paten.bringin@semarangkab.go.id · Laman: sapa-bringin.semarangkab.go.id
              </p>
            </div>

            <div className="w-20 hidden sm:block" /> {/* balance spacing */}
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold uppercase text-slate-900 underline decoration-slate-400 underline-offset-4">
            Laporan Pelayanan Masyarakat
          </h2>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            {activeService ? `Jenis Pelayanan: ${activeService.name}` : 'Rekapitulasi Seluruh Jenis Pelayanan Administrasi Terpadu'}
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600 mt-1">
            <span>{periodLabel}</span>
            <span>·</span>
            <span>Wilayah: {selectedVillage === 'all' ? 'Kecamatan Bringin' : `Desa ${selectedVillage}`}</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                <th className="border border-slate-400 py-2.5 px-2 w-10">No</th>
                <th className="border border-slate-400 py-2.5 px-3 w-32">No. Registrasi</th>
                <th className="border border-slate-400 py-2.5 px-2.5 w-24">Tanggal</th>
                <th className="border border-slate-400 py-2.5 px-3">Nama Pemohon</th>
                <th className="border border-slate-400 py-2.5 px-3 w-32">NIK</th>
                <th className="border border-slate-400 py-2.5 px-3">Desa / Alamat</th>
                {!activeService && (
                  <th className="border border-slate-400 py-2.5 px-3">Jenis Pelayanan</th>
                )}
                <th className="border border-slate-400 py-2.5 px-3">Keterangan</th>
                <th className="border border-slate-400 py-2.5 px-2 w-20">Petugas</th>
              </tr>
            </thead>
            <tbody>
              {reportRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeService ? 8 : 9} className="border border-slate-400 py-8 text-center text-slate-500">
                    Tidak ada data pelayanan yang tercatat pada kriteria laporan ini.
                  </td>
                </tr>
              ) : (
                reportRecords.map((r, idx) => {
                  const srv = services.find(s => s.id === r.serviceId);
                  const desa = r.data?.desa || r.data?.desa_asal || r.data?.desa_tujuan || '-';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="border border-slate-400 py-2 px-2 text-center font-mono tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-400 py-2 px-2.5 font-mono text-[11px] font-semibold text-slate-900 whitespace-nowrap">
                        {r.registrationNumber}
                      </td>
                      <td className="border border-slate-400 py-2 px-2.5 font-mono tabular-nums text-center whitespace-nowrap">
                        {r.serviceDate}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 font-semibold text-slate-900">
                        {r.applicantName}
                      </td>
                      <td className="border border-slate-400 py-2 px-2.5 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        {r.nik}
                      </td>
                      <td className="border border-slate-400 py-2 px-3">
                        {desa}
                      </td>
                      {!activeService && (
                        <td className="border border-slate-400 py-2 px-3">
                          {srv?.name || r.serviceId}
                        </td>
                      )}
                      <td className="border border-slate-400 py-2 px-3 text-[11px] text-slate-700">
                        {r.notes || r.data?.keterangan || '-'}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center text-[10px] text-slate-600">
                        {r.createdBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Section (Kop tanda tangan Camat & Kasi) */}
        <div className="grid grid-cols-2 gap-8 text-xs text-slate-800 mt-10 pt-4 break-inside-avoid">
          {/* Left signature: Kasi Pelayanan Umum */}
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-semibold">Kasi Pelayanan Umum & Administrasi Terpadu</p>
            <div className="h-20" /> {/* Space for signature & stamp */}
            <p className="font-bold underline text-slate-900 uppercase">
              {settings.signers?.kasiName || 'Agus Priyono, S.STP'}
            </p>
            <p className="font-mono text-[11px] text-slate-600">
              NIP. {settings.signers?.kasiNip || '19820415 200604 1 005'}
            </p>
          </div>

          {/* Right signature: Camat Bringin */}
          <div className="text-center">
            <p>Bringin, {printDateStr}</p>
            <p className="font-semibold">Camat Bringin Kabupaten Semarang</p>
            <div className="h-20" /> {/* Space for signature & stamp */}
            <p className="font-bold underline text-slate-900 uppercase">
              {settings.signers?.camatName || 'Drs. H. Mulyadi, M.Si'}
            </p>
            <p className="font-mono text-[11px] text-slate-600">
              NIP. {settings.signers?.camatNip || '19750812 199903 1 002'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
