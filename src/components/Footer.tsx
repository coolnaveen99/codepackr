import React from 'react';
import { Terminal, Globe, Lock } from 'lucide-react';
import { GithubIcon, XTwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon } from './BrandIcons';

interface FooterProps {
  onGoHome: () => void;
  onGoContact: () => void;
  onGoPrivacy: (tab: 'privacy' | 'terms') => void;
  onOpenSitemap: () => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onGoHome,
  onGoContact,
  onGoPrivacy,
  onOpenSitemap,
  onOpenAdminLogin,
}) => {
  return (
    <footer id="main-footer" className="border-t border-[color:var(--border)] bg-[color:var(--surface)] py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[color:var(--brand)]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg text-[color:var(--ink)] block leading-none">CodePackr</span>
              <span className="text-xs text-[color:var(--ink-muted)]">Enterprise Developer Utilities</span>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-[color:var(--ink-muted)]">
            <button onClick={onGoHome} className="hover:text-[color:var(--brand)] transition-colors cursor-pointer">Tools</button>
            <button onClick={onGoContact} className="hover:text-[color:var(--brand)] transition-colors cursor-pointer">Contact</button>
            <button onClick={() => onGoPrivacy('privacy')} className="hover:text-[color:var(--brand)] transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => onGoPrivacy('terms')} className="hover:text-[color:var(--brand)] transition-colors cursor-pointer">Terms</button>
            <button onClick={onOpenSitemap} className="flex items-center gap-1.5 hover:text-[color:var(--brand)] transition-colors cursor-pointer">
              <Globe className="w-4 h-4" /> Index &amp; Sitemap
            </button>
          </nav>
        </div>

        <div className="border-t border-[color:var(--border)] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[color:var(--ink-muted)]">
          <div className="flex items-center gap-3">
            <p>&copy; {new Date().getFullYear()} CodePackr. All rights reserved.</p>
            {onOpenAdminLogin && (
              <>
                <span className="opacity-30">&bull;</span>
                <button
                  id="footer-admin-btn"
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1 opacity-50 hover:opacity-100 text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] transition-all cursor-pointer"
                  title="Admin Console (Ctrl+Shift+A)"
                  aria-label="Admin Console"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/coolnaveen99/codepackr" target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)] transition-colors" aria-label="GitHub">
              <GithubIcon className="w-5 h-5" />
            </a>
            <a href="https://x.com/Codepackr" target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)] transition-colors" aria-label="Twitter">
              <XTwitterIcon className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/codepackr/" target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)] transition-colors" aria-label="LinkedIn">
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/" target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)] transition-colors opacity-70 hover:opacity-100" aria-label="YouTube">
              <YoutubeIcon className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)] transition-colors opacity-70 hover:opacity-100" aria-label="Instagram">
              <InstagramIcon className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
