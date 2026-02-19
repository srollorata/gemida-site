# Preferred Tech Stack & Implementation Rules

When generating code or UI components for this brand, you **MUST** strictly adhere to the following technology choices.

## Core Stack
* **Framework:** React (TypeScript preferred)
* **Styling Engine:** Tailwind CSS (Mandatory. Do not use plain CSS or styled-components unless explicitly asked.)
* **Component Library:** shadcn/ui (Use these primitives as the base for all new components where appropriate.)
* **Icons:** Lucide React

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` (read and reference tokens; prefer CSS variables where available).
* **Dark Mode:** Support dark mode using Tailwind's `dark:` variant modifier and the existing CSS variables declared in `app/globals.css`.

### 2. Component Patterns
* **Buttons:** Primary actions must use the solid Primary color. Secondary actions should use the 'Ghost' or 'Outline' variants from shadcn/ui.
* **Forms:** Labels must always be placed *above* input fields. Use standard Tailwind spacing (e.g., `gap-4` between form items).
* **Layout:** Use Flexbox and CSS Grid via Tailwind utilities for all layout structures.

### 3. Forbidden Patterns
* Do NOT use jQuery.
* Do NOT use Bootstrap classes.
* Do NOT create new global CSS files; prefer component-local styles using Tailwind utility classes.

## Notes / Project Reality
This project already uses Tailwind CSS and `lucide-react`. `shadcn/ui` primitives are preferred for new components, but ensure the dependency is installed before relying on it. When in doubt, follow existing project patterns in the `components/ui` folder.
