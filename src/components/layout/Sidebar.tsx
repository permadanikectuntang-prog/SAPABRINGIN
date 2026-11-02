import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FolderArchive, 
  ChevronDown, 
  ChevronRight, 
  Sliders, 
  FileText, 
  History, 
  Users, 
  Settings, 
  PlusCircle,
  FileCheck,
  CreditCard,
  Truck,
  CornerDownRight,
  ShieldCheck,
  HeartHandshake,
  HeartPulse,
  Megaphone,
  Baby,
  FileBadge,
  FolderKanban,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapper for dynamic services
export const getServiceIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'filetext':
      return <FileText className="w-4 h-4 shrink-0" />;
    case 'creditcard':
      return <CreditCard className="w-4 h-4 shrink-0" />;
    case 'truck':
      return <Truck className="w-4 h-4 shrink-0" />;
    case 'cornerdownright':
      return <CornerDownRight className="w-4 h-4 shrink-0" />;
    case 'shieldcheck':
      return <ShieldCheck className="w-4 h-4 shrink-0" />;
    case 'hearthandshake':
      return <HeartHandshake className="w-4 h-4 shrink-0" />;
    case 'heartpulse':
      return <HeartPulse className="w-4 h-4 shrink-0" />;
    case 'megaphone':
      return <Megaphone className="w-4 h-4 shrink-0" />;
    case 'baby':
      return <Baby className="w-4 h-4 shrink-0" />;
    case 'filebadge':
      return <FileBadge className="w-4 h-4 shrink-0" />;
    case 'users':
      return <Users className="w-4 h-4 shrink-0" />;
    case 'folderkanban':
      return <FolderKanban className="w-4 h-4 shrink-0" />;
    default:
      return <Layers className="w-4 h-4 shrink-0" />;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { services, records, activeView, activeServiceId, setActiveView, currentUser } = useApp();
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(true);

  const isAdmin = currentUser?.role === 'ADMINISTRATOR';

  // Sort services according to order config
  const sortedServices = [...services].sort((a, b) => a.order - b.order);

  const handleNav = (view: string, serviceId: string | null = null) => {
    setActiveView(view, serviceId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-72 bg-emerald-900 text-emerald-50 border-r border-emerald-950 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-800">
          
          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'dashboard'
                ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Dashboard Utama</span>
          </button>

          {/* 2. Data Pelayanan Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsServicesExpanded(!isServicesExpanded)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-300 uppercase tracking-wider hover:bg-emerald-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-300" />
                <span>Data Pelayanan</span>
              </div>
              {isServicesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>

            {isServicesExpanded && (
              <div className="mt-1 pl-2 space-y-0.5 border-l border-emerald-800/60 ml-3">
                {/* Semua Pelayanan */}
                <button
                  type="button"
                  onClick={() => handleNav('services', 'all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeView === 'services' && activeServiceId === 'all'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Semua Pelayanan</span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    {records.length}
                  </span>
                </button>

                {/* Dynamic Services List */}
                {sortedServices.map(service => {
                  const serviceRecordCount = records.filter(r => r.serviceId === service.id).length;
                  const isSelected = activeView === 'services' && activeServiceId === service.id;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleNav('services', service.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-800 text-white font-semibold shadow-xs border border-emerald-700/60'
                          : 'text-emerald-200 hover:bg-emerald-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-amber-400/90">
                          {getServiceIcon(service.icon)}
                        </span>
                        <span className="truncate">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!service.isActive && (
                          <span className="text-[9px] text-amber-300 bg-amber-950/60 px-1 rounded">Off</span>
                        )}
                        <span className="text-[10px] font-mono tabular-nums text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          {serviceRecordCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Input Button */}
          <div className="pt-2 pb-1">
            <button
              type="button"
              onClick={() => handleNav('service-form')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-950" />
              <span>Input Pelayanan Baru</span>
            </button>
          </div>

          <div className="pt-2 border-t border-emerald-800/60 space-y-1">
            {/* 3. Manajemen Jenis Pelayanan (Admin Only) */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('service-management')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'service-management'
                      ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Manajemen Jenis Pelayanan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('villages')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'villages'
                      ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Manajemen Data Desa</span>
                </button>
              </>
            )}

            {/* 4. Laporan & Cetak */}
            <button
              type="button"
              onClick={() => handleNav('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'reports'
                  ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Laporan & Cetak</span>
            </button>

            {/* 5. Riwayat Aktivitas */}
            <button
              type="button"
              onClick={() => handleNav('activity')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'activity'
                  ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Riwayat Aktivitas</span>
            </button>

            {/* 6. Manajemen Pengguna (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'users'
                    ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                    : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Manajemen Pengguna</span>
              </button>
            )}

            {/* 7. Pengaturan & Google Sheets */}
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'settings'
                  ? 'bg-emerald-800 text-white shadow-xs border border-emerald-700/60'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Pengaturan & Sheets</span>
            </button>
          </div>

        </div>

        {/* Footer info box */}
        <div className="p-3 bg-emerald-950/80 border-t border-emerald-800/80 text-[11px] text-emerald-300">
          <div className="font-semibold text-white">PATEN Kecamatan Bringin</div>
          <div className="text-[10px] text-emerald-400/80">Kab. Semarang, Jawa Tengah</div>
        </div>

      </aside>
    </>
  );
};
