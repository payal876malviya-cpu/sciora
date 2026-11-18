# Sciora — premium science learning website

A complete, responsive, dependency-free website for a Physics / Chemistry / Biology learning
platform. Plain HTML, CSS and JavaScript — no build step, no frameworks, ready for GitHub Pages.

## Project structure

```
sciora/
├── index.html                                  # Homepage (opens first)
├── study.html                                  # Study dashboard: class -> subject -> chapters
├── physics-chapter-1.html                      # Class 11 Physics Ch.1 lesson
├── SCI0RA_Physics_Chapter_1_Visual_Lab.html    # Ch.1 Visual Lab
├── Class_11_Physics_Ch1_Visual_Animated.html   # Ch.1 animated visual lesson
├── Class_11_Physics_Ch1_Teaching_Deck.html     # Ch.1 48-slide deck
├── vernier-caliper-3d.html                     # Interactive 3D vernier caliper
├── style.css                                   # Homepage styles
├── main.js                                     # Homepage scripts
├── README.md
└── .nojekyll
```

All paths are relative and flat, so the site works from the repository root, a `/repo-name/`
project URL, and `file://`. File names are case-sensitive on GitHub Pages.

## Deploying to GitHub Pages

1. Put all files in the repository root.
2. Repo → **Settings** → **Pages**.
3. Under *Build and deployment*, set Source to **Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)` → **Save**.
5. Wait a minute; the site appears at `https://<your-username>.github.io/<repo-name>/`.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly in a browser also works, as long as `css/` and `js/` sit next to it.

## If the page ever looks like plain unstyled HTML

The HTML is fine — the stylesheet did not load. Check, in this order:

1. `css/style.css` exists, spelled exactly that way, inside a folder named `css`.
2. `index.html` is in the same folder as `css/` and `js/` (not one level above or below).
3. The repo contains the `css` folder — uploading only `index.html` through GitHub's web
   interface is the usual cause.
4. Hard-refresh the browser (Ctrl/Cmd + Shift + R) to drop a cached copy.

## Design notes

- **Theming** — light and dark themes driven by CSS custom properties on `<html data-theme>`.
  The choice is saved in `localStorage` and defaults to the OS preference.
- **Typography** — Sora for display, Inter for body, loaded from Google Fonts with system
  fallbacks, so the layout still looks right if the font CDN is blocked.
- **Colour** — cyan / violet / emerald accents on deep navy (dark) or near-white (light).
- **Motion** — staggered scroll reveals, CSS keyframes for the atom, floating cards, background
  orbs and progress bars. All of it respects `prefers-reduced-motion`.
- **Responsive** — breakpoints at 1024px, 860px (mobile nav), 620px and 380px, plus a compact
  landscape-phone layout; CSS Grid with `clamp()` fluid sizing throughout.
- **Resilient by design** — reveals and counters are backed by a scroll sweep, so nothing stays
  invisible if the page is jumped or scrolled fast, and the numbers live in the markup so they
  read correctly even with JavaScript disabled.

## Customising

| What | Where |
| --- | --- |
| Colours, radii, fonts, spacing | `:root` block at the top of `css/style.css` |
| Copy and section content | `index.html` |
| Subject accent colours | Inline `--accent` / `--accent-soft` on each `.subject-card` |
| Brand name | `.brand__text` in the header and footer, plus `<title>` |

## Contact form

The form validates on the client (name, email format, subject, message length) and shows a
success message, but it does not send anywhere yet. To make it live, replace the marked block
in `initForm()` inside `js/main.js` with a `fetch()` to your endpoint — Formspree, Netlify
Forms or your own API.

## Placeholder details to replace before launch

- `hello@sciora.example` and `+91 11 4000 1234` in the contact section
- The footer social links currently point to `#contact`
- The stats (12,400 students, 480 lessons, 4.9 rating) are sample figures

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). The stylesheet uses `color-mix()`,
`backdrop-filter` and `IntersectionObserver`; older browsers fall back to solid colours without
blur, and the page stays fully readable.

## License

MIT — use it, change it, ship it.
