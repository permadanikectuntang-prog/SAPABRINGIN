import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck2, 
  Clock, 
  CalendarDays, 
  Layers, 
  PlusCircle, 
  ArrowUpRight, 
  FileText, 
  Filter, 
  RotateCcw,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { services, records, setActiveView, syncStatus, currentUser } = useApp();

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Current dates in WIB
  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const currentYearMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentYear = useMemo(() => {
    return String(new Date().getFullYear());
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // Filter by Service
      if (filterServiceId !== 'all' && rec.serviceId !== filterServiceId) {
        return false;
      }

      // Filter by Period
      if (filterPeriod === 'today') {
        return rec.serviceDate === today;
      } else if (filterPeriod === 'week') {
        const recDate = new Date(rec.serviceDate).getTime();
        const now = new Date().getTime();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        return recDate >= oneWeekAgo && recDate <= now;
      } else if (filterPeriod === 'month') {
        return rec.serviceDate.startsWith(currentYearMonth);
      } else if (filterPeriod === 'year') {
        return rec.serviceDate.startsWith(currentYear);
      } else if (filterPeriod === 'custom') {
        if (startDate && rec.serviceDate < startDate) return false;
        if (endDate && rec.serviceDate > endDate) return false;
      }

      return true;
    });
  }, [records, filterPeriod, filterServiceId, startDate, endDate, today, currentYearMonth, currentYear]);

  // Overall Stats Cards
  const totalPelayanan = records.length;
  const pelayananHariIni = records.filter(r => r.serviceDate === today).length;
  const pelayananBulanIni = records.filter(r => r.serviceDate.startsWith(currentYearMonth)).length;
  const jenisPelayananAktif = services.filter(s => s.isActive).length;

  // Chart 1: Pelayanan per Bulan (Jan - Des)
  const monthlyChartData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return months.map((monthName, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const count = records.filter(r => r.serviceDate.startsWith(monthPrefix)).length;
      return {
        month: monthName,
        jumlah: count,
      };
    });
  }, [records, currentYear]);

  // Chart 2: Pelayanan per Hari (Last 14 days or filtered period)
  const dailyChartData = useMemo(() => {
    const dayMap = new Map<string, number>();

    // Generate recent 14 days baseline
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      dayMap.set(dayKey, 0);
    }

    records.forEach(r => {
      if (dayMap.has(r.serviceDate)) {
        dayMap.set(r.serviceDate, (dayMap.get(r.serviceDate) || 0) + 1);
      }
    });

    return Array.from(dayMap.entries()).map(([dateStr, count]) => {
      const parts = dateStr.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      return {
        date: label,
        fullDate: dateStr,
        jumlah: count,
      };
    });
  }, [records]);

  // Chart 3: Berdasarkan Jenis Pelayanan
  const serviceDistributionData = useMemo(() => {
    const palette = ['#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#f59e0b', '#d97706', '#b45309', '#0d9488', '#0284c7'];
    return services
      .map((s, idx) => {
        const count = records.filter(r => r.serviceId === s.id).length;
        return {
          name: s.name,
          serviceId: s.id,
          jumlah: count,
          color: palette[idx % palette.length],
        };
      })
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [services, records]);

  // Table: Ringkasan Pelayanan
  const serviceSummaryTable = useMemo(() => {
    const totalCount = records.length || 1;
    return services
      .map(service => {
        const count = records.filter(r => r.serviceId === service.id).length;
        const percentage = ((count / totalCount) * 100).toFixed(1);
        return {
          id: service.id,
          name: service.name,
          sheetName: service.sheetName,
          count,
          percentage,
          isActive: service.isActive,
          description: service.description || 'Pelayanan administrasi masyarakat',
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [services, records]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome with fast actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Kecamatan Bringin</span>
              <span aria-hidden="true">·</span>
              <span>Kabupaten Semarang</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Tahun 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Pelayanan Masyarakat
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Pantau arus berkas permohonan warga secara aktual dan terintegrasi Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {currentUser?.role === 'ADMINISTRATOR' && (
              <button
                type="button"
                onClick={() => setActiveView('service-management')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                title="Tambah atau Ubah Struktur Jenis Pelayanan"
              >
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Manajemen Jenis Pelayanan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveView('service-form')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-emerald-950" />
              <span>Input Berkas Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reports')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pelayanan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Seluruh Pelayanan</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {totalPelayanan}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Akumulasi seluruh jenis sheet</div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pelayanan Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Pelayanan Hari Ini</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {pelayananHariIni}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Tanggal {today} (WIB)</div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pelayanan Bulan Ini */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Pelayanan Bulan Berjalan</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {pelayananBulanIni}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Bulan {currentYearMonth}</div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Jenis Pelayanan Aktif */}
        <div 
          onClick={() => currentUser?.role === 'ADMINISTRATOR' && setActiveView('service-management')}
          className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between transition-all ${
            currentUser?.role === 'ADMINISTRATOR' ? 'cursor-pointer hover:border-emerald-500 hover:shadow-sm group' : ''
          }`}
          title={currentUser?.role === 'ADMINISTRATOR' ? 'Klik untuk Mengelola / Tambah Jenis Pelayanan' : ''}
        >
          <div>
            <span className="text-xs font-medium text-slate-500">Jenis Pelayanan Aktif</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {jenisPelayananAktif}
              <span className="text-sm font-normal text-slate-400 ml-1">/ {services.length}</span>
            </div>
            {currentUser?.role === 'ADMINISTRATOR' ? (
              <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1 group-hover:underline">
                <span>Kelola Jenis Pelayanan</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-1">Sheet terkonfigurasi di sistem</div>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-100 transition-colors">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Segmented Period Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            <div className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Periode:</span>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setFilterPeriod('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'all'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('today')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'today'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'week'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Minggu Ini
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'month'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('year')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'year'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahun 2026
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('custom')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterPeriod === 'custom'
                    ? 'bg-white text-emerald-950 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rentang Kustom
              </button>
            </div>
          </div>

          {/* Service Dropdown & Custom Date range */}
          <div className="flex flex-wrap items-center gap-2">
            {filterPeriod === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <span>s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}

            <select
              value={filterServiceId}
              onChange={(e) => setFilterServiceId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            >
              <option value="all">Semua Jenis Pelayanan</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {(filterPeriod !== 'all' || filterServiceId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterPeriod('all');
                  setFilterServiceId('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reset filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 2-Column Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Pelayanan Per Bulan (Jan - Des) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>Grafik Pelayanan Per Bulan (2026)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribusi volume berkas Januari - Desember</p>
            </div>
            <span className="text-xs font-mono tabular-nums text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Total {totalPelayanan} berkas
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Berkas`, 'Jumlah']}
                  contentStyle={{ backgroundColor: '#064E3B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="jumlah" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tren Pelayanan Per Hari */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Tren Pelayanan Harian (14 Hari Terakhir)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Aktivitas loket pelayanan per hari</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(lbl, items) => {
                    const item = items[0]?.payload;
                    return item ? `Tanggal: ${item.fullDate}` : lbl;
                  }}
                  formatter={(val: any) => [`${val} Permohonan`, 'Pelayanan']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="jumlah"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#D97706' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Chart 3: Perbandingan Berdasarkan Kategori Pelayanan */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-700" />
              <span>Volume Berdasarkan Jenis Pelayanan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Komparasi jumlah permohonan yang dilayani petugas</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={serviceDistributionData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#334155' }} 
                width={120} 
                tickLine={false} 
              />
              <Tooltip
                formatter={(val: any) => [`${val} Berkas`, 'Jumlah']}
                contentStyle={{ backgroundColor: '#064E3B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="jumlah" radius={[0, 4, 4, 0]}>
                {serviceDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Ringkasan Pelayanan */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tabel Ringkasan Pelayanan Kecamatan Bringin
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan jenis pelayanan berdasarkan volume berkas terbanyak ke terendah.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 self-start sm:self-auto hidden sm:inline">
              Total {serviceSummaryTable.length} Kategori
            </span>
            {currentUser?.role === 'ADMINISTRATOR' && (
              <button
                type="button"
                onClick={() => setActiveView('service-management')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ubah / Tambah Jenis Pelayanan</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Jenis Pelayanan</th>
                <th className="py-3 px-4 hidden md:table-cell">Nama Sheet Database</th>
                <th className="py-3 px-4 text-center">Jumlah Pelayanan</th>
                <th className="py-3 px-4 text-center">Persentase</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceSummaryTable.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-emerald-800">
                    {item.sheetName}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900">
                    {item.count}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono tabular-nums text-slate-600 w-10 text-right">
                        {item.percentage}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div 
                          className="bg-emerald-600 h-1.5 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[11px] font-medium ${
                      item.isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveView('services', item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                      <span>Lihat Data</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
