import { useState } from 'react';

import type { Lang } from '../assets';
import type { Settings } from '../settings';

import { type Strings } from '../i18n';
import { shareUrl } from '../share';

interface Props {
  settings: Settings;
  t: Strings;
  ui: Lang;
}

/**
 * Copy a link to this exact tee (see share.ts). Where the clipboard is
 * blocked, the link shows in a field to copy by hand.
 */
export const ShareLink = ({ settings, t, ui }: Props) => {
  const url = shareUrl(settings, ui, location.origin);
  // What happened to which link: a change to the tee makes it a new one.
  const [done, setDone] = useState<{ state: 'copied' | 'manual'; url: string } | null>(null);
  const state = done?.url === url ? done.state : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setDone({ state: 'copied', url });
    } catch {
      setDone({ state: 'manual', url });
    }
  };

  return (
    <div className="share">
      <button type="button" className="button secondary small" onClick={() => void copy()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
        </svg>
        {state === 'copied' ? t.share.copied : t.share.button}
      </button>
      <p className="share-hint" role="status">
        {state === 'manual' ? t.share.manual : t.share.hint}
      </p>
      {state === 'manual' && (
        <input
          className="share-url"
          readOnly
          value={url}
          aria-label={t.share.button}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  );
};
