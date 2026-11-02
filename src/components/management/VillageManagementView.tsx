import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VillageItem } from '../../types';
import { 
  MapPin, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  AlertTriangle, 
  Building2, 
  Users, 
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export const VillageManagementView: React.FC = () => {
  const { villages, records, addVillage, updateVillage, deleteVillage, toggleVillageStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVillage, setEditingVillage] = useState<VillageItem | null>(null);

  // Form inputs
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [headName, setHeadName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Delete modal state
  const [villageToDelete, setVillageToDelete] = useState<VillageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtered villages
  const filteredVillages = useMemo(() => {
    return villages.filter(v => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = v.name.toLowerCase().includes(q);
        const matchCode = (v.code || '').toLowerCase().includes(q);
        const matchHead = (v.headName || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchHead) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [villages, searchQuery]);

  const handleOpenAdd = () => {
    setEditingVillage(null);
    setName('');
    setCode(`33.22.11.20${String(villages.length + 1).padStart(2, '0')}`);
    setHeadName('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VillageItem) => {
    setEditingVillage(v);
    setName(v.name);
    setCode(v.code || '');
    setHeadName(v.headName || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama desa wajib diisi.');
      return;
    }

    if (editingVillage) {
      const ok = await updateVillage(editingVillage.id, name, code, headName);
      if (ok) setIsModalOpen(false);
    } else {
      const ok = await addVillage(name, code, headName);
      if (ok) setIsModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!villageToDelete) return;
    setIsDeleting(true);
    await deleteVillage(villageToDelete.id);
    setIsDeleting(false);
    setVillageToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Master Data Wilayah</span>
            <span aria-hidden="true">·</span>
            <span>Kecamatan Bringin, Kabupaten Semarang</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Data Desa & Kelurahan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Tambah, perbarui, atau nonaktifkan wilayah desa. Setiap perubahan otomatis tersinkronisasi pada pilihan dropdown seluruh formulir pelayanan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-950" />
          <span>Tambah Desa Baru</span>
        </button>
      </div>

      {/* Info notice */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Sinkronisasi Otomatis:</strong> Ketika Anda menambah atau mengedit nama desa di sini, pilihan dropdown pada 13 formulir pelayanan (*Cetak KK, KTP/KIA, SKCK, Pindah, Ahli Waris, dll.*) serta filter laporan otomatis diperbarui tanpa perlu mengubah pengaturan formulir satu per satu.
        </div>
      </div>

      {/* Search and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama desa, kode, atau kepala desa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          <div className="text-slate-500">
            Total Wilayah: <strong className="font-mono text-slate-800">{villages.length} Desa</strong>
          </div>
        </div>

        {/* Villages Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-950 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Desa / Kelurahan</th>
                <th className="py-3 px-4">Kode Kemendagri</th>
                <th className="py-3 px-4">Kepala Desa / Pejabat</th>
                <th className="py-3 px-4 text-center">Total Berkas Pelayanan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVillages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada nama desa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredVillages.map((village, index) => {
                  const recordCount = records.filter(r => 
                    r.data?.desa === village.name || 
                    r.data?.desa_asal === village.name || 
                    r.data?.desa_tujuan === village.name
                  ).length;

                  return (
                    <tr key={village.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-bold text-slate-900 text-sm">
                            Desa {village.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {village.code || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {village.headName || '-'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900">
                        {recordCount} Berkas
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleVillageStatus(village.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                            village.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                          title="Klik untuk mengubah status aktif/nonaktif"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${village.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          <span>{village.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(village)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Data Desa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setVillageToDelete(village)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Desa"
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
      </div>

      {/* Add / Edit Village Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingVillage ? 'Ubah Data Desa' : 'Tambah Desa / Kelurahan Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg mb-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bringin, Sambirejo, dll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kode Wilayah Kemendagri
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 33.22.11.2001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kepala Desa / Penanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Nama Kepala Desa / Lurah"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                >
                  <Save className="w-4 h-4 text-emerald-950" />
                  <span>{editingVillage ? 'Simpan Perubahan' : 'Tambah Desa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {villageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Hapus Data Desa</h3>
            </div>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>Desa {villageToDelete.name}</strong> dari daftar wilayah Kecamatan Bringin?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVillageToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
