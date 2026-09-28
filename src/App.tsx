import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NavigationHistoryProvider, useNavigationHistory } from './context/NavigationHistoryContext.js';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext.js';
import { CitizenProvider, useCitizen } from './context/CitizenContext.js';
import { MunicipalProvider, useMunicipal } from './context/MunicipalContext.js';
import { HealthcareProvider, useHealthcare } from './context/HealthcareContext.js';
import { DisasterProvider, useDisaster } from './context/DisasterContext.js';
import { TopHeader } from './components/TopHeader.js';
import { CitizenSidebar } from './components/CitizenSidebar.js';
import { MunicipalSidebar } from './components/MunicipalSidebar.js';
import { HealthcareSidebar } from './components/HealthcareSidebar.js';
import { DisasterSidebar } from './components/DisasterSidebar.js';
import { AlertDrawer } from './components/AlertDrawer.js';
import { CitizenPage } from './types.js';
import { MunicipalNavPage } from './types/municipal.js';
import { HealthcareNavPage } from './types/healthcare.js';
import { DisasterNavPage } from './types/disaster.js';

// Login & User Selection Pages
import { LoginPage } from './pages/LoginPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { UserSelectionPage } from './pages/UserSelectionPage.js';
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

// Disaster Management Authority Pages (Emergency Command Edition)
import { EmergencyCommandPage } from './pages/disaster/EmergencyCommandPage.js';
import { HeatSituationPage } from './pages/disaster/HeatSituationPage.js';
import { DisasterHighRiskAreasPage } from './pages/disaster/DisasterHighRiskAreasPage.js';
import { DisasterHealthImpactPage } from './pages/disaster/DisasterHealthImpactPage.js';
import { DisasterProtectionShortfallPage } from './pages/disaster/DisasterProtectionShortfallPage.js';
import { AlertsEscalationPage } from './pages/disaster/AlertsEscalationPage.js';
import { ResponseTrackingPage } from './pages/disaster/ResponseTrackingPage.js';
import { DisasterSettingsPage } from './pages/disaster/DisasterSettingsPage.js';

// Route coordinator component mounted ONCE at App root to keep URL and state in sync without re-render loops
const RouteCoordinator: React.FC = () => {
  const { workspace, setWorkspace } = useWorkspace();
  const { activePage, setActivePage } = useCitizen();
  const { activeMunicipalPage, setActiveMunicipalPage } = useMunicipal();
  const { activeHealthcarePage, setActiveHealthcarePage } = useHealthcare();
  const { activeDisasterPage, setActiveDisasterPage } = useDisaster();
  const { recordNavigation } = useNavigationHistory();
  const { user, isAuthenticated, isLoading } = useAuth();

  const workspaceRef = useRef(workspace);
  const activePageRef = useRef(activePage);
  const activeMunicipalPageRef = useRef(activeMunicipalPage);
  const activeHealthcarePageRef = useRef(activeHealthcarePage);
  const activeDisasterPageRef = useRef(activeDisasterPage);
  const userRef = useRef(user);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const isLoadingRef = useRef(isLoading);
  const isUpdatingHashRef = useRef(false);
  const isPopstateRef = useRef(false);

  useEffect(() => {
    workspaceRef.current = workspace;
    activePageRef.current = activePage;
    activeMunicipalPageRef.current = activeMunicipalPage;
    activeHealthcarePageRef.current = activeHealthcarePage;
    activeDisasterPageRef.current = activeDisasterPage;
    userRef.current = user;
    isAuthenticatedRef.current = isAuthenticated;
    isLoadingRef.current = isLoading;
  }, [workspace, activePage, activeMunicipalPage, activeHealthcarePage, activeDisasterPage, user, isAuthenticated, isLoading]);

  // Direct automatic routing based on verified authentication state
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (workspace !== 'login') {
        setWorkspace('login');
      }
      return;
    }

    if (user) {
      if (user.approval_status === 'pending') {
        if (workspace !== 'login') {
          setWorkspace('login');
        }
        return;
      }

      if (!user.onboarding_completed) {
        if (workspace !== 'onboarding') {
          setWorkspace('onboarding');
        }
        return;
      }

      // If user is authenticated and onboarding is completed, but currently on login or onboarding,
      // route directly to their authorized dashboard!
      if (workspace === 'login' || workspace === 'onboarding') {
        if (user.role === 'disaster_management') {
          setWorkspace('disaster');
          setActiveDisasterPage('command');
        } else if (user.role === 'municipal') {
          setWorkspace('municipal');
          setActiveMunicipalPage('command-center');
        } else if (user.role === 'healthcare') {
          setWorkspace('healthcare');
          setActiveHealthcarePage('command-center');
        } else if (user.role === 'worker') {
          setWorkspace('citizen');
          setActivePage('thermal');
        } else {
          setWorkspace('citizen');
          setActivePage('home');
        }
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    workspace,
    setWorkspace,
    setActivePage,
    setActiveMunicipalPage,
    setActiveHealthcarePage,
    setActiveDisasterPage,
  ]);

  // Sync state to URL hash
  useEffect(() => {
    let targetHash = '#login';
    if (workspace === 'login') {
      targetHash = '#login';
    } else if (workspace === 'onboarding') {
      targetHash = '#onboarding';
    } else if (workspace === 'portal') {
      targetHash = '#select';
    } else if (workspace === 'disaster') {
      targetHash = `#disaster/${activeDisasterPage}`;
    } else if (workspace === 'healthcare') {
      targetHash = `#healthcare/${activeHealthcarePage}`;
    } else if (workspace === 'municipal') {
      targetHash = `#municipality/${activeMunicipalPage}`;
    } else if (workspace === 'citizen') {
      targetHash = `#citizen/${activePage}`;
    }

    if (window.location.hash !== targetHash) {
      if (isPopstateRef.current) {
        isPopstateRef.current = false;
        return;
      }

      isUpdatingHashRef.current = true;
      recordNavigation(targetHash);
      setTimeout(() => {
        isUpdatingHashRef.current = false;
      }, 50);
    }
  }, [workspace, activePage, activeMunicipalPage, activeHealthcarePage, activeDisasterPage, recordNavigation]);

  // Listen for browser back/forward or manual hash change
  useEffect(() => {
    const handleHashChange = () => {
      if (isUpdatingHashRef.current) return;
      isPopstateRef.current = true;

      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const pathname = window.location.pathname.replace(/^\//, '').toLowerCase();
      const target = hash || pathname;

      if (target.startsWith('login')) {
        if (workspaceRef.current !== 'login') {
          setWorkspace('login');
        }
        return;
      }

      if (target.startsWith('onboarding')) {
        if (workspaceRef.current !== 'onboarding') {
          setWorkspace('onboarding');
        }
        return;
      }

      if (target.startsWith('select') || target.startsWith('portal')) {
        if (workspaceRef.current !== 'portal') {
          setWorkspace('portal');
        }
        return;
      }

      const currentUser = userRef.current;
      const isAuth = isAuthenticatedRef.current;

      if (target === '') {
        if (!isAuth) {
          if (workspaceRef.current !== 'login') setWorkspace('login');
        } else if (currentUser && !currentUser.onboarding_completed) {
          if (workspaceRef.current !== 'onboarding') setWorkspace('onboarding');
        } else if (currentUser) {
          if (currentUser.role === 'disaster_management') setWorkspace('disaster');
          else if (currentUser.role === 'municipal') setWorkspace('municipal');
          else if (currentUser.role === 'healthcare') setWorkspace('healthcare');
          else setWorkspace('citizen');
        }
        return;
      }

      // Route Protection & Role Security Verification
      if (!isAuth && !isLoadingRef.current) {
        setWorkspace('login');
        return;
      }

      if (currentUser && !currentUser.onboarding_completed) {
        setWorkspace('onboarding');
        return;
      }

      if (target.startsWith('disaster')) {
        if (currentUser && currentUser.role !== 'disaster_management') {
          // Block non-disaster users and redirect to their authorized role workspace
          if (currentUser.role === 'municipal') setWorkspace('municipal');
          else if (currentUser.role === 'healthcare') setWorkspace('healthcare');
          else setWorkspace('citizen');
          return;
        }

        if (workspaceRef.current !== 'disaster') {
          setWorkspace('disaster');
        }
        const sub = target.split('/')[1] || 'command';
        const validDisasterPages: Record<string, DisasterNavPage> = {
          command: 'command',
          'command-center': 'command',
          'emergency-command': 'command',
          home: 'command',
          'heat-situation': 'heat-situation',
          situation: 'heat-situation',
          'high-risk-areas': 'high-risk-areas',
          'risk-areas': 'high-risk-areas',
          'health-impact': 'health-impact',
          impact: 'health-impact',
          'protection-shortfall': 'protection-shortfall',
          shortfall: 'protection-shortfall',
          'alerts-escalation': 'alerts-escalation',
          alerts: 'alerts-escalation',
          escalation: 'alerts-escalation',
          'response-tracking': 'response-tracking',
          response: 'response-tracking',
          tracking: 'response-tracking',
          settings: 'settings',
        };
        const resolved = validDisasterPages[sub] || 'command';
        if (activeDisasterPageRef.current !== resolved) {
          setActiveDisasterPage(resolved);
        }
      } else if (target.startsWith('healthcare')) {
        if (currentUser && currentUser.role !== 'healthcare') {
          // Block non-healthcare users and redirect to their authorized role workspace
          if (currentUser.role === 'municipal') setWorkspace('municipal');
          else if (currentUser.role === 'disaster_management') setWorkspace('disaster');
          else setWorkspace('citizen');
          return;
        }

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
        if (currentUser && currentUser.role !== 'municipal') {
          // Block non-municipal users and redirect to their authorized role workspace
          if (currentUser.role === 'healthcare') setWorkspace('healthcare');
          else if (currentUser.role === 'disaster_management') setWorkspace('disaster');
          else setWorkspace('citizen');
          return;
        }

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
  }, [setWorkspace, setActivePage, setActiveMunicipalPage, setActiveHealthcarePage, setActiveDisasterPage]);

  return null;
};

const MainContent: React.FC = () => {
  const { workspace } = useWorkspace();
  const { activePage } = useCitizen();
  const { activeMunicipalPage } = useMunicipal();
  const { activeHealthcarePage } = useHealthcare();
  const { activeDisasterPage } = useDisaster();
  const { isLoading, user } = useAuth();

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-white">
              ThermaShield<span className="text-orange-400">360</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Verifying security session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 0. Login Page
  if (workspace === 'login') {
    return <LoginPage />;
  }

  // 0.5 Role Onboarding Page
  if (workspace === 'onboarding') {
    return <OnboardingPage />;
  }

  // 1. User Selection & Workspace Selector
  if (workspace === 'portal') {
    return <UserSelectionPage />;
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

  const renderDisasterPage = () => {
    switch (activeDisasterPage) {
      case 'command':
        return <EmergencyCommandPage />;
      case 'heat-situation':
        return <HeatSituationPage />;
      case 'high-risk-areas':
        return <DisasterHighRiskAreasPage />;
      case 'health-impact':
        return <DisasterHealthImpactPage />;
      case 'protection-shortfall':
        return <DisasterProtectionShortfallPage />;
      case 'alerts-escalation':
        return <AlertsEscalationPage />;
      case 'response-tracking':
        return <ResponseTrackingPage />;
      case 'settings':
        return <DisasterSettingsPage />;
      default:
        return <EmergencyCommandPage />;
    }
  };

  const isDisaster = workspace === 'disaster';
  const isMunicipal = workspace === 'municipal';
  const isHealthcare = workspace === 'healthcare';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header */}
      <TopHeader />

      {/* Main Layout: Sidebar + Page Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto pb-16 md:pb-0">
        {isDisaster ? (
          <DisasterSidebar />
        ) : isMunicipal ? (
          <MunicipalSidebar />
        ) : isHealthcare ? (
          <HealthcareSidebar />
        ) : (
          <CitizenSidebar />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 mx-auto w-full max-w-7xl">
          {isDisaster ? (
            renderDisasterPage()
          ) : isMunicipal ? (
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
    <AuthProvider>
      <NavigationHistoryProvider>
        <WorkspaceProvider>
          <CitizenProvider>
            <MunicipalProvider>
              <HealthcareProvider>
                <DisasterProvider>
                  <RouteCoordinator />
                  <MainContent />
                </DisasterProvider>
              </HealthcareProvider>
            </MunicipalProvider>
          </CitizenProvider>
        </WorkspaceProvider>
      </NavigationHistoryProvider>
    </AuthProvider>
  );
}
