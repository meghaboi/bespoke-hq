# BeSpokeHQ — front-end build

Static, framework-free rebuild of the BeSpokeHQ marketing site. No build step,
no package install. Open `index.html` or drop the folder on any static host
(Netlify, Vercel, Cloudflare Pages, S3, plain Apache).

```
index.html          Home — short, hero + why it matters + services teaser + CTA
services.html        Capabilities, offers (custom-quoted), who we serve, how it works
about.html           Team, network, locations, stats
careers.html          Creator network + open roles + application form

assets/css/main.css      Design tokens, type scale, buttons, media, hero, marquee
assets/css/sections.css  Section components, careers, responsive, reduced motion
assets/js/main.js        All interaction (single file, no dependencies of its own)
assets/js/bg-fx.js       Canvas backgrounds — shard field, colour bends, preloader net
```

Pricing is never published on the site. Every offer is scoped and quoted live
on the free consultation call — the site's job is to get someone onto that
call, not to price the work for them.

The site used to be a single long page. It's now four: `index.html` is the
short front door built to convert, and it links out to `services.html`,
`about.html` and `careers.html` for the detail. Every page keeps its own
closing CTA section (`id="contact"`) and a persistent "Book a free call"
button in the header, so the ask is never more than one scroll away no
matter where someone lands.

---

## What the back-end team needs to connect

Everything below is deliberately left unwired. Each one is a single attribute or
href change.

| What | Where | How to wire it |
|---|---|---|
| Creator application form | `careers.html`, the `<form data-form="creator-application">` | Put your endpoint in `data-endpoint="..."`. The script POSTs a `FormData` body and shows the success or error message in `.form__msg`. With the attribute empty it logs the payload to the console instead. |
| Client portal / Sign in | Footers, links marked `data-portal` | Replace `href="#"` with the real URL and remove `data-portal`. Until then clicking shows a "not connected" toast. |
| Book a call | Every page's `#contact` section and "Book a free consultation" button | Currently points at WhatsApp. Swap for Calendly, Cal.com or HubSpot as needed. |
| Contact details | Every `#contact` section and footer | WhatsApp `+1 219 798 1691`, hours Mon–Fri 9am–5pm CST, `hello@bespokehq.com` placeholder email. |
| Social links | All footers | Instagram `@bespoketalent`, TikTok `@bespokehq`, Facebook `BeSpokeHQ`. |
| Analytics | All pages, before `</head>` | Nothing is installed. No cookies are set by this build. |
| Canonical URLs / OG image | Every `<head>` block | Currently `https://bespokehq.com/...` placeholders, one per page. |

The "Apply for this role" buttons inside each careers accordion pre-select the
matching option in the form, via `data-role` on the link matching the `<option>`
text. Keep them in sync if role names change.

---

## Images

All photography is hot-linked from Unsplash with `?auto=format&w=...&q=...`
parameters, so the CDN serves WebP/AVIF at the right size. Before launch, either
licence your own shoot assets and drop them into `assets/img/`, or keep Unsplash
and add the required attribution. Every image already carries `loading="lazy"`,
`decoding="async"` and intrinsic `width`/`height`.

A single CSS filter in `.media img` (desaturate + warm sepia + multiply overlay)
is what makes mixed stock photography read as one set. Replace the source images
and the treatment still holds them together.

---

## Animation and performance notes

This build went through a real performance pass after the first version felt
heavy on scroll. What's here now, and why:

- **The marquees never change speed.** An earlier version retuned each
  marquee's `animation-duration` from scroll velocity on every scroll frame.
  Rewriting a *running* CSS animation's duration restarts it in some engines
  — that was the visible "speed glitch" — and it forced a style recalc on
  every single scroll tick. The marquee is now one constant-speed CSS
  animation with nothing touching it from JS.
- **"Who we serve" is a plain CSS grid, not a pinned scroll-hijack.** The
  previous version pinned the section and scrubbed a horizontal track, which
  meant a card was frequently caught mid-scroll and never sat fully in frame.
  It's a responsive grid now (`services.html#industries`) — every card is
  always fully visible, and it costs nothing on scroll.
- **Backgrounds are two small files, no bundler.** `assets/js/bg-fx.js` is
  plain Canvas2D: a drifting shard field (`[data-bg="shards"]`, every page
  hero) and a node network used only inside the curtain preloader.
  `assets/js/bg-lines.js` is real WebGL — it `import`s `ogl` straight from
  jsDelivr as an ES module (`<script type="module">`, no npm install, no
  bundler) and runs a warped line-field shader on `[data-bg="bends"]` (the
  promise band and every CTA). Every one of these is paused, not destroyed,
  by an `IntersectionObserver` when its section scrolls out of view, and
  resumed with a fresh `requestAnimationFrame` loop when it scrolls back — a
  canvas or GL context that got torn down once and never rebuilt was why
  backgrounds used to stay dead after scrolling away and back.
  `prefers-reduced-motion` skips all of it outright. Behind it all still
  sits the animated CSS gradient (`.hero__bg`) as the base layer so there is
  always something on screen before canvas/WebGL boots.
- **No permanent `will-change`.** Every photo, every button and every split
  headline word used to carry `will-change: transform` at rest — on a page
  with 40+ words in a headline, that's 40+ compositor layers alive for the
  life of the page for a one-time reveal. `will-change` is now applied only
  while a hover transform is actually running.
- **Reveals do not depend on GSAP.** They run on IntersectionObserver with
  CSS transitions, so if a CDN is blocked or slow the page still shows all
  content. There is also a 4-second failsafe that strips the pre-hide
  styles.
- `prefers-reduced-motion: reduce` disables the marquee, the curtain, and the
  counters, and shows all content immediately.
- The custom cursor only initialises on fine pointers.

To change a sketch's colours, edit the `data-bg-shard` / `data-bg-accent`
(shard field, `rgb` triplet, no `#`) or `data-bg-colors` (colour bends,
`|`-separated `rgb` triplets) attributes on the `[data-bg]` host element.
`services.html`'s page hero deliberately carries no canvas — it's a light
section, and the shard/glow palette is tuned for dark backgrounds only.

### Why the shard field is a Canvas2D port but the line field is real WebGL

Both started as React components. `LineWaves` is built on `ogl`, a real
(non-React) WebGL library published on npm — so `bg-lines.js` imports it
directly from jsDelivr (`ogl@1.0.11/+esm`) as an ES module and runs its
actual GLSL shader, unmodified apart from dropping its unused light-mode
branch. No React, no bundler, just one `<script type="module">` tag.

`AeroShards` is built on `vgpu`, a WebGPU library that isn't published
anywhere a `<script>` tag (or an ES-module import) can reach — not on
npm, jsDelivr, unpkg or cdnjs. Short of vendoring its source into this
repo, it can't be loaded here, so `bg-fx.js` carries a Canvas2D
reimplementation instead (shard drift + pointer repel), tuned to the same
palette and motion rather than a byte-for-byte port.

---

## Design tokens

Defined at the top of `assets/css/main.css`.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#17120F` | Warm near-black, dark sections |
| `--bone` | `#F8F2E9` | Paper background |
| `--bone-2` | `#F1E7D9` | Tinted section background |
| `--clay` | `#C2512B` | Primary accent, buttons, rules |
| `--ember` | `#E2793C` | Accent on dark, italic display words |
| `--amber` | `#EDB04A` | Tertiary accent, list markers on dark |

Type: Inter Tight (UI and headings), Instrument Serif italic (accent words),
IBM Plex Mono (labels and small caps). All from Google Fonts with `display=swap`.

---

## Accessibility

Skip link, visible focus rings, `aria-expanded` on the menu and the role
accordion, `role="status"` on the form message, alt text on every content image,
decorative images with empty alt, and a text contrast pass on both themes.
Keyboard escape closes the mobile drawer.
