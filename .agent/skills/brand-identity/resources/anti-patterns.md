# Avoid Doing This

## Design

❌ Flash Over Function
- No animations that block user action
- No transitions longer than 300ms for interactions
- No auto-playing videos with sound
- No infinite scroll without pagination option

❌ Low Contrast Crimes
- No light grey (#CCC) on white backgrounds
- No pure white text on pure black (too harsh)
- Ensure WCAG AA minimum (4.5:1 for text)
- Test with color blindness simulators

❌ Over-Cluttered Chaos
- No more than 3 primary colors
- No more than 2 font families
- No more than 5 font sizes in a single view
- No inconsistent spacing (use 8px grid system)

❌ Mystery Meat Navigation
- Icons must have labels or tooltips
- No hamburger menus on desktop
- No hidden navigation without clear affordance
- No "clever" navigation that confuses users

❌ Mobile Hostility
- No tiny tap targets (minimum 44x44px)
- No horizontal scrolling (unless intentional carousel)
- No hover-dependent interactions on touch
- No fixed elements that cover content

❌ Performance Sins
- No unoptimized images (use WebP, lazy loading)
- No render-blocking resources
- No layout shifts (CLS > 0.1)
- No heavy animations on page load

## UX

❌ Form Frustrations
- No labels inside inputs (accessibility issue)
- No "clear all" without confirmation
- No validation only on submit
- No disabled submit buttons (show errors instead)

❌ Content Crimes
- No walls of text without hierarchy
- No auto-playing carousels (users miss content)
- No "click here" links (not descriptive)
- No Lorem Ipsum in production

❌ Accessibility Failures
- No keyboard navigation traps
- No missing alt text on images
- No color-only information conveyance
- No auto-focus on page load (except search)
