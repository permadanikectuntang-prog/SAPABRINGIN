import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceConfig, ServiceRecord, FormFieldConfig } from '../../types';
import { formatDisplayDate, formatFullIndonesianDate } from '../../utils/dateUtils';
import { 
  Save, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Calendar, 
  Hash, 
  Info 
} from 'lucide-react';

interface ServiceFormViewProps {
  initialServiceId?: string | null;
  editingRecord?: ServiceRecord | null;
  onBack: () => void;
  onSaved: (savedRecord: ServiceRecord) => void;
}

export const ServiceFormView: React.FC<ServiceFormViewProps> = ({
  initialServiceId,
  editingRecord,
  onBack,
  onSaved,
}) => {
  const { services, addRecord, updateRecord, showToast } = useApp();

  // Active service selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    if (editingRecord) return editingRecord.serviceId;
    if (initialServiceId && initialServiceId !== 'all') return initialServiceId;
    return services[0]?.id || '';
  });

  const activeService: ServiceConfig | undefined = services.find(s => s.id === selectedServiceId) || services[0];

  // Form Fields State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [applicantName, setApplicantName] = useState<string>('');
  const [nik, setNik] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form data when activeService or editingRecord changes
  useEffect(() => {
    if (editingRecord) {
      setSelectedServiceId(editingRecord.serviceId);
      setApplicantName(editingRecord.applicantName || '');
      setNik(editingRecord.nik || '');
      setServiceDate(editingRecord.serviceDate || new Date().toISOString().split('T')[0]);
      setNotes(editingRecord.notes || editingRecord.data?.keterangan || '');
      setFormData(editingRecord.data || {});
    } else {
      // Default initial empty values based on active service fields
      const defaults: Record<string, any> = {};
      if (activeService) {
        activeService.fields.forEach(field => {
          if (field.defaultValue) {
            defaults[field.id] = field.defaultValue;
          } else if (field.type === 'dropdown' && field.options && field.options.length > 0) {
            // keep empty or first option if required
            defaults[field.id] = '';
          }
        });
      }
      setFormData(defaults);
      setApplicantName('');
      setNik('');
      setServiceDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setValidationErrors({});
    }
  }, [selectedServiceId, editingRecord, activeService]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear validation error on change
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep numbers only and strictly text
    const clean = e.target.value.replace(/[^\d]/g, '');
    setNik(clean);
    if (validationErrors.nik) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.nik;
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!applicantName.trim()) {
      errors.applicantName = 'Nama pemohon wajib diisi.';
    }

    if (!nik.trim()) {
      errors.nik = 'NIK pemohon wajib diisi.';
    } else if (nik.length !== 16) {
      errors.nik = `NIK harus tepat 16 digit (saat ini ${nik.length} digit).`;
    }

    if (!serviceDate) {
      errors.serviceDate = 'Tanggal pelayanan wajib diisi.';
    }

    // Dynamic field validation
    if (activeService) {
      activeService.fields.forEach(field => {
        if (field.id === 'nama_pemohon' || field.id === 'nik' || field.id === 'keterangan') {
          return; // already handled
        }
        if (field.required) {
          const val = formData[field.id];
          if (val === undefined || val === null || String(val).trim() === '') {
            errors[field.id] = `${field.label} wajib diisi.`;
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !activeService) {
      showToast('error', 'Silakan lengkapi seluruh kolom wajib yang bertanda bintang (*).');
      return;
    }

    setIsSubmitting(true);

    try {
      const mergedData = {
        ...formData,
        serviceDate,
        keterangan: notes,
      };

      if (editingRecord) {
        await updateRecord(
          activeService.id,
          editingRecord.id,
          applicantName,
          nik,
          mergedData,
          notes
        );
        onSaved({
          ...editingRecord,
          applicantName,
          nik,
          serviceDate,
          data: mergedData,
          notes,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const saved = await addRecord(
          activeService.id,
          applicantName,
          nik,
          mergedData,
          notes
        );

        // Reset form for next input
        setApplicantName('');
        setNik('');
        setNotes('');
        const defaults: Record<string, any> = {};
        activeService.fields.forEach(field => {
          if (field.defaultValue) defaults[field.id] = field.defaultValue;
        });
        setFormData(defaults);
        setValidationErrors({});

        onSaved(saved);
      }
    } catch (err: any) {
      showToast('error', `Gagal menyimpan data: ${err.message || 'Kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Kosongkan formulir input ini?')) {
      setApplicantName('');
      setNik('');
      setNotes('');
      setFormData({});
      setValidationErrors({});
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Data</span>
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {editingRecord ? 'Ubah Data Pelayanan' : 'Formulir Input Pelayanan'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencatatan administrasi pelayanan masyarakat Kecamatan Bringin, Kabupaten Semarang.
          </p>
        </div>

        {/* Service Selector (disabled in edit mode) */}
        {!editingRecord && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Pilih Jenis:</span>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {!s.isActive ? '(Nonaktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Dynamic Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Service Subheader */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              {activeService?.sheetName || 'PELAYANAN'}
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              {activeService?.name}
            </h2>
          </div>
          <span className="text-xs text-emerald-200 font-mono hidden sm:inline-block">
            Sheet Google Sheets: {activeService?.sheetName}
          </span>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Section 1: Standard Base Fields */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 mb-4 flex items-center justify-between">
              <span>Informasi Utama Pemohon</span>
              <span className="text-[11px] font-normal text-rose-500 normal-case">* Kolom wajib diisi</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Tanggal Pelayanan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hari / Tanggal Pelayanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 ${
                    validationErrors.serviceDate ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {serviceDate && (
                  <p className="text-[10px] text-emerald-800 font-medium mt-1">
                    Format: {formatDisplayDate(serviceDate)} ({formatFullIndonesianDate(serviceDate)})
                  </p>
                )}
                {validationErrors.serviceDate && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.serviceDate}</p>
                )}
              </div>

              {/* Nama Pemohon */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pemohon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap sesuai KTP"
                  value={applicantName}
                  onChange={(e) => {
                    setApplicantName(e.target.value);
                    if (validationErrors.applicantName) {
                      setValidationErrors(prev => {
                        const copy = { ...prev };
                        delete copy.applicantName;
                        return copy;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 ${
                    validationErrors.applicantName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.applicantName && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.applicantName}</p>
                )}
              </div>

              {/* NIK (Nomor Induk Kependudukan) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${nik.length === 16 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    {nik.length} / 16 Digit
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 3322110805820003 (Disimpan sebagai teks persis)"
                  value={nik}
                  onChange={handleNikChange}
                  className={`w-full px-3 py-2 text-xs font-mono tracking-wider bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-900 ${
                    validationErrors.nik ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.nik ? (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.nik}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Angka nol di depan dipertahankan otomatis saat sinkronisasi Google Sheets.
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Section 2: Dynamic Service Fields */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 mb-4">
              Kolom Spesifik Pelayanan: {activeService?.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeService?.fields
                .filter(f => f.id !== 'nama_pemohon' && f.id !== 'nik' && f.id !== 'keterangan')
                .map(field => {
                  const val = formData[field.id] !== undefined ? formData[field.id] : '';
                  const hasError = !!validationErrors[field.id];

                  return (
                    <div 
                      key={field.id}
                      className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                    >
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {/* Dropdown Input */}
                      {field.type === 'dropdown' && (
                        <select
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 ${
                            hasError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* Textarea Input */}
                      {field.type === 'textarea' && (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 ${
                            hasError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      )}

                      {/* Date Input */}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 ${
                            hasError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      )}

                      {/* Number Input */}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder || '0'}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-mono ${
                            hasError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      )}

                      {/* Radio buttons */}
                      {field.type === 'radio' && (
                        <div className="flex flex-wrap items-center gap-4 py-1">
                          {(field.options || []).map(opt => (
                            <label key={opt} className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={val === opt}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Checkbox group */}
                      {field.type === 'checkbox' && (
                        <div className="flex flex-wrap items-center gap-4 py-1">
                          {(field.options || []).map(opt => {
                            const currentArr = Array.isArray(val) ? val : [];
                            const isChecked = currentArr.includes(opt);
                            return (
                              <label key={opt} className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleFieldChange(field.id, [...currentArr, opt]);
                                    } else {
                                      handleFieldChange(field.id, currentArr.filter((x: string) => x !== opt));
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Standard Text / Email / Phone */}
                      {field.type !== 'dropdown' && field.type !== 'textarea' && field.type !== 'date' && field.type !== 'number' && field.type !== 'radio' && field.type !== 'checkbox' && (
                        <input
                          type={field.type === 'email' ? 'email' : (field.type === 'phone' ? 'tel' : 'text')}
                          placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}`}
                          value={val}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 ${
                            hasError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                          }`}
                        />
                      )}

                      {hasError && (
                        <p className="text-[11px] text-rose-500 mt-1">{validationErrors[field.id]}</p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 3: Notes / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Loket / Keterangan Tambahan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan persyaratan, kelengkapan berkas, nomor surat pengantar, atau disposisi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
            />
          </div>

        </div>

        {/* Action Buttons Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Tabel</span>
          </button>

          <div className="flex items-center gap-2.5">
            {!editingRecord && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset Form</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-emerald-950" />
              <span>{isSubmitting ? 'Menyimpan...' : (editingRecord ? 'Simpan Perubahan' : 'SIMPAN DATA')}</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
