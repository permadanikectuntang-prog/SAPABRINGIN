import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceConfig } from '../../types';
import { ServiceEditorModal } from './ServiceEditorModal';
import { getServiceIcon } from '../layout/Sidebar';
import { 
  Sliders, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Layers, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle,
  MoveUp,
  MoveDown
} from 'lucide-react';

export const ServiceManagementView: React.FC = () => {
  const { services, records, addService, updateService, deleteService, toggleServiceStatus } = useApp();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedServiceToEdit, setSelectedServiceToEdit] = useState<ServiceConfig | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceConfig | null>(null);

  const sortedServices = [...services].sort((a, b) => a.order - b.order);

  const handleOpenAdd = () => {
    setSelectedServiceToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (srv: ServiceConfig) => {
    setSelectedServiceToEdit(srv);
    setIsEditorOpen(true);
  };

  const handleSaveService = async (serviceData: any) => {
    if (selectedServiceToEdit) {
      await updateService(serviceData);
    } else {
      await addService(serviceData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    await deleteService(serviceToDelete.id);
    setServiceToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Pengaturan Sistem</span>
            <span aria-hidden="true">·</span>
            <span>Hak Akses: Administrator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Jenis Pelayanan & Formulir
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Tambah jenis pelayanan baru, modifikasi struktur formulir input, dan kelola sinkronisasi Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-emerald-950" />
          <span>Tambah Jenis Pelayanan</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Kategori Pelayanan ({services.length} Terdaftar)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap perubahan pada jenis pelayanan akan otomatis tercermin pada sidebar, formulir, dan Google Sheets.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-emerald-950 text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">Urutan</th>
                <th className="py-3 px-3.5">Nama Jenis Pelayanan</th>
                <th className="py-3 px-3.5">Nama Sheet Database</th>
                <th className="py-3 px-3.5 text-center">Jumlah Kolom</th>
                <th className="py-3 px-3.5 text-center">Total Berkas</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedServices.map((service, index) => {
                const recordCount = records.filter(r => r.serviceId === service.id).length;
                const fieldCount = (service.fields || []).length;

                return (
                  <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-600">
                      {service.order || index + 1}
                    </td>

                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                          {getServiceIcon(service.icon)}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {service.name}
                          </div>
                          <div className="text-[11px] text-slate-400 max-w-xs truncate">
                            {service.description || 'Tidak ada deskripsi'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 font-mono text-emerald-900 text-[11px]">
                      {service.sheetName}
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <span className="font-mono tabular-nums text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {fieldCount} Kolom
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 text-center font-mono font-bold tabular-nums text-slate-900">
                      {recordCount}
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleServiceStatus(service.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          service.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title="Klik untuk mengubah status aktif/nonaktif"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span>{service.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(service)}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                          title="Edit Formulir & Kolom"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Atur</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setServiceToDelete(service)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Pelayanan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <ServiceEditorModal
          service={selectedServiceToEdit}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveService}
        />
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Pelayanan</h3>
                <p className="text-slate-500 text-[11px]">Kategori: {serviceToDelete.name}</p>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed my-4">
              Apakah Anda yakin ingin menghapus jenis pelayanan <strong>"{serviceToDelete.name}"</strong>?
              <br /><br />
              <span className="text-emerald-800 font-medium">Catatan Keamanan:</span> Seluruh berkas pelayanan yang pernah masuk sebelumnya tetap tersimpan aman di database arsip dan Google Sheets.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Ya, Hapus Pelayanan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
