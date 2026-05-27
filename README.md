# English Vocabulary Learning App

A React web application for learning English vocabulary, designed for Israeli high school students preparing for the Bagrut Model E exam.

## Features

- **Flashcard Learning Flow**: Interactive flashcards with smooth flip animations
- **RTL Support**: Full right-to-left support for Hebrew text
- **Mobile-First Design**: Optimized for mobile devices
- **Text-to-Speech**: Audio pronunciation for example sentences
- **Progress Tracking**: Track exposure levels and learning progress

## Tech Stack

- **React** (Vite)
- **Tailwind CSS** - Styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
  ├── components/
  │   └── Flashcard.jsx    # Main flashcard component
  ├── data/
  │   └── vocabulary.js    # Dummy vocabulary data
  ├── App.jsx              # Main app component
  ├── App.css              # App-specific styles
  ├── index.css            # Global styles with Tailwind
  └── main.jsx             # Entry point
```

## Features Implementation

### Flashcard Component

- **Front Side**: Displays the English word, part of speech, and tags
- **Back Side**: Shows definition, example sentence with TTS support
- **Flip Animation**: Smooth 3D flip using Framer Motion
- **Action Buttons**: "קל" (Easy) and "קשה" (Hard) buttons for user feedback

### Vocabulary Data

Currently uses dummy data based on PRD examples:
- recover
- intend
- accomplish
- achieve
- consider

## Next Steps

- Implement exposure tracking (1-10 exposures per word)
- Add different exposure levels (1-3, 4-6, 7-9, 10)
- Implement word difficulty levels (Starter/Core/Challenge)
- Add user progress persistence
- Implement daily learning plans
