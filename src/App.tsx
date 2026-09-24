import React from 'react';
import { CitizenProvider, useCitizen } from './context/CitizenContext.js';
import { TopHeader } from './components/TopHeader.js';
import { CitizenSidebar } from './components/CitizenSidebar.js';
import { AlertDrawer } from './components/AlertDrawer.js';

// Pages
import { CitizenHomePage } from './pages/CitizenHomePage.js';
import { MyHeatRiskPage } from './pages/MyHeatRiskPage.js';
import { HeatwaveForecastPage } from './pages/HeatwaveForecastPage.js';
import { ThermalStressPage } from './pages/ThermalStressPage.js';
import { HeatRiskMapPage } from './pages/HeatRiskMapPage.js';
import { EarlyWarningHeatwavePage } from './pages/EarlyWarningHeatwavePage.js';
import { NearbyHealthcarePage } from './pages/NearbyHealthcarePage.js';
import { SafeRoutePage } from './pages/SafeRoutePage.js';
import { ProtectionPage } from './pages/ProtectionPage.js';
import { AdaptiveResponsePage } from './pages/AdaptiveResponsePage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const MainContent: React.FC = () => {
  const { activePage } = useCitizen();

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <CitizenHomePage />;
      case 'risk':
        return <MyHeatRiskPage />;
      case 'future':
        return <EarlyWarningHeatwavePage />;
      case 'heatwave':
        return <HeatwaveForecastPage />;
      case 'thermal':
        return <ThermalStressPage />;
      case 'map':
        return <HeatRiskMapPage />;
      case 'protection':
        return <ProtectionPage />;
      case 'adaptive':
        return <AdaptiveResponsePage />;
      case 'healthcare':
        return <NearbyHealthcarePage />;
      case 'route':
        return <SafeRoutePage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CitizenHomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header */}
      <TopHeader />

      {/* Main Layout: Sidebar + Page Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto pb-16 md:pb-0">
        <CitizenSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>

      {/* Alert Slide-Over Drawer */}
      <AlertDrawer />
    </div>
  );
};

export default function App() {
  return (
    <CitizenProvider>
      <MainContent />
    </CitizenProvider>
  );
}
