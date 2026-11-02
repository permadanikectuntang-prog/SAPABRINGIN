import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BringinEmblem } from '../common/BringinEmblem';
import { 
  LogOut, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Menu, 
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout, settings, syncStatus, syncGoogleSheets, firebaseStatus, syncToFirebase } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { 
        timeZone: 'Asia/Jakarta', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });
      const dateStr = now.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setCurrentTime(timeStr + ' WIB');
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-emerald-950 border-b border-emerald-900/80 text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand lockup Zone */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-emerald-200 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors"
              aria-label="Buka menu navigasi"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <BringinEmblem size="md" logoUrl={settings.logoUrl} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white leading-none">
                    {settings.appName}
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-xs">
                    KAB. SEMARANG
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300 leading-tight mt-0.5 hidden sm:block truncate max-w-xs md:max-w-md">
                  {settings.appFullName}
                </p>
              </div>
            </div>
          </div>

          {/* Center Zone: Live Date & Clock Asia/Jakarta */}
          <div className="hidden xl:flex items-center gap-4 text-xs text-emerald-200/90 bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-800/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentDate}</span>
            </div>
            <span className="text-emerald-700">|</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono tabular-nums font-semibold text-white">{currentTime}</span>
            </div>
          </div>

          {/* Right Action Zone: Google Sheets status, User info & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Firebase Firestore Button */}
            <button
              type="button"
              onClick={() => syncToFirebase()}
              disabled={firebaseStatus.syncing}
              title={`Firebase Cloud Firestore: ${firebaseStatus.message || 'Terhubung'}. Terakhir sync: ${firebaseStatus.lastSync || '-'}`}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-100 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <Database className={`w-3.5 h-3.5 text-amber-400 ${firebaseStatus.syncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Firebase</span>
              <span className={`w-2 h-2 rounded-full ${firebaseStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>

            {/* Quick Sync Button */}
            <button
              type="button"
              onClick={() => syncGoogleSheets()}
              disabled={syncStatus.inProgress}
              title={`Status: ${syncStatus.message}. Terakhir sync: ${syncStatus.lastSuccess || '-'}`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${syncStatus.inProgress ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Google Sheets</span>
              {syncStatus.lastError ? (
                <AlertCircle className="w-3 h-3 text-red-400 ml-0.5" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
              )}
            </button>

            {/* User Profile */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/80">
                <div className="w-8 h-8 rounded-full bg-emerald-800 border border-amber-400/50 flex items-center justify-center font-bold text-xs text-amber-300">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-300 capitalize">
                    {currentUser.role.toLowerCase()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Keluar dari akun"
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
