import React, { useState } from 'react';
import { useToolGovernance } from '../lib/useToolGovernance';
import { Info, AlertTriangle, AlertOctagon, ExternalLink, X } from 'lucide-react';

export const GlobalBanner: React.FC = () => {
  const { globalConfig } = useToolGovernance();
  const [dismissed, setDismissed] = useState(false);

  if (!globalConfig.globalBannerActive || dismissed || !globalConfig.globalBannerText) {
    return null;
  }

  const typeConfig = {
    info: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/40',
      border: 'border-blue-500/30',
      text: 'text-blue-900 dark:text-blue-200',
      icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
      badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      label: 'Announcement',
    },
    warning: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      border: 'border-amber-500/30',
      text: 'text-amber-900 dark:text-amber-200',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
      badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
      label: 'Advisory',
    },
    critical: {
      bg: 'bg-rose-500/10 dark:bg-rose-950/40',
      border: 'border-rose-500/30',
      text: 'text-rose-900 dark:text-rose-200',
      icon: <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
      badge: 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/30',
      label: 'Critical Alert',
    },
  }[globalConfig.globalBannerType || 'info'];

  return (
    <div
      className={`w-full border-b transition-all duration-200 py-2.5 px-4 sm:px-6 ${typeConfig.bg} ${typeConfig.border}`}
      role="alert"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {typeConfig.icon}
          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border shrink-0 ${typeConfig.badge}`}>
            {typeConfig.label}
          </span>
          <p className={`font-medium truncate sm:whitespace-normal ${typeConfig.text}`}>
            {globalConfig.globalBannerText}
          </p>
          {globalConfig.globalBannerLink && (
            <a
              href={globalConfig.globalBannerLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-bold underline hover:opacity-80 transition-opacity shrink-0 ml-1 ${typeConfig.text}`}
            >
              <span>{globalConfig.globalBannerLinkText || 'Learn More'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className={`p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer ${typeConfig.text}`}
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
