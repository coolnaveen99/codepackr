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
import { EdiToolsView } from './components/tools/EdiToolsView';
import { XmlToolsView } from './components/xml/XmlToolsView';
import { resolveCurrentRoute, getToolPath, getToolDirectUrl } from './lib/urls';
import { updateDocumentMetadata } from './lib/seo';
import { Shield, Terminal, GitBranch, Send, Camera, CirclePlay, Star } from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('codepackr_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Navigation state
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [activePage, setActivePage] = useState<'home' | 'contact' | 'privacy'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codepackr_theme', theme);
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
      routeKey = 'privacy';
    } else if (rawSlug && rawSlug !== 'index') {
      routeKey = rawSlug;
    } else if (activeTool) {
      routeKey = activeTool.id;
    }

    updateDocumentMetadata(routeKey);
  }, [activeTool, activePage]);

  // Read URL query parameters and pathname on initial load & popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const route = resolveCurrentRoute();

      if (route.category) {
        setSelectedCategory(route.category as CategoryFilter);
      }

      if (route.page === 'contact') {
        setActivePage('contact');
        setActiveTool(null);
      } else if (route.page === 'privacy') {
        setActivePage('privacy');
        setActiveTool(null);
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
    window.history.pushState({}, '', '/contact.html');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPrivacy = () => {
    setActiveTool(null);
    setActivePage('privacy');
    window.history.pushState({}, '', '/privacy.html');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: CategoryFilter) => {
    setSelectedCategory(cat);
    setActiveTool(null);
    setActivePage('home');
    const newPath = cat !== 'all' ? `/?cat=${cat}` : '/';
    window.history.pushState({}, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render active tool component
  const renderTool = (tool: ToolDef) => {
    switch (tool.category) {
      case 'formatters':
        return <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'encoders':
        return <EncodersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'validators':
        return <ValidatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'converters':
        return <ConvertersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'edi':
        return <EdiToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'xml':
        return <XmlToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'calculators':
        return <CalculatorsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'utilities':
        return <UtilitiesView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      case 'text':
        return <TextToolsView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
      default:
        return <FormattersView tool={tool} onBackToHome={navigateToHome} onSelectRelated={navigateToTool} />;
    }
  };

  return (
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activePage === 'contact' ? (
          <ContactView onBack={navigateToHome} />
        ) : activePage === 'privacy' ? (
          <PrivacyPolicyView onBack={navigateToHome} onContactClick={navigateToContact} />
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

      {/* Footer with Social Links */}
      <footer className="border-t mt-12 py-10"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            {/* Brand Logo & Mission */}
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #5B52E8 0%, #009f88 100%)' }}
              >
                <Terminal className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                Codepackr
              </span>
              <span>— Free, fast, private developer utilities</span>
            </div>

            {/* Navigation Links */}
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
              <button onClick={navigateToPrivacy} className="hover:text-[var(--brand)] transition-colors cursor-pointer">
                Privacy Policy
              </button>
            </div>

            {/* Social Media & Repository Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/coolnaveen99/codepackr"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all hover:text-[var(--brand)] hover:border-[var(--brand)] shadow-sm text-xs font-semibold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                aria-label="GitHub repository"
                title="GitHub repository"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>

              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all hover:text-[#1DA1F2] hover:border-[#1DA1F2] shadow-sm text-xs font-semibold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                aria-label="Twitter / X"
                title="Twitter / X"
              >
                <Send className="w-3.5 h-3.5 text-[#1DA1F2]" />
                <span className="hidden sm:inline">Twitter</span>
              </a>

              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all hover:text-[#E1306C] hover:border-[#E1306C] shadow-sm text-xs font-semibold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                aria-label="Instagram"
                title="Instagram"
              >
                <Camera className="w-3.5 h-3.5 text-[#E1306C]" />
                <span className="hidden sm:inline">Instagram</span>
              </a>

              <a
                href="https://youtube.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all hover:text-[#FF0000] hover:border-[#FF0000] shadow-sm text-xs font-semibold"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                aria-label="YouTube"
                title="YouTube"
              >
                <CirclePlay className="w-3.5 h-3.5 text-[#FF0000]" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <span>&copy; {new Date().getFullYear()} Codepackr. All rights reserved. Open source under MIT license.</span>
            <div className="flex items-center gap-3">
              <span>Client-side only execution</span>
              <span>&bull;</span>
              <span>Zero server logs</span>
              <span>&bull;</span>
              <span>SSL / HTTPS Secured</span>
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
    </div>
  );
};
