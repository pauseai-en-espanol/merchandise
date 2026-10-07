import type { Strings } from '../i18n';
import type { Theme } from '../storage';

const NEXT: Record<Theme, Theme> = { auto: 'light', dark: 'auto', light: 'dark' };

const ICONS: Record<Theme, React.ReactNode> = {
  // Half-filled circle: follows the device.
  auto: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />,
  light: (
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </g>
  ),
};

/** One button cycling automatic → light → dark; the icon shows the current state. */
export const ThemeToggle = ({
  setTheme,
  t,
  theme,
}: {
  setTheme: (theme: Theme) => void;
  t: Strings;
  theme: Theme;
}) => {
  const label = `${t.app.theme}: ${t.app.themes[theme]}`;
  return (
    <button
      type="button"
      className="chip small icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(NEXT[theme])}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        {ICONS[theme]}
      </svg>
    </button>
  );
};
