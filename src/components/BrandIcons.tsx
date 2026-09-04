import { createLucideIcon } from 'lucide-react';

/**
 * Authentic brand icons constructed using Lucide's official `createLucideIcon` factory.
 * These maintain standard Lucide props (className, size, color, strokeWidth)
 * while faithfully rendering the respective platform logos.
 */

export const GithubIcon = createLucideIcon('Github', [
  ['path', { d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22', key: 'gh-1' }],
]);

export const XTwitterIcon = createLucideIcon('XTwitter', [
  ['path', { d: 'M4 4l11.7 16h4.3L8.3 4H4z', key: 'x-1' }],
  ['path', { d: 'M4 20l6.77-6.77m2.46-2.46L20 4', key: 'x-2' }],
]);

export const LinkedinIcon = createLucideIcon('Linkedin', [
  ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z', key: 'li-1' }],
  ['rect', { x: '2', y: '9', width: '4', height: '12', key: 'li-2' }],
  ['circle', { cx: '4', cy: '4', r: '2', key: 'li-3' }],
]);

export const YoutubeIcon = createLucideIcon('Youtube', [
  ['path', { d: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17', key: 'yt-1' }],
  ['path', { d: 'm10 15 5-3-5-3z', key: 'yt-2' }],
]);

export const InstagramIcon = createLucideIcon('Instagram', [
  ['rect', { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5', key: 'ig-1' }],
  ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', key: 'ig-2' }],
  ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5', key: 'ig-3' }],
]);
