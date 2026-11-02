import React from 'react';
import { ServiceRecord, ServiceConfig } from '../../types';
import { X, Printer, Calendar, User, CreditCard, MapPin, Hash, Clock, FileText } from 'lucide-react';

interface ServiceDetailModalProps {
  record: ServiceRecord;
  service?: ServiceConfig;
  onClose: () => void;
  onEdit: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  record,
  service,
  onClose,
  onEdit,
}) => {
  const customFields = service ? service.fields : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div>
            <div className="text-[11px] font-medium text-amber-300">
              KECAMATAN BRINGIN · KABUPATEN SEMARANG
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Detail Berkas Pelayanan: {service?.name || 'Pelayanan'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Registration highlight box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Nomor Registrasi
              </span>
              <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">
                {record.registrationNumber}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">Tanggal Pelayanan:</span>
                <div className="font-semibold text-slate-800 font-mono mt-0.5">
                  {record.serviceDate}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Petugas Input:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {record.createdBy}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Applicant Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-200">
              Data Pokok Pemohon
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">Nama Lengkap Pemohon</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{record.applicantName}</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-100">
                <div className="text-slate-500 text-[11px]">Nomor Induk Kependudukan (NIK)</div>
                <div className="font-bold font-mono text-slate-900 text-sm mt-0.5 tracking-wider">{record.nik}</div>
              </div>
            </div>
          </div>

          {/* Dynamic Service Specific Fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1.5 border-b border-slate-200">
              Rincian Informasi Pelayanan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customFields
                .filter(f => f.id !== 'nama_pemohon' && f.id !== 'nik' && f.id !== 'keterangan')
                .map(field => {
                  const val = record.data && record.data[field.id] !== undefined ? record.data[field.id] : '-';
                  return (
                    <div key={field.id} className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-slate-500 text-[11px]">{field.label}</div>
                      <div className="font-semibold text-slate-800 mt-0.5 whitespace-pre-wrap">
                        {Array.isArray(val) ? val.join(', ') : String(val || '-')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Keterangan / Catatan Loket
            </h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap min-h-12 leading-relaxed">
              {record.notes || record.data?.keterangan || 'Tidak ada catatan tambahan.'}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-2 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div>ID Dokumen: <span className="font-mono">{record.id}</span></div>
            <div>Waktu Simpan: <span className="font-mono">{record.createdAt}</span></div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Tanda Terima</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-4 py-1.5 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
            >
              Ubah Data Ini
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
