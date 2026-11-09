---
title: "Haptic patterns"
subtitle: "Quick ways and custom ways to design with haptic patterns"
description: "How to bring haptics into your designs: stock patterns on iOS, Android and the web, how to demo them to engineers, and how to author your own."
icon: "haptics"
hero: "/site/techniques/haptics.webp"
order: 6
---

I love when apps utilize haptics in their UX. Whether it’s just a simple bit of feedback when you tap a button or move a slider, or it’s an extension of the brand using a custom haptic pattern on a load or demo screen. These little flourishes invoke a sense of deep intention and quality in an app where no detail is left unaddressed.

We don't see haptics discussed nearly enough for my taste; I find them to be an underutilized pattern in product design because tools like Figma don't enable designers to mock or prototype haptic patterns. I've found that haptics are underutilized but, for the most part, are easy to demonstrate to engineers and get implemented into a project.

To help you make haptics happen on your project, I’m going to go over stock haptic patterns in iOS (with resources for Android and Web), how to demonstrate those stock haptics to engineers so it’s easy to understand what you want, and how to easily create your own haptic patterns in cases where you have the space for it.

If you're working with other platforms, here are some helpful resources:

- [Android haptics documentation](https://developer.android.com/develop/ui/views/haptics)
- [Web Vibration API documentation](https://www.w3.org/TR/vibration/)

## Stock haptics on iOS, Android and web

Apple has provided us a great reference point for best practices and usage guidelines for haptics [in the Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/playing-haptics), which I highly recommend familiarizing with before getting started.

In the above guidelines, Apple goes over commonplace stock haptics: impact, notification, selection. These patterns are a great starting point for getting into haptics and can cover a wide variety of use cases (just like a stock HIG toggle). If you’re seeking a quick way to add a little flair to your designs and make them feel more native, I recommend showing which one from the guide you want to implement and show it to your engineering partner. This is a great way to enter the waters without going too complex.

## Going more custom, and intentional

Now that you have successfully worked with your engineering partner to implement a stock haptic, now it’s time for a more custom approach. While Android is the only OS that offers an app dedicated to exploring haptics, its not hard to demonstrate them for iOS.

[**Play**](https://createwithplay.com/) is a prototyping tool that happens to be great at haptics too. To get up and running, download the desktop and iOS apps and on the desktop app, look in Templates for the Haptics project. Take some time to familiarize yourself with how to pair up the desktop and mobile app, but once you do, what does the Haptics project show you? You betcha, it's all the stock iOS haptics presented as handy buttons where you can feel these haptics firsthand (no pun intended). This is another great way to demo haptics for your engineering partners. To get the full gist of how haptics are setup in Play, this [quick video](https://www.youtube.com/watch?v=CltNyJuWFeM) will get you going with everything you need to know.

<figure>
  <img src="/site/techniques/making-haptics-happen/play.webp" width="1600" height="702" alt="Play, the prototyping tool: a rendered prototype demoing stock haptic patterns, with how a haptic is applied to a button through context menus behind it" loading="lazy" decoding="async" />
</figure>

Stock iOS haptic patterns are all well and good, but what if I wanted to design my own haptic pattern? Enter [**Haptic Labs Studio**](https://www.hapticlabs.io/).  Haptic Labs Studio is an authoring tool for completely custom patterns. What’s more, is the UI Playground in the mobile app is another quick way to demo not only basic haptics, but an array of custom haptics showing the amazing depth with which you can design in the haptic medium.

<figure>
  <img src="/site/techniques/making-haptics-happen/haptic-labs-playground.webp" width="1600" height="702" alt="Haptic Labs Studio’s UI Playground and Sample Library, for demoing stock and custom haptic patterns" loading="lazy" decoding="async" />
</figure>

With Haptic Labs Studio, I was able to quickly create a custom haptic that feels like an idling moped engine. If you’ve ever edited video or authored music in a software app, the feel of “drawing” a haptic pattern is much the same. The app utilizes a timeline based canvas where different high level patterns can be added (pulse, vibrate, pause, and even audio) and then customized through variables like intensity, duration and a ton more. Added bonus — the patterns you generate in Haptic Labs Studio can be exported as .ahap files (with the right plan) and imported into Play for demonstrations and prototyping.

<figure>
  <img src="/site/techniques/making-haptics-happen/haptic-labs-studio.webp" width="1600" height="702" alt="Haptic Labs Studio’s timeline editor with a custom pattern that feels like an idling moped engine" loading="lazy" decoding="async" />
</figure>

## Time to make haptics happen

Now that you’ve gotten a feel for how to quickly demo basic patterns as well as generate your own, it’s time to start building those relationships with your eng partners to get haptics into your next project. We all know time is tight for projects and complexity is managed very actively, but pick a project and a UI element you think could benefit from haptics. In your next design review, bring up the topic of a basic haptic pattern being added to a key interaction to really drive it home or bring that additional bit of quality and polish. Looking for something more daring? What about adding a basic (or custom) haptic to a design system element so that wherever it shows up, there’s always a haptic response for the user.

I hope you found this overview helpful. There are a ton of ways to do haptics out there, but these were some quick and dirty ways to get up and running. I hope they lower the bar for experimentation and raise the bar for nuanced, deepened interactions in your designs. Happy Designing!
