import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state.jsx';
import { assetUrl } from '../api.js';
import { FLAVOR_LOOKS, pickerFlavors } from '../three/flavors.js';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Signature feature: a Ghafour cup in 3D. Picking a real flavor re-scoops the cup
 * and links to that menu item. Falls back to the real product photo when 3D
 * isn't appropriate (reduced motion, no WebGL, or any rendering error).
 */
export default function FlavorStage() {
  const { t, lang, items, openModal, loaded } = useApp();
  const flavors = useMemo(() => pickerFlavors(items), [items]);
  const [slug, setSlug] = useState(null);
  const [mode, setMode] = useState('photo'); // 'photo' (loading or fallback) | '3d'
  const [failed, setFailed] = useState(false);
  const viewRef = useRef(null);
  const sceneRef = useRef(null);
  const chipRefs = useRef([]);

  const selected = flavors.find((f) => f.slug === slug) || flavors[0];
  const slugRef = useRef(null);
  slugRef.current = selected?.slug ?? null;
  const ready = !!selected;

  // default selection once the menu arrives
  useEffect(() => {
    if (!slug && flavors.length) setSlug(flavors[0].slug);
  }, [flavors, slug]);

  // Load the 3D scene after the page is interactive. The menu never waits for it.
  useEffect(() => {
    if (!ready || sceneRef.current || failed) return;
    if (prefersReducedMotion() || !hasWebGL()) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    const start = async () => {
      try {
        const { createCupScene } = await import('../three/cupScene.js');
        if (cancelled || !viewRef.current) return;
        const scene = await createCupScene(viewRef.current, {
          logoUrl: assetUrl('assets/ghafour-logo.jpg'),
          flavor: slugRef.current,
          mobile: window.matchMedia('(max-width: 720px)').matches,
          onFirstFrame: () => !cancelled && setMode('3d'),
        });
        if (cancelled) return scene.dispose();
        sceneRef.current = scene;
        scene.setFlavor(slugRef.current); // in case the visitor picked another flavor while loading
        scene.canvas.addEventListener('webglcontextlost', () => {
          setMode('photo');
          setFailed(true);
        });
      } catch (err) {
        console.warn('3D cup unavailable, showing photo instead:', err);
        if (!cancelled) setFailed(true);
      }
    };
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 250));
    const handle = idle(start);
    return () => {
      cancelled = true;
      (window.cancelIdleCallback || clearTimeout)(handle);
    };
  }, [ready, failed]);

  // dispose on unmount
  useEffect(() => () => sceneRef.current?.dispose(), []);

  useEffect(() => {
    if (selected && sceneRef.current) sceneRef.current.setFlavor(selected.slug);
  }, [selected]);

  if (!flavors.length && loaded) {
    // menu failed to load or has no scoop flavors: a calm, static hero photo instead of a picker
    return (
      <div className="gh-stage gh-stage--static">
        <div className="gh-stage-view is-photo">
          <img
            className="gh-stage-photo"
            src={assetUrl('assets/items/real-arabic-mix.jpg')}
            alt={lang === 'ar' ? 'بوظة غفور عربية مشكل بالقمع' : 'Ghafour Arabic mix ice cream in a cone'}
            width="600"
            height="600"
            decoding="async"
          />
        </div>
      </div>
    );
  }
  if (!flavors.length) {
    // reserve the space while the menu loads (no layout shift)
    return (
      <div className="gh-stage gh-stage--empty" aria-hidden="true">
        <div className="gh-stage-view" />
        <div className="gh-stage-panel" />
      </div>
    );
  }

  const idx = flavors.indexOf(selected);
  const onKey = (e) => {
    const rtl = lang === 'ar';
    const nextKeys = rtl ? ['ArrowLeft', 'ArrowDown'] : ['ArrowRight', 'ArrowDown'];
    const prevKeys = rtl ? ['ArrowRight', 'ArrowUp'] : ['ArrowLeft', 'ArrowUp'];
    let n = null;
    if (nextKeys.includes(e.key)) n = (idx + 1) % flavors.length;
    else if (prevKeys.includes(e.key)) n = (idx - 1 + flavors.length) % flavors.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = flavors.length - 1;
    if (n == null) return;
    e.preventDefault();
    setSlug(flavors[n].slug);
    chipRefs.current[n]?.focus();
  };

  const show3d = mode === '3d' && !failed;

  return (
    <div className="gh-stage">
      <div className={`gh-stage-view ${show3d ? 'is-3d' : 'is-photo'}`}>
        <img
          className="gh-stage-photo"
          src={assetUrl(selected.image)}
          alt={selected[lang].name}
          width="600"
          height="600"
          decoding="async"
        />
        <div className="gh-stage-canvas-wrap" ref={viewRef} />
        {show3d && <p className="gh-stage-hint">{t('stageHint')}</p>}
      </div>

      <div className="gh-stage-panel">
        <p className="gh-eyebrow" id="gh-stage-label">
          {t('stageLabel')}
        </p>
        <div className="gh-swatches" role="radiogroup" aria-labelledby="gh-stage-label" onKeyDown={onKey}>
          {flavors.map((f, i) => {
            const on = f.slug === selected.slug;
            const look = FLAVOR_LOOKS[f.slug];
            const colors = look.scoops.map((s) => s.color);
            return (
              <button
                key={f.slug}
                ref={(el) => (chipRefs.current[i] = el)}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                className={`gh-swatch ${on ? 'is-on' : ''}`}
                onClick={() => setSlug(f.slug)}
              >
                <span
                  className="gh-swatch-dot"
                  aria-hidden="true"
                  style={{
                    background:
                      colors.length > 1
                        ? `conic-gradient(${colors.map((c, k) => `${c} ${(k / colors.length) * 100}% ${((k + 1) / colors.length) * 100}%`).join(',')})`
                        : colors[0],
                  }}
                />
                <span className="gh-swatch-name">{f[lang].name}</span>
              </button>
            );
          })}
        </div>
        <div className="gh-stage-info" aria-live="polite">
          <div>
            <h2 className="gh-stage-name">{selected[lang].name}</h2>
            <p className="gh-stage-desc">{selected[lang].desc}</p>
          </div>
          <div className="gh-stage-buy">
            <span className="gh-price">
              <small>{t('from')}</small> <bdi dir="ltr">${selected.price.toFixed(2)}</bdi>
            </span>
            <button type="button" className="gh-btn gh-btn--soft" onClick={() => openModal(selected.slug)}>
              {t('stageCta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
