import React, { useState } from 'react';
import { ServiceConfig, FormFieldConfig, InputFieldType } from '../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  MoveUp, 
  MoveDown, 
  Settings2, 
  ListPlus, 
  AlertCircle 
} from 'lucide-react';

interface ServiceEditorModalProps {
  service?: ServiceConfig | null; // if null, creating new service
  onClose: () => void;
  onSave: (serviceData: any) => Promise<void>;
}

const AVAILABLE_ICONS = [
  'FileText',
  'CreditCard',
  'Truck',
  'CornerDownRight',
  'ShieldCheck',
  'HeartHandshake',
  'HeartPulse',
  'Megaphone',
  'Baby',
  'FileBadge',
  'Users',
  'FolderKanban',
  'Layers',
];

const FIELD_TYPES: { value: InputFieldType; label: string }[] = [
  { value: 'text', label: 'Teks Singkat (Text)' },
  { value: 'textarea', label: 'Teks Panjang / Catatan (Textarea)' },
  { value: 'number', label: 'Angka (Number)' },
  { value: 'date', label: 'Tanggal (Date)' },
  { value: 'dropdown', label: 'Pilihan Dropdown' },
  { value: 'radio', label: 'Pilihan Radio' },
  { value: 'checkbox', label: 'Kotak Centang (Checkbox)' },
  { value: 'nik', label: 'Nomor NIK (16 Digit Teks)' },
  { value: 'email', label: 'Alamat Email' },
  { value: 'phone', label: 'Nomor Telepon / WhatsApp' },
];

export const ServiceEditorModal: React.FC<ServiceEditorModalProps> = ({
  service,
  onClose,
  onSave,
}) => {
  const isEditing = !!service;

  const [name, setName] = useState<string>(service?.name || '');
  const [sheetName, setSheetName] = useState<string>(service?.sheetName || '');
  const [icon, setIcon] = useState<string>(service?.icon || 'FileText');
  const [description, setDescription] = useState<string>(service?.description || '');
  const [isActive, setIsActive] = useState<boolean>(service ? service.isActive : true);

  // Dynamic fields
  const [fields, setFields] = useState<FormFieldConfig[]>(() => {
    if (service && service.fields) {
      return JSON.parse(JSON.stringify(service.fields));
    }
    // Default baseline fields for new service
    return [
      { id: 'nama_pemohon', label: 'Nama Pemohon', type: 'text', required: true, order: 1 },
      { id: 'nik', label: 'NIK Pemohon', type: 'nik', required: true, order: 2 },
      { id: 'desa', label: 'Desa', type: 'dropdown', required: true, order: 3, options: ['Bringin', 'Gogodalem', 'Kalijambe', 'Popongan', 'Rembes', 'Sambirejo', 'Sendang', 'Truko', 'Wiru', 'Wonokerto'] },
      { id: 'keterangan', label: 'Keterangan', type: 'textarea', required: false, order: 4 },
    ];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-generate Sheet Name when name changes if sheetName not manually set
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !sheetName) {
      const clean = val.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
      setSheetName(`PELAYANAN ${clean}`);
    }
  };

  const handleAddField = () => {
    const newFieldId = `field_${Date.now().toString(36)}`;
    const newField: FormFieldConfig = {
      id: newFieldId,
      label: `Kolom Baru ${fields.length + 1}`,
      type: 'text',
      required: false,
      order: fields.length + 1,
      options: ['Pilihan 1', 'Pilihan 2'],
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormFieldConfig>) => {
    setFields(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleDeleteField = (index: number) => {
    const field = fields[index];
    if (field.id === 'nama_pemohon' || field.id === 'nik') {
      alert('Kolom "Nama Pemohon" dan "NIK" merupakan data wajib sistem dan tidak dapat dihapus.');
      return;
    }
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...fields];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    // update order numbers
    copy.forEach((f, idx) => { f.order = idx + 1; });
    setFields(copy);
  };

  // Dropdown options management
  const handleAddOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const currentOptions = field.options || [];
    const newOptionName = `Opsi ${currentOptions.length + 1}`;
    handleUpdateField(fieldIndex, { options: [...currentOptions, newOptionName] });
  };

  const handleUpdateOption = (fieldIndex: number, optIndex: number, newVal: string) => {
    const field = fields[fieldIndex];
    const currentOptions = [...(field.options || [])];
    currentOptions[optIndex] = newVal;
    handleUpdateField(fieldIndex, { options: currentOptions });
  };

  const handleDeleteOption = (fieldIndex: number, optIndex: number) => {
    const field = fields[fieldIndex];
    const currentOptions = (field.options || []).filter((_, i) => i !== optIndex);
    handleUpdateField(fieldIndex, { options: currentOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Nama pelayanan wajib diisi.';
    if (!sheetName.trim()) errs.sheetName = 'Nama sheet Google Sheets wajib diisi.';
    if (fields.length === 0) errs.fields = 'Minimal harus memiliki 1 kolom formulir.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(service || {}),
        name: name.trim(),
        sheetName: sheetName.trim().toUpperCase(),
        icon,
        description: description.trim(),
        isActive,
        fields,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message || 'Kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div>
            <div className="text-[11px] font-medium text-amber-300">
              MANAJEMEN JENIS PELAYANAN & FORMULIR DINAMIS
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              {isEditing ? `Ubah Pelayanan: ${service.name}` : 'Tambah Jenis Pelayanan Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          
          {/* Section 1: Basic Config */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Identitas & Koneksi Sheet Pelayanan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Pelayanan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Jenis Pelayanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cetak KK, Izin Reklame, dll"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 ${
                    errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              {/* Nama Sheet Google Sheets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sheet Google Sheets <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PELAYANAN CETAK KK"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 uppercase ${
                    errors.sheetName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sistem otomatis membuat tab sheet baru dengan nama ini di Google Sheets.
                </p>
              </div>

              {/* Ikon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ikon Menu
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800"
                >
                  {AVAILABLE_ICONS.map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Pelayanan
                </label>
                <div className="flex items-center gap-4 py-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={isActive}
                      onChange={() => setIsActive(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-emerald-800">Aktif</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={!isActive}
                      onChange={() => setIsActive(false)}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span className="font-medium text-slate-500">Nonaktif</span>
                  </label>
                </div>
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan ringkas tentang prosedur atau syarat pelayanan ini"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dynamic Form Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Konfigurasi Struktur Formulir Input
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Atur kolom-kolom input yang muncul ketika petugas mengisi berkas ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kolom</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const isCore = field.id === 'nama_pemohon' || field.id === 'nik';
                const hasOptions = field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox';

                return (
                  <div
                    key={field.id}
                    className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-600 font-bold shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={field.label}
                          disabled={isCore}
                          onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                          className="font-semibold text-slate-900 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          placeholder="Nama Label Kolom"
                        />
                        {isCore && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Wajib Sistem
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Type Selector */}
                        <select
                          value={field.type}
                          disabled={isCore}
                          onChange={(e) => handleUpdateField(index, { type: e.target.value as InputFieldType })}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700"
                        >
                          {FIELD_TYPES.map(ft => (
                            <option key={ft.value} value={ft.value}>{ft.label}</option>
                          ))}
                        </select>

                        {/* Required Toggle */}
                        <label className="inline-flex items-center gap-1.5 cursor-pointer ml-1">
                          <input
                            type="checkbox"
                            checked={field.required}
                            disabled={isCore}
                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-[11px] text-slate-600">Wajib</span>
                        </label>

                        {/* Order Controls */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveField(index, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Geser ke atas"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === fields.length - 1}
                            onClick={() => handleMoveField(index, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Geser ke bawah"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Field */}
                        {!isCore && (
                          <button
                            type="button"
                            onClick={() => handleDeleteField(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Hapus Kolom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* If type is Dropdown, Radio, or Checkbox: allow adding/editing choices */}
                    {hasOptions && (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200/80 space-y-2 ml-7">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Pilihan Opsi ({field.type.toUpperCase()}):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddOption(index)}
                            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                          >
                            <ListPlus className="w-3 h-3" />
                            <span>Tambah Pilihan</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(field.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(index, optIdx, e.target.value)}
                                className="text-xs text-slate-800 bg-transparent focus:outline-none w-28"
                              />
                              {(field.options || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOption(index, optIdx)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </form>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-950" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi Pelayanan'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
