/**
 * SIAP BRINGIN
 * SISTEM APLIKASI PELAYANAN KECAMATAN BRINGIN, KABUPATEN SEMARANG
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ServiceDataView } from './components/services/ServiceDataView';
import { ServiceFormView } from './components/services/ServiceFormView';
import { ServiceManagementView } from './components/management/ServiceManagementView';
import { VillageManagementView } from './components/management/VillageManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { UserManagementView } from './components/users/UserManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { ToastContainer } from './components/common/ToastContainer';
import { ServiceRecord } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, activeView, activeServiceId, setActiveView } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  // Handlers for switching to form
  const handleEditRecord = (record: ServiceRecord) => {
    setEditingRecord(record);
    setActiveView('service-form', record.serviceId);
  };

  const handleAddNewRecord = (targetServiceId?: string) => {
    setEditingRecord(null);
    setActiveView('service-form', targetServiceId || activeServiceId || 'cetak-kk');
  };

  const handleFormBack = () => {
    setEditingRecord(null);
    setActiveView('services', activeServiceId || 'all');
  };

  const handleFormSaved = (saved: ServiceRecord) => {
    setEditingRecord(null);
    setActiveView('services', saved.serviceId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Fixed Header */}
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        {/* Left Dynamic Sidebar */}
        <div className="no-print">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {activeView === 'dashboard' && <DashboardView />}

            {activeView === 'services' && (
              <ServiceDataView
                serviceId={activeServiceId}
                onEditRecord={handleEditRecord}
                onAddNewRecord={handleAddNewRecord}
              />
            )}

            {activeView === 'service-form' && (
              <ServiceFormView
                initialServiceId={activeServiceId}
                editingRecord={editingRecord}
                onBack={handleFormBack}
                onSaved={handleFormSaved}
              />
            )}

            {activeView === 'service-management' && <ServiceManagementView />}

            {activeView === 'villages' && <VillageManagementView />}

            {activeView === 'reports' && <ReportsView />}

            {activeView === 'activity' && <ActivityLogView />}

            {activeView === 'users' && <UserManagementView />}

            {activeView === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
