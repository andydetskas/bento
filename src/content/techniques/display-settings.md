---
title: "Display settings"
subtitle: "Accessibility settings without the overlay"
description: "Why this site has a Display settings panel instead of an accessibility overlay: what each setting does, the WCAG criteria behind it, and what it deliberately leaves out."
icon: "eye"
hero: "/site/techniques/display-settings.webp"
order: 2
draft: true
---

Under my links on this site there’s a row called Display settings. It lets you change text size, typeface, spacing, contrast, link and focus highlighting, motion, and the animated background. Here’s why it looks the way it does, and what it deliberately doesn’t do.

## Why not an overlay

Accessibility overlays promise to make any site compliant with one script tag. They can’t, and the FTC ordered one of the best known, accessiBe, to pay $1 million and stop claiming its widget could make any website WCAG-compliant. Many overlays also add their own screen-reader mode and keyboard shortcuts, which fight the assistive technology people already use and know.

So the bar is the site itself: semantic HTML, real contrast, visible focus, and respect for motion preferences. The panel is a courtesy on top of an accessible site, not a substitute for one.

## What each setting does

- **Text size:** Large and Larger scale the whole site, not just paragraphs. Browser zoom works too; this is a shortcut that remembers your choice.
- **Typeface:** Hyperlegible swaps in Atkinson Hyperlegible, the Braille Institute’s typeface for low vision, which makes letters like I, l and 1 easy to tell apart.
- **Text spacing:** Wide applies the spacing in WCAG 1.4.12, with roomier lines, letters and words. Big titles open up less, because wide tracking hurts large type.
- **Contrast:** High brings secondary text to full strength and firms up lines and card edges.
- **Links and focus:** Highlighted underlines every link, so color isn’t the only cue (WCAG 1.4.1), and draws a heavy outline on whatever is hovered or focused.
- **Motion:** it follows your device’s reduced-motion setting by default, and Off here stops it on this site regardless.
- **Background:** Animated, Paused or Off. The 3D background moves for longer than five seconds, so WCAG 2.2.2 asks for a way to pause it. This is that way.

## Presets are starting points

Four presets (Low vision, Dyslexia-friendly, Motion sensitive and Fewer distractions) each set a few options at once, and every option stays adjustable. Press a preset again to undo it. They’re shortcuts, not modes, and not diagnoses.

## What it leaves out on purpose

- **No screen-reader mode:** the site works with screen readers as built.
- **No single-key shortcuts:** they collide with screen readers’ own keys (WCAG 2.1.4).
- **No claims of compliance.**

It starts from your device’s settings, keeps your choices on your device, and applies them before the page draws, so nothing flashes.

## How it’s built

It’s a native dialog, so focus stays inside, Escape closes it, and focus returns to the button that opened it, all built in. Each choice is one attribute on the page’s root, styled in CSS. It’s tested with the keyboard and with axe, an automated accessibility scan.
