# Magic E – Project Instructions

## Overview
Magic E is a React + Vite web application designed for Israeli high school students (ages 15–18) preparing for the English Bagrut Module E vocabulary exam.

The app uses spaced repetition to help students master vocabulary through daily practice.

The product should feel like a polished EdTech application, not a generic admin dashboard.

---

## Tech Stack
- React
- Vite
- Tailwind CSS
- Framer Motion
- Lucide icons
- LocalStorage persistence
- RTL layout (Hebrew-first UI)

---

## Core Files
App.jsx – session orchestration  
Flashcard.jsx – main study interface  
Dashboard.jsx – home screen / progress dashboard  
SessionComplete.jsx – end-of-session overlay  

Utils:
- srs.js – spaced repetition logic
- dailyStats.js – daily stats and streaks
- storage.js – local storage persistence

---

## UI/UX Design Principles
- Mobile-first
- RTL-first
- Clear hierarchy
- Minimal clutter
- Friendly but not childish

Target audience: teenagers (15–18)

The interface should feel:
- motivating
- modern
- slightly playful
- polished like a real learning product

Avoid:
- overly flat generic dashboards
- bright Duolingo-style green
- childish cartoon mascots

---

## Color Direction
Preferred palette:

Indigo / Deep Blue  
Muted Purple  
Warm Amber / Gold accents  

Soft off-white backgrounds.

---

## Dashboard Concept
The dashboard should communicate progress clearly.

Important elements:
- Daily study goal
- Accuracy statistics
- Learning streak
- Progress toward the total vocabulary goal

Progress visualization should use **chunks of 10 words**, not individual words.

Example concept:
Vocabulary Map / Spellbook Progress.

---

## Magic E Theme
The app theme is “academic magic”.

Allowed elements:
- subtle sparkles
- wizard hat icon
- wand icon
- magical progress concept

Avoid making it childish or cartoonish.

---

## Design References
When designing UI components, prefer styles inspired by:

- shadcn/ui
- Tailwind application UI patterns
- modern EdTech dashboards

RTL example reference:
https://ui.shadcn.com/examples/rtl

---

## Working Style
Before making major UI changes:
1. Explain the plan briefly
2. Modify only the necessary files
3. Keep logic stable unless explicitly requested