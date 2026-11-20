# Advocacy Project

My essay "AI-Assisted Work Can Still Be Creative", printed on the sides of the box from Pandora's Box. Each side holds one section, and the last side holds the sources.

- **Arrows** at the sides (or the arrow keys) turn the box to the next or previous section.
- **Drag** the box to turn it any way. Let go and it settles on the nearest side.
- **Tap** the box to read the side facing you, set flat in the middle of the screen.

## Files

| File | What it is |
| --- | --- |
| `essay.txt` | The essay, word for word. The page reads it as it is: a short line with no closing punctuation starts a new section. |
| `sources.js` | The sources, one string each, shown on the Sources side. |
| `essay.js` | The box (Three.js, from a CDN), the reader, and the controls. |
| `essay.css` | The page: the portfolio's sky, the game's paper and ink. |

## Run it locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. It needs a server, because the page fetches `essay.txt`.
