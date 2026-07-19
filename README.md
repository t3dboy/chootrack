# ChooTrack — marketing site

The "Coming Soon" marketing site for **ChooTrack**, the UK rail app that lets you
rewind the departure board into the past to catch a train you've already missed —
or guess which train you're on from your location and track it live.

**Coming to the iOS App Store · Q3 2026.**

## About the site

- Static, zero build step, zero runtime dependencies — plain HTML, CSS and JS.
- All product screens are real screenshots captured from the app.
- Hosted on GitHub Pages.

## Running locally

Any static file server works, e.g.:

```sh
python3 -m http.server 8899
```

Then open <http://localhost:8899/>.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | The page |
| `style.css` | Neo-brutalist / split-flap styling, responsive |
| `main.js` | Split-flap headline, scroll reveals, theme switcher, board wall |
| `shots/` | Real app screenshots (board live & rewound, guess my train, detail, track, themes) |
| `icon.png` | App icon / favicon |

© Ted Roubour. ChooTrack is an independent app and is not affiliated with National
Rail or any train operating company.
