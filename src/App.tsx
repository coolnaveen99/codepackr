import React, { useState, useEffect } from 'react';
import { TOOLS } from './data/tools';
import { ToolDef, CategoryFilter } from './types';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { HomeDashboard } from './components/HomeDashboard';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { SitemapModal } from './components/SitemapModal';
import { ContactView } from './components/ContactView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { FormattersView } from './components/tools/FormattersView';
import { EncodersView } from './components/tools/EncodersView';
import { ValidatorsView } from './components/tools/ValidatorsView';
import { ConvertersView } from './components/tools/ConvertersView';
import { CalculatorsView } from './components/tools/CalculatorsView';
import { UtilitiesView } from './components/tools/UtilitiesView';
import { TextToolsView } from './components/tools/TextToolsView';
import { JsonDefinitionView } from './components/tools/JsonDefinitionView';
import { FinancialPlannerView } from './components/tools/FinancialPlannerView';
import { EdiToolsView } from './components/tools/EdiToolsView';
import { XmlToolsView } from './components/xml/XmlToolsView';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { GlobalBanner } from './components/GlobalBanner';
import { useToolGovernance } from './lib/useToolGovernance';
import { useAdminAuth } from './lib/useAdminAuth';
import { resolveCurrentRoute, getToolPath } from './lib/urls';
import { updateDocumentMetadata } from './lib/seo';
import { CurrencyProvider } from './lib/CurrencyContext';
import { safeLocalStorage } from './lib/storage';
import { popSmartPastePayload } from './lib/workspace';
import { AlertTriangle, Lock, Shield } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = safeLocalStorage.getItem('codepackr_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {
      // Fallback for restricted environments
    }
    return 'dark'; // Enterprise default dark
  });

  // Navigation state initialized synchronously from current URL
  const [initialRoute] = useState(() => resolveCurrentRoute());
  const [activeTool, setActiveTool] = useState<ToolDef | null>(() => initialRoute.tool);
  const [activePage, setActivePage] = useState<'home' | 'contact' | 'privacy' | 'admin'>(() => initialRoute.page);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [smartPasteInput, setSmartPasteInput] = useState<string>('');
  const { getToolStatus, isToolVisible } = useToolGovernance();
  const { isAuthenticated } = useAdminAuth();

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeLocalStorage.setItem('codepackr_theme', theme);
  }, [theme]);

  // Synchronize document title, canonical tag, meta descriptions, social tags, and JSON-LD for SEO
  useEffect(() => {
    const rawSlug = typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '')
      : '';

    let routeKey = 'home';
    if (activePage === 'contact') {
      routeKey = 'contact';
    } else if (activePage === 'privacy') {
      routeKey = legalTab === 'terms' ? 'terms' : 'privacy';
    } else if (rawSlug && rawSlug !== 'index') {
      routeKey = rawSlug;
    } else if (activeTool) {
      routeKey = activeTool.id;
    }

    updateDocumentMetadata(routeKey);
  }, [activeTool, activePage, legalTab]);

  // Read URL query parameters and pathname on initial load & popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const route = resolveCurrentRoute();

      if (route.category) {
        setSelectedCategory(route.category as CategoryFilter);
      }

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
        } else {
          setLegalTab('privacy');
        }
      } else if (route.tool) {
        setActiveTool(route.tool);
        setActivePage('home');
      } else {
        setActiveTool(null);
        setActivePage('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Keyboard shortcuts (Cmd/Ctrl+K for Search, Cmd/Ctrl+Shift+A for Admin Login)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }

      // Enterprise Admin Access: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminLoginOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToTool = (tool: ToolDef, initialPayload?: string) => {
    setActiveTool(tool);
    if (initialPayload !== undefined) {
      setSmartPasteInput(initialPayload);
    }
    setActivePage('home');
    const toolPath = getToolPath(tool);
    window.history.pushState({}, '', toolPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setActiveTool(null);
    setSmartPasteInput('');
    setActivePage('home');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToContact = () => {
    setActiveTool(null);
    setActivePage('contact');
    window.history.pushState({}, '', '/contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPrivacy = (tab: 'privacy' | 'terms' = 'privacy') => {
    setLegalTab(tab);
    setActiveTool(null);
    setActivePage('privacy');
    const path = tab === 'terms' ? '/terms' : '/privacy';
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: CategoryFilter) => {
    setSelectedCategory(cat);
    setActiveTool(null);
    setActivePage('home');
    const newPath = cat !== 'all' ? `/?cat=${cat}` : '/';
    window.history.pushState({}, '', newPath);
    if (cat !== 'all') {
      setTimeout(() => {
        const catSection = document.getElementById('tool-grid');
        if (catSection) {
          const navOffset = 110;
          const targetY = catSection.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render active tool component
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
            <button
              onClick={navigateToHome}
              className="px-6 py-2.5 rounded-xl font-bold bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-hover)] transition-colors cursor-pointer"
            >
              Browse All Tools
            </button>
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="px-6 py-2.5 rounded-xl font-bold border border-[color:var(--border)] text-[color:var(--ink)] hover:border-[color:var(--brand)] transition-colors cursor-pointer"
            >
              Admin Sign In
            </button>
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
              <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Admin Preview Mode
              </div>
              <p className="text-xs mt-0.5 leading-relaxed">
                This utility is marked as <strong>Hidden</strong> in Firestore Governance. Public visitors see a Tool Unavailable screen.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActivePage('admin');
              setActiveTool(null);
              window.history.pushState({}, '', '/admin');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-950 dark:text-amber-100 hover:bg-amber-500/30 transition-colors whitespace-nowrap cursor-pointer"
          >
            Governance Console &rarr;
          </button>
        </div>
      );
    };

    const renderMaintenanceBanner = () => {
      if (gov.status !== 'maintenance' && !gov.noticeMessage) return null;
      return (
        <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {gov.status === 'maintenance' ? 'Scheduled Maintenance Notice' : 'Notice'}
            </div>
            <p className="text-xs mt-0.5 leading-relaxed">
              {gov.noticeMessage || 'This utility is currently undergoing scheduled maintenance and updates by the Codepackr team. Some features may be temporarily limited.'}
            </p>
          </div>
        </div>
      );
    };

    const initialInputForTool = smartPasteInput || popSmartPastePayload(tool.id) || popSmartPastePayload(tool.category) || '';

    let toolViewContent: React.ReactNode = null;
    if (tool.id === 'json-definition-generator') {
      toolViewContent = <JsonDefinitionView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
    } else if (tool.id === 'financial-planner') {
      toolViewContent = <FinancialPlannerView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
    } else {
      switch (tool.category) {
        case 'formatters':
          toolViewContent = <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'encoders':
          toolViewContent = <EncodersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'validators':
          toolViewContent = <ValidatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'converters':
          toolViewContent = <ConvertersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'edi':
          toolViewContent = <EdiToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'xml':
          toolViewContent = <XmlToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'calculators':
          toolViewContent = <CalculatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'utilities':
          toolViewContent = <UtilitiesView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        case 'text':
          toolViewContent = <TextToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
        default:
          toolViewContent = <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} initialInput={initialInputForTool} />;
          break;
      }
    }

    return (
      <div className="space-y-4">
        {renderAdminPreviewBanner()}
        {renderMaintenanceBanner()}
        {toolViewContent}
      </div>
    );
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen flex flex-col font-sans selection:bg-[color:var(--brand)] selection:text-white bg-[color:var(--bg)] text-[color:var(--ink)]">
        {/* Top Navigation */}
        <Navbar
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onOpenSearch={() => setIsSearchOpen(true)}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onGoHome={navigateToHome}
          onGoContact={navigateToContact}
          onGoBookmarks={() => handleSelectCategory('bookmarks')}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isAdmin={isAuthenticated}
          onGoAdmin={() => {
            setActivePage('admin');
            setActiveTool(null);
            window.history.pushState({}, '', '/admin');
          }}
        />

        {/* Global Broadcast Announcement Banner */}
        <GlobalBanner />

        {/* App Shell: Developer Sidebar + Main Content Workbench */}
        <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              handleSelectCategory(cat);
              setIsSidebarOpen(false);
            }}
            onGoHome={navigateToHome}
            onGoBookmarks={() => {
              handleSelectCategory('bookmarks');
              setIsSidebarOpen(false);
            }}
            onGoContact={navigateToContact}
            onGoPrivacy={() => navigateToPrivacy('privacy')}
            onGoTerms={() => navigateToPrivacy('terms')}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
            {activePage === 'admin' ? (
              <AdminPortal onBack={navigateToHome} />
            ) : activePage === 'contact' ? (
              <ContactView onBack={navigateToHome} />
            ) : activePage === 'privacy' ? (
              <PrivacyPolicyView
                onBack={navigateToHome}
                onContactClick={navigateToContact}
                initialTab={legalTab}
              />
            ) : activeTool ? (
              <div className="max-w-6xl mx-auto animate-fade-in">{renderTool(activeTool)}</div>
            ) : (
              <HomeDashboard
                onSelectTool={navigateToTool}
                onOpenSearch={() => setIsSearchOpen(true)}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
            )}
          </main>
        </div>

        {/* Footer */}
        <Footer
          onGoHome={navigateToHome}
          onGoContact={navigateToContact}
          onGoPrivacy={navigateToPrivacy}
          onOpenSitemap={() => setIsSitemapModalOpen(true)}
          onOpenAdminLogin={() => {
            if (isAuthenticated) {
              setActivePage('admin');
              setActiveTool(null);
              window.history.pushState({}, '', '/admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setIsAdminLoginOpen(true);
            }
          }}
        />

        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectTool={navigateToTool}
        />

        {/* Live Sitemap & Search Indexing Hub Modal */}
        <SitemapModal
          isOpen={isSitemapModalOpen}
          onClose={() => setIsSitemapModalOpen(false)}
          onSelectTool={navigateToTool}
          onNavigateAdmin={() => {
            setActivePage('admin');
            setActiveTool(null);
            window.history.pushState({}, '', '/admin');
          }}
        />

        {/* Admin Login Modal */}
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={() => {
            setIsAdminLoginOpen(false);
            setActivePage('admin');
            setActiveTool(null);
            window.history.pushState({}, '', '/admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </CurrencyProvider>
  );
};
