---
title: "Glyph lab"
subtitle: "Turning a brand system into a generative 3D background"
description: "How I turned my Taos icons and design tokens into a 3D background engine, and built a lab to tune it, where every setting I like becomes a theme the site ships."
icon: "spiral"
hero: "/site/techniques/glyph-lab.webp"
order: 1
draft: true
---

The background behind this site isn’t a video or a stock shader. It’s my own brand system, the Taos icons, colors and tokens, turned into 3D objects that a small engine arranges, lights and animates. I built a lab to tune it, and the presets it produces are the themes the site ships.

## One source for the page and the scene

Everything starts in a single design-tokens file: the Taos palette in light and dark, plus type, spacing and motion. A build step turns it into CSS variables for the pages and a TypeScript module for the scene, so a color change lands in both at once. The icons are the same SVGs the site uses inline; the engine extrudes them into chunky tokens with flat, illustrated shading, a top, a left and a right face, each from the palette.

## A small engine with one job

The engine is plain TypeScript and Three.js, with no framework inside. You hand it a canvas and a preset, and it builds the scene. It has four families of shapes:
- **Glyphs:** the icons, tumbling
- **Pueblo:** stepped adobe blocks
- **Ridgeline:** layered ridges in slow parallax
- **Petal:** soft gradient forms

It’s built to be polite. It never blocks the page from reading, caps the pixel density, pauses when the tab is hidden, and holds still when a visitor asks for less motion, or turns it off in Display settings.

## The lab: where settings become themes

The lab puts the real card over the live scene, with a panel of controls:
- the shape family and the layout (scattered, grid or checkerboard)
- count, size, extrusion depth, tumble, light angle, tilt and speed
- 15 palettes, light and dark, and any face color you want to swap

**Snapshot** saves a PNG for decks and social posts. **Copy preset** copies the settings as JSON, and that’s the point: a concept I like in the lab and a theme the site ships are the same thing. There’s no handoff and no redraw.

## How I built it

I built it hands-on, pairing with a coding agent. I set the direction, art-directed every family in the lab, and reviewed each change; the agent handled the plumbing. It’s the same way I work on design systems now: the system is the source, and the tools make it fast to try things against the real thing.

The lab is a tuning tool rather than a polished product, but you’re welcome to [play with it](https://links.andydetskas.com/lab/).
