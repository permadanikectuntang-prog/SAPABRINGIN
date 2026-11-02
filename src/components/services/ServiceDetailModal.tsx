import React, { useState } from 'react';
import { ServiceRecord, ServiceConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import { BringinEmblem } from '../common/BringinEmblem';
import { formatDisplayDate, formatFullIndonesianDate } from '../../utils/dateUtils';
import { X, Printer, Calendar, User, FileText, CheckCircle2, ShieldCheck, Hash, Eye } from 'lucide-react';

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
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<'detail' | 'preview_receipt'>('detail');

  const customFields = service ? service.fields : [];

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* On-screen Modal Dialog (hidden on print) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
          role="dialog"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
            <div className="flex items-center gap-3">
              <BringinEmblem size="sm" logoUrl={settings.logoUrl} className="shrink-0" />
              <div>
                <div className="text-[11px] font-medium text-amber-300">
                  KECAMATAN BRINGIN · KABUPATEN SEMARANG
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Detail Berkas: {service?.name || 'Pelayanan'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'detail'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rincian Berkas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview_receipt')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview_receipt'
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Pratinjau Tanda Terima Resmi</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {activeTab === 'detail' ? (
              <>
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
                      <div className="font-semibold text-slate-800 font-mono mt-0.5" title={formatFullIndonesianDate(record.serviceDate)}>
                        {formatDisplayDate(record.serviceDate)}
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
              </>
            ) : (
              /* Receipt Document Preview */
              <div className="bg-white p-5 border border-slate-300 rounded-lg shadow-xs space-y-4 text-slate-800">
                {/* Preview Kop */}
                <div className="text-center border-b-2 border-double border-slate-900 pb-3">
                  <div className="flex items-center justify-center gap-3">
                    <BringinEmblem size="md" logoUrl={settings.logoUrl} className="shrink-0" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        PEMERINTAH KABUPATEN SEMARANG
                      </div>
                      <div className="text-sm font-black uppercase text-emerald-950">
                        KECAMATAN BRINGIN
                      </div>
                      <div className="text-[10px] text-slate-600 leading-tight">
                        {settings.institutionAddress}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="font-bold text-xs uppercase underline">
                    SURAT BUKTI TANDA TERIMA BERKAS PELAYANAN
                  </h4>
                  <p className="text-[10px] font-mono font-bold text-slate-600 mt-0.5">
                    Nomor: {record.registrationNumber}
                  </p>
                </div>

                <table className="w-full text-[11px] border border-slate-200">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="w-36 py-1 px-2 font-medium bg-slate-50">Jenis Pelayanan</td>
                      <td className="py-1 px-2 font-bold text-emerald-950">{service?.name || 'Pelayanan'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 px-2 font-medium bg-slate-50">Nama Pemohon</td>
                      <td className="py-1 px-2 font-bold">{record.applicantName}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 px-2 font-medium bg-slate-50">NIK Pemohon</td>
                      <td className="py-1 px-2 font-mono">{record.nik}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 px-2 font-medium bg-slate-50">Desa / Alamat</td>
                      <td className="py-1 px-2">{record.data?.desa || record.data?.desa_asal || '-'}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1 px-2 font-medium bg-slate-50">Tanggal Permohonan</td>
                      <td className="py-1 px-2 font-mono">{formatFullIndonesianDate(record.serviceDate)} ({formatDisplayDate(record.serviceDate)})</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-medium bg-slate-50">Catatan Loket</td>
                      <td className="py-1 px-2">{record.notes || record.data?.keterangan || 'Berkas lengkap dan diterima untuk diproses.'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-2 text-center text-[10px] pt-3">
                  <div>
                    <div>Pemohon,</div>
                    <div className="h-12"></div>
                    <div className="font-bold underline uppercase">{record.applicantName}</div>
                  </div>
                  <div>
                    <div>Bringin, {currentDateFormatted}</div>
                    <div>Petugas Loket PATEN,</div>
                    <div className="h-10"></div>
                    <div className="font-bold underline uppercase">{record.createdBy}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-950" />
              <span>Cetak Tanda Terima Resmi</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Ubah Data Ini
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Official Printable Receipt Document (Only rendered on window.print()) */}
      <div className="print-only p-8 text-black bg-white max-w-3xl mx-auto font-serif">
        {/* Official Kop Surat */}
        <div className="text-center border-b-4 border-double border-black pb-4 mb-4">
          <div className="flex items-center justify-center gap-4">
            <BringinEmblem size="lg" logoUrl={settings.logoUrl} className="shrink-0 w-20 h-20" />
            <div className="text-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                PEMERINTAH KABUPATEN SEMARANG
              </h3>
              <h2 className="text-xl font-black uppercase tracking-wider text-black mt-0.5">
                KECAMATAN BRINGIN
              </h2>
              <div className="text-xs font-bold uppercase text-black">
                PELAYANAN ADMINISTRASI TERPADU KECAMATAN (PATEN)
              </div>
              <p className="text-[11px] text-black mt-1 leading-tight">
                {settings.institutionAddress || 'Jl. Raya Bringin No. 1 Bringin, Kab. Semarang, Jawa Tengah 50772'}
                <br />
                Pos-el: paten.bringin@semarangkab.go.id · Laman: sapa-bringin.semarangkab.go.id
              </p>
            </div>
            <div className="w-16" />
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold uppercase underline decoration-black underline-offset-4">
            SURAT BUKTI TANDA TERIMA BERKAS PERMOHONAN PELAYANAN
          </h2>
          <div className="text-xs font-mono font-bold mt-1">
            Nomor Registrasi: {record.registrationNumber}
          </div>
        </div>

        {/* Receipt Content */}
        <div className="text-xs leading-relaxed space-y-4">
          <p>
            Telah diterima berkas permohonan pelayanan administrasi masyarakat dari:
          </p>

          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="w-44 py-1.5 font-bold">Nama Pemohon</td>
                <td className="w-4 py-1.5">:</td>
                <td className="py-1.5 font-bold text-sm">{record.applicantName}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Nomor Induk Kependudukan (NIK)</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5 font-mono font-bold tracking-wider">{record.nik}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Desa / Kelurahan</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{record.data?.desa || record.data?.desa_asal || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">RT / RW</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">RT {record.data?.rt || '-'} / RW {record.data?.rw || '-'}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Jenis Pelayanan</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5 font-bold">{service?.name || record.serviceId}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold">Tanggal Permohonan</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5 font-mono">{formatFullIndonesianDate(record.serviceDate)} ({formatDisplayDate(record.serviceDate)})</td>
              </tr>
              {customFields
                .filter(f => f.id !== 'nama_pemohon' && f.id !== 'nik' && f.id !== 'keterangan' && f.id !== 'desa' && f.id !== 'rt' && f.id !== 'rw')
                .slice(0, 5)
                .map(field => {
                  const val = record.data && record.data[field.id] !== undefined ? record.data[field.id] : '-';
                  return (
                    <tr key={field.id}>
                      <td className="py-1.5 font-bold">{field.label}</td>
                      <td className="py-1.5">:</td>
                      <td className="py-1.5">{Array.isArray(val) ? val.join(', ') : String(val || '-')}</td>
                    </tr>
                  );
                })}
              <tr>
                <td className="py-1.5 font-bold">Catatan Petugas</td>
                <td className="py-1.5">:</td>
                <td className="py-1.5">{record.notes || record.data?.keterangan || 'Berkas telah diperiksa dan dinyatakan lengkap untuk diproses.'}</td>
              </tr>
            </tbody>
          </table>

          {/* Important instructions */}
          <div className="border border-black p-3 rounded text-[11px] space-y-1">
            <div className="font-bold">PERHATIAN:</div>
            <div>1. Tanda terima ini adalah bukti sah penyerahan berkas permohonan di Loket PATEN Kecamatan Bringin.</div>
            <div>2. Harap membawa tanda terima ini saat pengambilan dokumen hasil pelayanan.</div>
            <div>3. Pelayanan tidak dipungut biaya (GRATIS) sesuai peraturan perundang-undangan yang berlaku.</div>
          </div>

          {/* Signature Grid */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div>
              <p>Pemohon,</p>
              <div className="h-20" />
              <p className="font-bold underline uppercase">({record.applicantName})</p>
            </div>
            <div>
              <p>Bringin, {currentDateFormatted}</p>
              <p>Petugas Loket PATEN,</p>
              <div className="h-20" />
              <p className="font-bold underline uppercase">({record.createdBy})</p>
            </div>
          </div>

          {/* Mengetahui */}
          <div className="pt-4 text-center text-xs">
            <p>Mengetahui,</p>
            <p className="font-bold">KASI PELAYANAN UMUM KECAMATAN BRINGIN</p>
            <div className="h-16" />
            <p className="font-bold underline uppercase">{settings.signers?.kasiName || 'AGUS PRIYONO, S.STP'}</p>
            <p className="font-mono text-[10px]">NIP. {settings.signers?.kasiNip || '19820415 200604 1 005'}</p>
          </div>
        </div>
      </div>
    </>
  );
};
