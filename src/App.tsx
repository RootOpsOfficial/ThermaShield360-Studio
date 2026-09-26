import React, { useEffect, useRef } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext.js';
import { CitizenProvider, useCitizen } from './context/CitizenContext.js';
import { MunicipalProvider, useMunicipal } from './context/MunicipalContext.js';
import { HealthcareProvider, useHealthcare } from './context/HealthcareContext.js';
import { TopHeader } from './components/TopHeader.js';
import { CitizenSidebar } from './components/CitizenSidebar.js';
import { MunicipalSidebar } from './components/MunicipalSidebar.js';
import { HealthcareSidebar } from './components/HealthcareSidebar.js';
import { AlertDrawer } from './components/AlertDrawer.js';
import { CitizenPage } from './types.js';
import { MunicipalNavPage } from './types/municipal.js';
import { HealthcareNavPage } from './types/healthcare.js';

// 1st Page: Workspace Selector Portal
import { WorkspacePortalPage } from './pages/WorkspacePortalPage.js';

// Citizen Pages (Preserved 100%)
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

// Municipal Pages (Cleaned & Decision-Focused)
import { MunicipalCommandCenterPage } from './pages/municipal/MunicipalCommandCenterPage.js';
import { WardRiskMapPage } from './pages/municipal/WardRiskMapPage.js';
import { ProtectionGapPage } from './pages/municipal/ProtectionGapPage.js';
import { RecommendedActionsPage } from './pages/municipal/RecommendedActionsPage.js';
import { MunicipalAlertsPage } from './pages/municipal/MunicipalAlertsPage.js';
import { MunicipalSettingsPage } from './pages/municipal/MunicipalSettingsPage.js';

// Healthcare Workspace Pages (Decision-Focused Heat-Health Architecture)
import { HealthCommandCenterPage } from './pages/healthcare/HealthCommandCenterPage.js';
import { HealthForecastPage } from './pages/healthcare/HealthForecastPage.js';
import { RiskTrendPage } from './pages/healthcare/RiskTrendPage.js';
import { HighRiskAreasPage } from './pages/healthcare/HighRiskAreasPage.js';
import { VulnerablePopulationPage } from './pages/healthcare/VulnerablePopulationPage.js';
import { FacilityReadinessPage } from './pages/healthcare/FacilityReadinessPage.js';
import { FacilityProfilePage } from './pages/healthcare/FacilityProfilePage.js';
import { DemandCapacityPage } from './pages/healthcare/DemandCapacityPage.js';
import { HealthAlertsPage } from './pages/healthcare/HealthAlertsPage.js';
import { HealthcareSettingsPage } from './pages/healthcare/HealthcareSettingsPage.js';

// Route coordinator component mounted ONCE at App root to keep URL and state in sync without re-render loops
const RouteCoordinator: React.FC = () => {
  const { workspace, setWorkspace } = useWorkspace();
  const { activePage, setActivePage } = useCitizen();
  const { activeMunicipalPage, setActiveMunicipalPage } = useMunicipal();
  const { activeHealthcarePage, setActiveHealthcarePage } = useHealthcare();

  const workspaceRef = useRef(workspace);
  const activePageRef = useRef(activePage);
  const activeMunicipalPageRef = useRef(activeMunicipalPage);
  const activeHealthcarePageRef = useRef(activeHealthcarePage);
  const isUpdatingHashRef = useRef(false);

  useEffect(() => {
    workspaceRef.current = workspace;
    activePageRef.current = activePage;
    activeMunicipalPageRef.current = activeMunicipalPage;
    activeHealthcarePageRef.current = activeHealthcarePage;
  }, [workspace, activePage, activeMunicipalPage, activeHealthcarePage]);

  // Sync state to URL hash
  useEffect(() => {
    let targetHash = '#select';
    if (workspace === 'portal') {
      targetHash = '#select';
    } else if (workspace === 'healthcare') {
      targetHash = `#healthcare/${activeHealthcarePage}`;
    } else if (workspace === 'municipal') {
      targetHash = `#municipality/${activeMunicipalPage}`;
    } else if (workspace === 'citizen') {
      targetHash = `#citizen/${activePage}`;
    }

    if (window.location.hash !== targetHash) {
      isUpdatingHashRef.current = true;
      try {
        window.history.replaceState(null, '', targetHash);
      } catch {
        try {
          window.location.hash = targetHash;
        } catch {
          // ignore
        }
      }
      setTimeout(() => {
        isUpdatingHashRef.current = false;
      }, 50);
    }
  }, [workspace, activePage, activeMunicipalPage, activeHealthcarePage]);

  // Listen for browser back/forward or manual hash change
  useEffect(() => {
    const handleHashChange = () => {
      if (isUpdatingHashRef.current) return;

      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const pathname = window.location.pathname.replace(/^\//, '').toLowerCase();
      const target = hash || pathname;

      if (target.startsWith('select') || target.startsWith('portal') || target === '') {
        if (workspaceRef.current !== 'portal') {
          setWorkspace('portal');
        }
      } else if (target.startsWith('healthcare')) {
        if (workspaceRef.current !== 'healthcare') {
          setWorkspace('healthcare');
        }
        const sub = target.split('/')[1] || 'command-center';
        const validHealthcarePages: Record<string, HealthcareNavPage> = {
          home: 'command-center',
          'command-center': 'command-center',
          forecast: 'forecast',
          'health-forecast': 'forecast',
          trend: 'risk-trend',
          'risk-trend': 'risk-trend',
          areas: 'risk-areas',
          'risk-areas': 'risk-areas',
          'high-risk-areas': 'risk-areas',
          vulnerability: 'vulnerability',
          vulnerable: 'vulnerability',
          readiness: 'facility-readiness',
          'facility-readiness': 'facility-readiness',
          profile: 'facility-profile',
          'facility-profile': 'facility-profile',
          'facility-data': 'facility-profile',
          'edit-facility': 'facility-profile',
          demand: 'demand-capacity',
          'demand-capacity': 'demand-capacity',
          capacity: 'demand-capacity',
          alerts: 'alerts',
          'health-alerts': 'alerts',
          settings: 'settings',
        };
        const resolved = validHealthcarePages[sub] || 'command-center';
        if (activeHealthcarePageRef.current !== resolved) {
          setActiveHealthcarePage(resolved);
        }
      } else if (target.startsWith('municipality') || target.startsWith('municipal')) {
        if (workspaceRef.current !== 'municipal') {
          setWorkspace('municipal');
        }
        const sub = target.split('/')[1] || 'command-center';
        const validMunicipalPages: Record<string, MunicipalNavPage> = {
          home: 'command-center',
          'command-center': 'command-center',
          'ward-risk': 'ward-risk-map',
          'ward-risk-map': 'ward-risk-map',
          'protection-gap': 'protection-gap',
          actions: 'recommended-actions',
          'recommended-actions': 'recommended-actions',
          alerts: 'municipal-alerts',
          'municipal-alerts': 'municipal-alerts',
          settings: 'settings',
        };
        const resolved = validMunicipalPages[sub] || 'command-center';
        if (activeMunicipalPageRef.current !== resolved) {
          setActiveMunicipalPage(resolved);
        }
      } else if (target.startsWith('citizen')) {
        if (workspaceRef.current !== 'citizen') {
          setWorkspace('citizen');
        }
        const sub = (target.split('/')[1] || 'home') as CitizenPage;
        const validCitizenPages: CitizenPage[] = [
          'home',
          'risk',
          'future',
          'heatwave',
          'thermal',
          'map',
          'protection',
          'adaptive',
          'healthcare',
          'route',
          'alerts',
          'settings',
        ];
        if (validCitizenPages.includes(sub) && activePageRef.current !== sub) {
          setActivePage(sub);
        }
      }
    };

    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [setWorkspace, setActivePage, setActiveMunicipalPage, setActiveHealthcarePage]);

  return null;
};

const MainContent: React.FC = () => {
  const { workspace } = useWorkspace();
  const { activePage } = useCitizen();
  const { activeMunicipalPage } = useMunicipal();
  const { activeHealthcarePage } = useHealthcare();

  // 1st Page: Portal for workspace selection (Citizen, Municipality, Healthcare)
  if (workspace === 'portal') {
    return <WorkspacePortalPage />;
  }

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

  const renderHealthcarePage = () => {
    switch (activeHealthcarePage) {
      case 'command-center':
        return <HealthCommandCenterPage />;
      case 'forecast':
        return <HealthForecastPage />;
      case 'risk-trend':
        return <RiskTrendPage />;
      case 'risk-areas':
        return <HighRiskAreasPage />;
      case 'vulnerability':
        return <VulnerablePopulationPage />;
      case 'facility-readiness':
        return <FacilityReadinessPage />;
      case 'facility-profile':
        return <FacilityProfilePage />;
      case 'demand-capacity':
        return <DemandCapacityPage />;
      case 'alerts':
        return <HealthAlertsPage />;
      case 'settings':
        return <HealthcareSettingsPage />;
      default:
        return <HealthCommandCenterPage />;
    }
  };

  const isMunicipal = workspace === 'municipal';
  const isHealthcare = workspace === 'healthcare';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header */}
      <TopHeader />

      {/* Main Layout: Sidebar + Page Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto pb-16 md:pb-0">
        {isMunicipal ? (
          <MunicipalSidebar />
        ) : isHealthcare ? (
          <HealthcareSidebar />
        ) : (
          <CitizenSidebar />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 mx-auto w-full max-w-7xl">
          {isMunicipal ? (
            renderMunicipalPage()
          ) : isHealthcare ? (
            renderHealthcarePage()
          ) : (
            renderCitizenPage()
          )}
        </main>
      </div>

      {/* Alert Slide-Over Drawer for Citizen Mode only */}
      {workspace === 'citizen' && <AlertDrawer />}
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <CitizenProvider>
        <MunicipalProvider>
          <HealthcareProvider>
            <RouteCoordinator />
            <MainContent />
          </HealthcareProvider>
        </MunicipalProvider>
      </CitizenProvider>
    </WorkspaceProvider>
  );
}
