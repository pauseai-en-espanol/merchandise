import {
  AUTHORED_STYLE,
  type FontBook,
  render,
  type Rendered,
  wordmarkFor,
} from '@pauseai-es/merch-core';
import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  designBySlug,
  FAMILIES,
  familyById,
  type Lang,
  LANGS,
  loadFonts,
  loadFront,
  loadPortrait,
  markUrl,
  NATIVE_FAMILY,
  REPO_URL,
} from './assets';
import { ChapterStep } from './components/ChapterStep';
import { DownloadStep } from './components/DownloadStep';
import { Preview } from './components/Preview';
import { TeeStep } from './components/TeeStep';
import { TextStep } from './components/TextStep';
import { ThemeToggle } from './components/ThemeToggle';
import { browserLang, initialUiLang, LANG_PATH, pathLang, STRINGS } from './i18n';
import { defaultSettings, isValidUrl, restoreSettings, type Settings, teeOf } from './settings';
import { clearSaved, loadSaved, save, type Theme, THEMES } from './storage';

export type Update = (patch: Partial<Settings>) => void;

// The logos page and every logo file it offers load only when it opens.
const LogosPage = lazy(() =>
  import('./components/LogosPage').then((m) => ({ default: m.LogosPage })),
);

/** The generator, or the logos page at #logos (linkable, and Back returns). */
type View = 'generator' | 'logos';
const viewOf = (): View => (location.hash === '#logos' ? 'logos' : 'generator');

const safeRender = (
  settings: Settings,
  canonical: string,
  fonts: FontBook,
  portrait: string | undefined,
): Rendered | null => {
  const design = designBySlug(settings.slug);
  try {
    return render({
      canonical,
      edits: settings.edits,
      families: FAMILIES,
      family: familyById(settings.familyId),
      fonts,
      portrait,
      tee: teeOf(settings),
      tracking: settings.tracking ? { source: design.utmSource } : false,
      url: isValidUrl(settings.url) ? settings.url : familyById(settings.familyId).url,
      wordmark: settings.wordmark,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const App = () => {
  // The page (/ or /en/) sets the interface language; a first visit at / follows
  // the browser. Everything else the visitor chose is restored from storage.
  const [saved] = useState(loadSaved);
  const [ui, setUiState] = useState<Lang>(() => initialUiLang(saved.ui));
  const t = STRINGS[ui];
  const [settings, setSettings] = useState<Settings>(() =>
    restoreSettings(saved.settings, defaultSettings(ui)),
  );

  /** Switch language and move to that language's page (no reload). */
  const setUi = useCallback((lang: Lang) => {
    setUiState(lang);
    if (pathLang() !== lang) history.pushState(null, '', LANG_PATH[lang] + location.hash);
  }, []);

  const [view, setView] = useState<View>(viewOf);

  useEffect(() => {
    const onPop = () => {
      setUiState(pathLang());
      setView(viewOf());
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const closeLogos = () => {
    history.pushState(null, '', location.pathname);
    setView('generator');
    window.scrollTo({ top: 0 });
  };
  const [theme, setTheme] = useState<Theme>(() =>
    THEMES.includes(saved.theme as Theme) ? (saved.theme as Theme) : 'auto',
  );
  const [step, setStep] = useState(() =>
    typeof saved.step === 'number' && saved.step >= 0 && saved.step < STRINGS.es.steps.length
      ? saved.step
      : 0,
  );
  const [fonts, setFonts] = useState<FontBook | null>(null);
  const [canonical, setCanonical] = useState<{ key: string; svg: string } | null>(null);
  const [portrait, setPortrait] = useState<{ key: string; svg: string } | null>(null);

  useEffect(() => {
    void loadFonts().then(setFonts);
  }, []);

  useEffect(() => {
    document.documentElement.lang = ui;
    document.title = view === 'logos' ? `${t.logos.title} · ${t.app.title}` : t.app.title;
  }, [ui, view, t.app.title, t.logos.title]);

  useEffect(() => save({ settings, step, theme, ui }), [settings, step, theme, ui]);

  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  const workspace = useRef<HTMLElement>(null);
  /** Change step and bring the panel back into view (long steps end far down the page). */
  const goTo = (next: number) => {
    setStep(next);
    const top = workspace.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ behavior: reduce ? 'auto' : 'smooth', top: window.scrollY + top - 8 });
    }
  };

  const startOver = () => {
    if (!globalThis.confirm(t.app.resetConfirm)) return;
    clearSaved();
    const browser = browserLang();
    setUi(browser);
    setSettings(defaultSettings(browser));
    setStep(0);
    setTheme('auto');
  };

  const key = `${settings.slug}/${settings.lang}`;
  useEffect(() => {
    let alive = true;
    void loadFront(settings.slug, settings.lang).then((svg) => {
      if (alive) setCanonical({ key, svg });
    });
    return () => {
      alive = false;
    };
  }, [key, settings.slug, settings.lang]);

  // Portrait designs print the drawing in the chosen style (loaded on demand).
  // The authored style needs no swap (and no download).
  const person =
    settings.portraitStyle === AUTHORED_STYLE
      ? undefined
      : designBySlug(settings.slug).portrait?.person;
  const portraitKey = person ? `${person}/${settings.portraitStyle}` : null;
  useEffect(() => {
    if (!person || !portraitKey) return;
    let alive = true;
    void loadPortrait(person, settings.portraitStyle)
      .catch((error: unknown) => {
        // Never leave the preview loading: print the authored finish instead.
        console.error(error);
        return '';
      })
      .then((svg) => {
        if (alive) setPortrait({ key: portraitKey, svg });
      });
    return () => {
      alive = false;
    };
  }, [person, portraitKey, settings.portraitStyle]);

  const update: Update = useCallback((patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (patch.url !== undefined && !next.wordmarkEdited) next.wordmark = wordmarkFor(patch.url);
      return next;
    });
  }, []);

  /** Changing design or text language starts the text over, and follows the language's logo. */
  const chooseDesign = useCallback((slug: string, lang: Lang) => {
    setSettings((s) => {
      const design = designBySlug(slug);
      const nextLang = design.langs.includes(lang) ? lang : (design.langs[0] ?? lang);
      const next: Settings = { ...s, edits: {}, lang: nextLang, slug };
      if (nextLang !== s.lang && s.familyId === NATIVE_FAMILY[s.lang]) {
        const family = familyById(NATIVE_FAMILY[nextLang]);
        next.familyId = family.id;
        if (FAMILIES.some((f) => f.url === s.url)) {
          next.url = family.url;
          if (!s.wordmarkEdited) next.wordmark = wordmarkFor(family.url);
        }
      }
      return next;
    });
  }, []);

  const deferred = useDeferredValue(settings);
  const current = canonical?.key === `${deferred.slug}/${deferred.lang}` ? canonical.svg : null;
  // undefined: the design has no portrait; null: its chosen style is still loading.
  const deferredPerson =
    deferred.portraitStyle === AUTHORED_STYLE
      ? undefined
      : designBySlug(deferred.slug).portrait?.person;
  const currentPortrait = deferredPerson
    ? portrait?.key === `${deferredPerson}/${deferred.portraitStyle}`
      ? portrait.svg
      : null
    : undefined;
  const rendered = useMemo(
    () =>
      fonts && current && currentPortrait !== null
        ? safeRender(deferred, current, fonts, currentPortrait || undefined)
        : null,
    [fonts, current, currentPortrait, deferred],
  );

  const design = designBySlug(settings.slug);
  const steps = t.steps;

  return (
    <div className="page">
      <header className="masthead">
        <div className="brand">
          <img src={markUrl()} alt="" width="40" height="40" />
          <div>
            <h1>{t.app.title}</h1>
            <p className="intro">{t.app.intro}</p>
          </div>
        </div>
        <div className="masthead-tools">
          <a
            className="chip small"
            href="#logos"
            aria-current={view === 'logos' ? 'page' : undefined}
          >
            {t.logos.link}
          </a>
          <div className="ui-lang" role="group" aria-label={t.app.uiLanguage}>
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                className="chip small"
                aria-pressed={ui === lang}
                onClick={() => setUi(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
            <ThemeToggle setTheme={setTheme} t={t} theme={theme} />
          </div>
        </div>
      </header>

      {view === 'logos' ? (
        <Suspense fallback={<p className="muted">{t.app.loading}</p>}>
          <LogosPage onBack={closeLogos} t={t} />
        </Suspense>
      ) : (
        <>
          <nav className="stepper" aria-label="Steps">
            <ol>
              {steps.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={i === step ? 'step' : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="step-n">{i + 1}</span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="link start-over" onClick={startOver}>
              ↺ {t.app.reset}
            </button>
          </nav>

          <main ref={workspace} className="workspace">
            <section className="controls" aria-label={steps[step]}>
              {step === 0 && (
                <TeeStep
                  chooseDesign={chooseDesign}
                  fonts={fonts}
                  settings={settings}
                  t={t}
                  ui={ui}
                  update={update}
                />
              )}
              {step === 1 && (
                <ChapterStep rendered={rendered} settings={settings} t={t} update={update} />
              )}
              {step === 2 && current && fonts && (
                <TextStep
                  canonical={current}
                  design={design}
                  rendered={rendered}
                  settings={settings}
                  t={t}
                  update={update}
                />
              )}
              {step === 3 && current && (
                <DownloadStep
                  canonical={current}
                  design={design}
                  rendered={rendered}
                  settings={settings}
                  t={t}
                  ui={ui}
                />
              )}

              <div className="step-nav">
                {step > 0 && (
                  <button type="button" className="button secondary" onClick={() => goTo(step - 1)}>
                    {t.nav.back}
                  </button>
                )}
                {step < steps.length - 1 && (
                  <button type="button" className="button" onClick={() => goTo(step + 1)}>
                    {t.nav.next}
                  </button>
                )}
              </div>
            </section>

            <aside className="preview">
              {rendered ? (
                <Preview rendered={rendered} settings={deferred} t={t} />
              ) : (
                <p className="muted">{t.app.loading}</p>
              )}
            </aside>
          </main>
        </>
      )}

      <footer className="footer">
        <span>{t.app.footer}</span>
        <span className="footer-links">
          <a href="#logos">{t.logos.link}</a>
          <a href={REPO_URL}>{t.app.source}</a>
        </span>
      </footer>
    </div>
  );
};
