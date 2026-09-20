import React from 'react';
import { createRoot } from 'react-dom/client';
import AeroShards from './components/AeroShards.jsx';
import Iridescence from './components/Iridescence.jsx';
import Silk from './components/Silk.jsx';

function parseTriplet01(str) {
  if (!str) return null;
  const parts = str.split(',').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return parts.map((n) => n / 255);
}

// Every page hero: [data-bg="shards"] — the site's terracotta/amber palette,
// same prop values you specified, only backgroundColor/shardColor/accentColor
// changed from the demo purple to match the site. Below 720px the shader's
// own "mobile path" (see weightedPath in the shard shader — aspect < 0.82
// takes a different, tighter route) reads as cluttered at the desktop
// density/size, so mobile gets a lighter, calmer pass: fewer shards, smaller,
// slower, dimmer — same component, same colors, just turned down.
const isMobileViewport = window.innerWidth < 720;
document.querySelectorAll('[data-bg="shards"]').forEach((host) => {
  host.classList.add('is-live');
  createRoot(host).render(
    <AeroShards
      backgroundColor="#17120F"
      shardColor="#C2512B"
      accentColor="#EDB04A"
      placement="full"
      flow="stream"
      material="pearl"
      detail="balanced"
      effect="none"
      scale={1}
      spread={1}
      depth={1}
      speed={isMobileViewport ? 0.7 : 1}
      spin={isMobileViewport ? 0.6 : 1}
      interaction="repel"
      density={isMobileViewport ? 0.7 : 1.5}
      shardSize={isMobileViewport ? 0.8 : 1.1}
      stretch={1}
      turbulence={isMobileViewport ? 0.5 : 1}
      glow={isMobileViewport ? 0.6 : 1}
      edgeSoftness={2}
      bloom={isMobileViewport ? 0.25 : 0.5}
      grain={0.05}
      chromaticAberration={0.0075}
      transitionDuration={1}
      interactionRadius={1.5}
      interactionStrength={0.5}
      rippleIntensity={1}
      holdToGather
      paused={false}
    />
  );
});

// Promise band + careers' closing CTA: [data-bg="bends"] — muted warm tint
// per section (falls back to a house amber if the host has no
// data-bg-colors), toned down so an opaque full-bleed shader doesn't wash
// out the copy on top.
document.querySelectorAll('[data-bg="bends"]').forEach((host) => {
  const first = parseTriplet01((host.dataset.bgColors || '').split('|')[0]);
  const base = first || [0.89, 0.48, 0.24];
  const color = base.map((c) => 0.16 + c * 0.28);
  host.classList.add('is-live');
  createRoot(host).render(<Iridescence color={color} speed={0.55} amplitude={0.07} mouseReact />);
});

// The "done properly" CTA specifically (index/services/about, id="contact"):
// [data-bg="silk"] — same site palette, one house tone.
document.querySelectorAll('[data-bg="silk"]').forEach((host) => {
  host.classList.add('is-live');
  createRoot(host).render(
    <Silk speed={2.4} scale={1.1} color="#C2512B" noiseIntensity={1.1} rotation={0} lightMode={false} />
  );
});
