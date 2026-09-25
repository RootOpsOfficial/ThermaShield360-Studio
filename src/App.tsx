import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext.js';
import { CitizenProvider, useCitizen } from './context/CitizenContext.js';
import { MunicipalProvider, useMunicipal } from './context/MunicipalContext.js';
import { TopHeader } from './components/TopHeader.js';
import { CitizenSidebar } from './components/CitizenSidebar.js';
import { MunicipalSidebar } from './components/MunicipalSidebar.js';
import { AlertDrawer } from './components/AlertDrawer.js';

// Citizen Pages
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

// Municipal Pages
import { MunicipalCommandCenterPage } from './pages/municipal/MunicipalCommandCenterPage.js';
import { WardRiskMapPage } from './pages/municipal/WardRiskMapPage.js';
import { ProtectionGapPage } from './pages/municipal/ProtectionGapPage.js';
import { RecommendedActionsPage } from './pages/municipal/RecommendedActionsPage.js';
import { MunicipalAlertsPage } from './pages/municipal/MunicipalAlertsPage.js';
import { MunicipalSettingsPage } from './pages/municipal/MunicipalSettingsPage.js';

const MainContent: React.FC = () => {
  const { workspace } = useWorkspace();
  const { activePage } = useCitizen();
  const { activeMunicipalPage } = useMunicipal();

  const renderCitizenPage = () => {
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

  const renderMunicipalPage = () => {
    switch (activeMunicipalPage) {
      case 'command-center':
        return <MunicipalCommandCenterPage />;
      case 'ward-risk-map':
        return <WardRiskMapPage />;
      case 'protection-gap':
        return <ProtectionGapPage />;
      case 'recommended-actions':
        return <RecommendedActionsPage />;
      case 'municipal-alerts':
        return <MunicipalAlertsPage />;
      case 'settings':
        return <MunicipalSettingsPage />;
      default:
        return <MunicipalCommandCenterPage />;
    }
  };

  const isMunicipal = workspace === 'municipal';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header */}
      <TopHeader />

      {/* Main Layout: Sidebar + Page Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto pb-16 md:pb-0">
        {isMunicipal ? <MunicipalSidebar /> : <CitizenSidebar />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          {isMunicipal ? renderMunicipalPage() : renderCitizenPage()}
        </main>
      </div>

      {/* Alert Slide-Over Drawer for Citizen Mode */}
      {!isMunicipal && <AlertDrawer />}
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <CitizenProvider>
        <MunicipalProvider>
          <MainContent />
        </MunicipalProvider>
      </CitizenProvider>
    </WorkspaceProvider>
  );
}
