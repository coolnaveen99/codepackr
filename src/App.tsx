import React, { useState, useEffect, useRef } from 'react';
import { TOOLS } from './data/tools';
import { ToolDef, CategoryFilter } from './types';
import { CodepackrFamilyBar } from './components/CodepackrFamilyBar';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { HomeDashboard } from './components/HomeDashboard';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { SitemapModal } from './components/SitemapModal';
import { ContactView } from './components/ContactView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { NotFoundView } from './components/NotFoundView';
import { FormattersView } from './components/tools/FormattersView';
import { EncodersView } from './components/tools/EncodersView';
import { ValidatorsView } from './components/tools/ValidatorsView';
import { ConvertersView } from './components/tools/ConvertersView';
import { UtilitiesView } from './components/tools/UtilitiesView';
import { TextToolsView } from './components/tools/TextToolsView';
import { JsonDefinitionView } from './components/tools/JsonDefinitionView';
import { MockDataGeneratorView } from './components/tools/MockDataGeneratorView';
import { JwtInspectorView } from './components/dev-lab/JwtInspectorView';
import { PkceGeneratorView } from './components/dev-lab/PkceGeneratorView';
import { OpenApiValidatorView } from './components/dev-lab/OpenApiValidatorView';
import { DockerK8sValidatorView } from './components/dev-lab/DockerK8sValidatorView';
import { ConnectionStringParserView } from './components/dev-lab/ConnectionStringParserView';
import { ImageToolsView } from './components/tools/ImageToolsView';
import { EdiToolsView } from './components/tools/EdiToolsView';
import { XmlToolsView } from './components/xml/XmlToolsView';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { BugReportModal } from './components/BugReportModal';
import { GlobalBanner } from './components/GlobalBanner';
import { useToolGovernance } from './lib/useToolGovernance';
import { useAdminAuth } from './lib/useAdminAuth';
import { resolveCurrentRoute, getToolPath } from './lib/urls';
import { updateDocumentMetadata } from './lib/seo';
import { CurrencyProvider } from './lib/CurrencyContext';
import { safeLocalStorage } from './lib/storage';
import { useBookmarks } from './lib/bookmarks';
import { MobileBottomNav } from './components/MobileBottomNav';
import { popSmartPastePayload } from './lib/workspace';
import { AlertTriangle, Lock, Shield } from 'lucide-react';

interface HistorySnapshot {
  page: 'home' | 'contact' | 'privacy' | 'admin' | 'notFound';
  tool: ToolDef | null;
  category: CategoryFilter;
  legalTab?: 'privacy' | 'terms';
  url: string;
}

export const App: React.FC = () => {
  // Always enforce light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    safeLocalStorage.setItem('codepackr_theme', 'light');
  }, []);

  const [initialRoute] = useState(() => resolveCurrentRoute());
  const [activeTool, setActiveTool] = useState<ToolDef | null>(() => initialRoute.tool);
  const [activePage, setActivePage] = useState<'home' | 'contact' | 'privacy' | 'admin' | 'notFound'>(() => initialRoute.page);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>(() => {
    if (initialRoute.category === 'terms') return 'terms';
    if (typeof window !== 'undefined' && window.location.pathname.includes('terms')) return 'terms';
    return 'privacy';
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(() => {
    return (initialRoute.category as CategoryFilter) || 'all';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSitemapModalOpen, setIsSitemapModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [smartPasteInput, setSmartPasteInput] = useState<string>('');
  const { getToolStatus, isToolVisible } = useToolGovernance();
  const { count: bookmarkCount } = useBookmarks();
  const { isAuthenticated } = useAdminAuth();

  const inAppHistoryRef = useRef<HistorySnapshot[]>([]);

  useEffect(() => {
    const rawSlug = typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '')
      : '';
    let routeKey = 'home';
    if (activePage === 'contact') routeKey = 'contact';
    else if (activePage === 'privacy') routeKey = legalTab === 'terms' ? 'terms' : 'privacy';
    else if (activePage === 'notFound') routeKey = 'home';
    else if (rawSlug && rawSlug !== 'index') routeKey = rawSlug;
    else if (activeTool) routeKey = activeTool.id;
    updateDocumentMetadata(routeKey);
  }, [activeTool, activePage, legalTab]);

  useEffect(() => {
    const handleLocationChange = () => {
      const route = resolveCurrentRoute();
      if (route.externalRedirect) {
        window.location.replace(route.externalRedirect);
        return;
      }
      setSelectedCategory((route.category as CategoryFilter) || 'all');
      if (route.page === 'admin') {
        setActivePage('admin');
        setActiveTool(null);
      } else if (route.page === 'contact') {
        setActivePage('contact');
        setActiveTool(null);
      } else if (route.page === 'privacy') {
        setActivePage('privacy');
        setActiveTool(null);
        if (route.category === 'terms' || (typeof window !== 'undefined' && window.location.pathname.includes('terms'))) {
          setLegalTab('terms');
        } else setLegalTab('privacy');
      } else if (route.page === 'notFound') {
        setActiveTool(null);
        setActivePage('notFound');
      } else if (route.tool) {
        setActiveTool(route.tool);
        setActivePage('home');
      } else {
        setActiveTool(null);
        setActivePage('home');
      }

      // Keep in-app history synchronized when browser forward/back is used
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search;
        const matchIdx = inAppHistoryRef.current.findIndex((e) => e.url === currentUrl);
        if (matchIdx !== -1) {
          inAppHistoryRef.current = inAppHistoryRef.current.slice(0, matchIdx);
        }
      }
    };
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminLoginOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const recordCurrentLocation = () => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.pathname + window.location.search;
    const lastEntry = inAppHistoryRef.current[inAppHistoryRef.current.length - 1];
    if (!lastEntry || lastEntry.url !== currentUrl) {
      inAppHistoryRef.current.push({
        page: activePage,
        tool: activeTool,
        category: selectedCategory,
        legalTab,
        url: currentUrl,
      });
    }
  };

  const navigateBack = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';

    // Pop any trailing entry that matches current URL
    while (
      inAppHistoryRef.current.length > 0 &&
      inAppHistoryRef.current[inAppHistoryRef.current.length - 1].url === currentUrl
    ) {
      inAppHistoryRef.current.pop();
    }

    if (inAppHistoryRef.current.length > 0) {
      const prev = inAppHistoryRef.current.pop()!;
      setActiveTool(prev.tool);
      setActivePage(prev.page);
      setSelectedCategory(prev.category);
      if (prev.legalTab) setLegalTab(prev.legalTab);
      setSmartPasteInput('');
      const nextIndex = Math.max(0, inAppHistoryRef.current.length);
      window.history.pushState({ appIndex: nextIndex }, '', prev.url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If browser session has history, navigate back
    if (typeof window !== 'undefined' && window.history.state?.appIndex > 0) {
      window.history.back();
      return;
    }

    // Safe fallback when landing directly on a tool with no prior history in this tab
    if (activeTool) {
      const toolCategory = (activeTool.category as CategoryFilter) || 'all';
      setSelectedCategory(toolCategory);
      setActiveTool(null);
      setActivePage('home');
      setSmartPasteInput('');
      const catUrl = toolCategory !== 'all' ? `/?cat=${toolCategory}` : '/';
      window.history.pushState({ appIndex: 0 }, '', catUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activePage !== 'home') {
      navigateToHome();
    }
  };

  const navigateToTool = (tool: ToolDef, initialPayload?: string) => {
    recordCurrentLocation();
    setActiveTool(tool);
    if (initialPayload !== undefined) setSmartPasteInput(initialPayload);
    setActivePage('home');
    const nextIndex = ((typeof window !== 'undefined' && window.history.state?.appIndex) || 0) + 1;
    window.history.pushState({ appIndex: nextIndex }, '', getToolPath(tool));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    recordCurrentLocation();
    setActiveTool(null);
    setSmartPasteInput('');
    setActivePage('home');
    const nextIndex = ((typeof window !== 'undefined' && window.history.state?.appIndex) || 0) + 1;
    window.history.pushState({ appIndex: nextIndex }, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToContact = () => {
    recordCurrentLocation();
    setActiveTool(null);
    setActivePage('contact');
    const nextIndex = ((typeof window !== 'undefined' && window.history.state?.appIndex) || 0) + 1;
    window.history.pushState({ appIndex: nextIndex }, '', '/contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPrivacy = (tab: 'privacy' | 'terms' = 'privacy') => {
    recordCurrentLocation();
    setLegalTab(tab);
    setActiveTool(null);
    setActivePage('privacy');
    const nextIndex = ((typeof window !== 'undefined' && window.history.state?.appIndex) || 0) + 1;
    window.history.pushState({ appIndex: nextIndex }, '', tab === 'terms' ? '/terms' : '/privacy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: CategoryFilter) => {
    recordCurrentLocation();
    setSelectedCategory(cat);
    setActiveTool(null);
    setActivePage('home');
    const catUrl = cat !== 'all' ? `/?cat=${cat}` : '/';
    const nextIndex = ((typeof window !== 'undefined' && window.history.state?.appIndex) || 0) + 1;
    window.history.pushState({ appIndex: nextIndex }, '', catUrl);
    if (cat !== 'all') {
      setTimeout(() => {
        const catSection = document.getElementById('tool-grid');
        if (catSection) {
          const targetY = catSection.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      }, 50);
    } else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTool = (tool: ToolDef) => {
    const gov = getToolStatus(tool.id);
    const isHiddenTool = gov.status === 'hidden' || gov.visibility === 'admin_only';
    if (isHiddenTool && !isToolVisible(tool.id, isAuthenticated)) {
      return (
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[color:var(--surface-elevated)] text-[color:var(--ink-muted)]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[color:var(--ink)]">Tool Unavailable</h2>
          <p className="text-sm text-[color:var(--ink-muted)]">This utility is currently unlisted or undergoing administrative review.</p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <button onClick={navigateToHome} className="px-6 py-2.5 rounded-xl font-bold bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-hover)] transition-colors cursor-pointer">Browse All Tools</button>
            <button onClick={() => setIsAdminLoginOpen(true)} className="px-6 py-2.5 rounded-xl font-bold border border-[color:var(--border)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors cursor-pointer">Admin Sign In</button>
          </div>
        </div>
      );
    }
    const renderAdminPreviewBanner = () => {
      if (!isAuthenticated || !isHiddenTool) return null;
      return (
        <div className="mb-6 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">Admin Preview Mode</div>
              <p className="text-xs mt-0.5 leading-relaxed">This utility is marked as <strong>Hidden</strong> in Firestore Governance. Public visitors see a Tool Unavailable screen.</p>
            </div>
          </div>
          <button onClick={() => { setActivePage('admin'); setActiveTool(null); window.history.pushState({}, '', '/admin'); }} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-950 dark:text-amber-100 hover:bg-amber-500/30 transition-colors whitespace-nowrap cursor-pointer">Governance Console &rarr;</button>
        </div>
      );
    };
    const renderMaintenanceBanner = () => {
      if (gov.status !== 'maintenance' && !gov.noticeMessage) return null;
      return (
        <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">{gov.status === 'maintenance' ? 'Scheduled Maintenance Notice' : 'Notice'}</div>
            <p className="text-xs mt-0.5 leading-relaxed">{gov.noticeMessage || 'This utility is currently undergoing scheduled maintenance and updates by the Codepackr team. Some features may be temporarily limited.'}</p>
          </div>
        </div>
      );
    };
    const initialInputForTool = smartPasteInput || popSmartPastePayload(tool.id) || popSmartPastePayload(tool.category) || '';
    let toolViewContent: React.ReactNode = null;
    if (tool.id === 'json-definition-generator') toolViewContent = <JsonDefinitionView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else if (tool.id === 'mock-json-generator') toolViewContent = <MockDataGeneratorView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else if (tool.id === 'jwt-inspector') toolViewContent = <JwtInspectorView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else if (tool.id === 'pkce-generator') toolViewContent = <PkceGeneratorView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} />;
    else if (tool.id === 'openapi-validator') toolViewContent = <OpenApiValidatorView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else if (tool.id === 'docker-k8s-validator') toolViewContent = <DockerK8sValidatorView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else if (tool.id === 'connection-string-parser') toolViewContent = <ConnectionStringParserView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    else {
      switch (tool.category) {
        case 'image': toolViewContent = <ImageToolsView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'formatters': toolViewContent = <FormattersView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'encoders': toolViewContent = <EncodersView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'validators': toolViewContent = <ValidatorsView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'converters': toolViewContent = <ConvertersView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'edi': toolViewContent = <EdiToolsView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'xml': toolViewContent = <XmlToolsView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'utilities': toolViewContent = <UtilitiesView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        case 'text': toolViewContent = <TextToolsView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
        default: toolViewContent = <FormattersView tool={tool} onBackToHome={navigateBack} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />; break;
      }
    }
    return (<div className="space-y-4">{renderAdminPreviewBanner()}{renderMaintenanceBanner()}{toolViewContent}</div>);
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen flex flex-col font-sans selection:bg-[color:var(--brand)] selection:text-white bg-[color:var(--bg)] text-[color:var(--ink)] pb-14 lg:pb-0">
        <CodepackrFamilyBar />
        <Navbar
          theme="light"
          onOpenSearch={() => setIsSearchOpen(true)}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onGoHome={navigateToHome}
          onGoContact={navigateToContact}
          onGoBookmarks={() => handleSelectCategory('bookmarks')}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isAdmin={isAuthenticated}
          onGoAdmin={() => { setActivePage('admin'); setActiveTool(null); window.history.pushState({}, '', '/admin'); }}
          onOpenBugReport={() => setIsBugModalOpen(true)}
        />
        <GlobalBanner />
        <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { handleSelectCategory(cat); setIsSidebarOpen(false); }}
            onGoHome={navigateToHome}
            onGoBookmarks={() => { handleSelectCategory('bookmarks'); setIsSidebarOpen(false); }}
            onGoContact={navigateToContact}
            onGoPrivacy={() => navigateToPrivacy('privacy')}
            onGoTerms={() => navigateToPrivacy('terms')}
          />
          <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-10 py-5 sm:py-8 lg:py-10">
            {activePage === 'admin' ? (
              <AdminPortal onBack={navigateBack} />
            ) : activePage === 'contact' ? (
              <ContactView onBack={navigateBack} />
            ) : activePage === 'privacy' ? (
              <PrivacyPolicyView onBack={navigateBack} onContactClick={navigateToContact} initialTab={legalTab} />
            ) : activePage === 'notFound' ? (
              <NotFoundView onGoHome={navigateToHome} onOpenSearch={() => setIsSearchOpen(true)} onSelectTool={navigateToTool} />
            ) : activeTool ? (
              <div className="max-w-6xl mx-auto animate-fade-in">{renderTool(activeTool)}</div>
            ) : (
              <HomeDashboard onSelectTool={navigateToTool} onOpenSearch={() => setIsSearchOpen(true)} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />
            )}
          </main>
        </div>
        <MobileBottomNav
          active={activeTool ? 'home' : isSearchOpen ? 'search' : selectedCategory === 'bookmarks' ? 'favorites' : isSidebarOpen ? 'menu' : 'home'}
          onHome={() => { setIsSidebarOpen(false); navigateToHome(); }}
          onSearch={() => { setIsSidebarOpen(false); setIsSearchOpen(true); }}
          onFavorites={() => { setIsSidebarOpen(false); handleSelectCategory('bookmarks'); }}
          onMenu={() => setIsSidebarOpen(true)}
          favoriteCount={bookmarkCount}
        />
        <Footer
          onGoHome={navigateToHome}
          onGoContact={navigateToContact}
          onGoPrivacy={navigateToPrivacy}
          onOpenSitemap={() => setIsSitemapModalOpen(true)}
          onOpenAdminLogin={() => {
            if (isAuthenticated) {
              setActivePage('admin'); setActiveTool(null); window.history.pushState({}, '', '/admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else setIsAdminLoginOpen(true);
          }}
          onOpenBugReport={() => setIsBugModalOpen(true)}
        />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectTool={navigateToTool} />
        <SitemapModal isOpen={isSitemapModalOpen} onClose={() => setIsSitemapModalOpen(false)} onSelectTool={navigateToTool} onNavigateAdmin={() => { setActivePage('admin'); setActiveTool(null); window.history.pushState({}, '', '/admin'); }} />
        <AdminLoginModal isOpen={isAdminLoginOpen} onClose={() => setIsAdminLoginOpen(false)} onSuccess={() => { setIsAdminLoginOpen(false); setActivePage('admin'); setActiveTool(null); window.history.pushState({}, '', '/admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} tool={activeTool} onNavigateContact={navigateToContact} />
      </div>
    </CurrencyProvider>
  );
};
