# Motion Frameworks and Platforms

Use for React motion libraries, native app guidance, React Native, Lottie, Rive, SVG, Canvas, WebGL, and video.

## Contents

- React and motion libraries
  - Framer Motion / Motion for React
  - GSAP
  - React Spring / springs
- Native app guidance
  - iOS / iPadOS / macOS / watchOS / visionOS
  - Android / Jetpack Compose
  - React Native
- Lottie, Rive, SVG, Canvas, WebGL, and video

## React and motion libraries

Use the projectâ€™s existing motion library when present. Do not add a large animation library for one microinteraction.

### Framer Motion / Motion for React

Good defaults:

```jsx
import { MotionConfig, motion, useReducedMotion } from 'motion/react';

export function AppMotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function DialogPanel(props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      {...props}
    />
  );
}
```

Rules:

- Use variants for repeated states.
- Use `AnimatePresence` only where exit animation helps comprehension.
- Use `layout`/shared layout for object constancy, but test layout animation performance.
- Use `MotionConfig reducedMotion="user"` or equivalent reduced-motion handling.
- Avoid animating large trees on every render.

### GSAP

Use GSAP when timelines, sequencing, scroll animation, SVG morphing, or complex imperative control are required and the project already accepts GSAP.

Rules:

- Scope animations to component lifecycle.
- Clean up contexts/timelines on unmount.
- Use `gsap.matchMedia()` or native `matchMedia()` for breakpoints and reduced motion.
- Avoid ScrollTrigger for standard content reveals unless it adds clear value.

### React Spring / springs

Use springs for gesture release, physics-like movement, drag, reorder, and shared element settling. Avoid springs for everything; many UI state changes are clearer with deterministic duration/easing.

Spring guidance:

- Higher damping for productivity UI.
- Lower bounce for repeated interactions.
- No elastic motion in critical, dense, or high-frequency workflows.
- Respect reduced motion by removing positional travel or setting immediate transitions.

## Native app guidance

Use platform-native animation primitives first. Respect platform conventions and accessibility settings.

### iOS / iPadOS / macOS / watchOS / visionOS

- Respect Reduce Motion.
- Avoid gratuitous or frequent custom motion; standard components already include expected motion.
- Replace depth, parallax, zoom, scale, spin, and multi-axis motion with fades, highlights, color shifts, or shorter transitions when Reduce Motion is enabled.
- Do not remove motion that conveys essential state; replace it with a calmer cue.

SwiftUI pattern:

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

withAnimation(reduceMotion ? .linear(duration: 0.01) : .easeOut(duration: 0.20)) {
    isOpen = true
}
```

### Android / Jetpack Compose

- Respect the system animator duration scale and accessibility animation preferences where available.
- Use Material motion and platform conventions unless the product has a stronger documented motion system.
- Keep gesture-driven motion tied to finger movement; use easing/spring after release.
- Avoid large screen zoom, parallax, and spinning loaders for reduced-motion users.

### React Native

- Prefer Reanimated or native-driven animations for gesture-heavy UI.
- Query reduced motion using the projectâ€™s accessibility utilities, such as Reanimatedâ€™s `useReducedMotion()` or React Native accessibility APIs.
- Avoid JS-thread animation for interactions that must remain smooth under load.

## Lottie, Rive, SVG, Canvas, WebGL, and video

Use these for rich illustration, brand moments, education, empty states, hero areas, and noncritical delight. Do not use them to replace core UI feedback unless they are reliable, fast, accessible, and have a reduced/static fallback.

Rules:

- Provide a static fallback poster or final state.
- Do not autoplay large animations near forms, reading areas, or dense task surfaces.
- Pause or stop when offscreen.
- Avoid indefinite loops unless clearly decorative and pausable or very subtle.
- Keep file size small; remove hidden layers and unused assets.
- Prefer vector transforms/opacity over filters, blur, and dense shape morphing.
- Do not make important information available only inside an animation.
- For reduced motion, show a static state, one short fade, or a still illustration.

