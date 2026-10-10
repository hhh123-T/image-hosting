const paths: Record<string, string> = {
  play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  restart: '<path d="M3 10a9 9 0 1 1 2.6 8.4M3 4v6h6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  cinema: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 9h6v6H9z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  frame: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h6m-6 10h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export function icon(name: string, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}
