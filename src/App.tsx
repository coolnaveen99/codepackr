import React, { useState, useEffect } from 'react';
import { TOOLS } from './data/tools';
import { ToolDef, ToolCategory, CategoryFilter } from './types';
import { Navbar } from './components/Navbar';
import { SearchModal } from './components/SearchModal';
import { HomeDashboard } from './components/HomeDashboard';
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
import { EdiToolsView } from './components/tools/EdiToolsView';
import { XmlToolsView } from './components/xml/XmlToolsView';
import { AdminPortal } from './components/admin/AdminPortal';
import { useToolGovernance } from './lib/useToolGovernance';
import { resolveCurrentRoute, getToolPath, getToolDirectUrl } from './lib/urls';
import { updateDocumentMetadata } from './lib/seo';
import { CurrencyProvider } from './lib/CurrencyContext';
import { SitemapModal } from './components/SitemapModal';
import { Sidebar } from './components/Sidebar';
import { Terminal, Globe, AlertTriangle, Lock } from 'lucide-react';
import { GithubIcon, XTwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon } from './components/BrandIcons';
import { safeLocalStorage } from './lib/storage';

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
    return 'light';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { getToolStatus, isToolVisible } = useToolGovernance();

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

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToTool = (tool: ToolDef) => {
    setActiveTool(tool);
    setActivePage('home');
    const toolPath = getToolPath(tool);
    window.history.pushState({}, '', toolPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setActiveTool(null);
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
        const catSection = document.getElementById('categories-section');
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

    if (gov.status === 'hidden' && !isToolVisible(tool.id)) {
      return (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[var(--surface-2)] text-[var(--muted)]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Tool Unavailable</h2>
          <p className="text-xs text-[var(--muted)]">This utility is currently unlisted or undergoing administrative review.</p>
          <button
            onClick={navigateToHome}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Browse Available Tools
          </button>
        </div>
      );
    }

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

    let toolViewContent: React.ReactNode = null;
    if (tool.id === 'json-definition-generator') {
      toolViewContent = <JsonDefinitionView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
    } else {
      switch (tool.category) {
        case 'formatters':
          toolViewContent = <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'encoders':
          toolViewContent = <EncodersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'validators':
          toolViewContent = <ValidatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'converters':
          toolViewContent = <ConvertersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'edi':
          toolViewContent = <EdiToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'xml':
          toolViewContent = <XmlToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'calculators':
          toolViewContent = <CalculatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'utilities':
          toolViewContent = <UtilitiesView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        case 'text':
          toolViewContent = <TextToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
        default:
          toolViewContent = <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
          break;
      }
    }

    return (
      <div className="space-y-4">
        {renderMaintenanceBanner()}
        {toolViewContent}
      </div>
    );
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen flex flex-col selection:bg-[var(--brand)] selection:text-white"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
      >
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
      />

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
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
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
            renderTool(activeTool)
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
      <footer className="border-t mt-16 py-8"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
          {/* Quick Navigation & Branding */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #5B52E8 0%, #009f88 100%)' }}
              >
                <Terminal className="w-3 h-3 text-white" />
              </span>
              <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                Codepackr
              </span>
              <span className="hidden sm:inline">— Fast, private developer utilities</span>
            </div>

            <div className="flex items-center gap-5 font-medium">
              <button onClick={navigateToHome} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                All Tools
              </button>
              <button onClick={() => handleSelectCategory('bookmarks')} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                Bookmarked
              </button>
              <button onClick={navigateToContact} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                Contact &amp; Feedback
              </button>
              <button onClick={() => navigateToPrivacy('privacy')} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                Privacy Policy
              </button>
              <button onClick={() => navigateToPrivacy('terms')} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                Terms &amp; Conditions
              </button>
              <button
                onClick={() => setIsSitemapModalOpen(true)}
                className="hover:text-[var(--brand)] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-[var(--brand)]" />
                <span>Sitemap &amp; Index</span>
              </button>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--brand)] transition-colors cursor-pointer opacity-75 hover:opacity-100"
              >
                XML
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                    e.preventDefault();
                    setActivePage('admin');
                    window.history.pushState({}, '', '/admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="hover:text-[var(--brand)] transition-colors cursor-pointer opacity-40 hover:opacity-100 font-mono text-[11px]"
              >
                Admin
              </a>
            </div>
          </div>

          {/* Clean Bottom Bar */}
          <div className="border-t pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <div className="text-center md:text-left leading-relaxed">
              &copy; {new Date().getFullYear()} Codepackr. All Rights Reserved. By using this website you've read the{' '}
              <button
                onClick={() => navigateToPrivacy('privacy')}
                className="font-medium underline underline-offset-4 decoration-dotted hover:text-[var(--ink)] hover:decoration-solid transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              {', '}
              <button
                onClick={() => navigateToPrivacy('terms')}
                className="font-medium underline underline-offset-4 decoration-dotted hover:text-[var(--ink)] hover:decoration-solid transition-colors cursor-pointer"
              >
                Terms and Conditions
              </button>
              {', and view the '}
              <button
                onClick={() => setIsSitemapModalOpen(true)}
                className="font-medium underline underline-offset-4 decoration-dotted hover:text-[var(--ink)] hover:decoration-solid transition-colors cursor-pointer"
              >
                Sitemap &amp; Search Index
              </button>.
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <a
                href="https://github.com/coolnaveen99/codepackr"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--ink)] transition-colors p-1"
                aria-label="GitHub"
                title="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>

              <a
                href="https://x.com/Codepackr"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--ink)] transition-colors p-1"
                aria-label="X (formerly Twitter)"
                title="X / Twitter"
              >
                <XTwitterIcon className="w-4 h-4" />
              </a>

              <a
                href="https://www.linkedin.com/company/codepackr/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#0A66C2] transition-colors p-1"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>

              <a
                href="https://youtube.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FF0000] transition-colors p-1 opacity-70 hover:opacity-100"
                aria-label="YouTube"
                title="YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>

              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#E1306C] transition-colors p-1 opacity-70 hover:opacity-100"
                aria-label="Instagram"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

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
      />
    </div>
    </CurrencyProvider>
  );
};
