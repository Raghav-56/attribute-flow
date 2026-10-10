# Attribute Flow

An interactive study of inherited and synthesized attribute dependencies.

**[Open Attribute Flow](https://raghav-56.github.io/attribute-flow/)**

Play or step through direct legal dependencies, then trace the helper paths that carry child information into an inherited attribute and parent or sibling information into a synthesized attribute. The cycle view shows why individually legal rules can still have no topological evaluation order.

Five original GATE-style MCQs test rule placement, valid evaluation orders, helper cycles, and the limits of S-attributed and L-attributed definitions. Wrong answers receive two hints before the solution is revealed. The score records first attempts.

## Run locally

This is a static HTML, CSS and JavaScript site with no build step or external runtime dependencies.

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`.

## Files

- `index.html`: page structure, explanation and metadata.
- `style.css`: responsive layout and light/dark themes.
- `app.js`: animation, dependency scenes, quiz and browser-local progress.
- `theme.js`: theme preference.
- `favicon.svg`: site icon.
- `.nojekyll`: publishes the files directly through GitHub Pages.

Quiz progress and theme preferences are stored only in each visitor's browser. Restart quiz clears the saved quiz answers. Animation Reset clears the current animation view independently.

## Scope and sources

The proxy demonstrations use general syntax-directed definitions that permit same-node dependencies. They demonstrate legal information paths, not an equivalence between restricted S-attributed and L-attributed classes. The cycle example concerns ordinary evaluation in dependency order, with no supplied initial values or fixed-point evaluator.

Definitions and evaluation rules follow [Allan Gottlieb's NYU compiler lecture](https://cs.nyu.edu/~gottlieb/courses/2000s/2008-09-fall/compilers/lectures/lecture-08.html). The questions are original practice questions, not questions from an official GATE paper.

## Publishing

GitHub Pages publishes the root of the `main` branch. Changes become live after the Pages deployment completes.
