# Motion Accessibility Rules

Use for reduced motion, non-motion alternatives, pause/stop/hide controls, seizure/discomfort triggers, and focus order.

## Accessibility rules

### Reduced motion is mandatory

Support `prefers-reduced-motion` on the web and the equivalent platform setting in native apps.

When reduced motion is requested, reduce or remove:

- Parallax.
- Zooming.
- Spinning.
- Large scaling.
- Full-screen slides.
- Multi-axis movement.
- Multi-speed/background motion.
- Animated blur/depth-of-field.
- Auto-advancing carousels.
- Ambient loops.
- Scroll-triggered reveals that are not essential.

Replace with:

- Instant state changes.
- Short opacity fade.
- Highlight fade.
- Color or border change.
- Static illustration.
- Text/status message.
- User-controlled motion only.

Do not remove essential information. If motion communicates status or hierarchy, provide a calmer equivalent.

### Do not rely on motion alone

Any state communicated by motion must also be available through static visual state, text, semantics, or programmatic status.

Examples:

- Loading button should include disabled/pending state and accessible label.
- Error should include text and `aria-describedby`, not just a shake.
- Success should include a visible status, not only a checkmark animation.
- Reordered items should update DOM order and screen-reader meaning.

### Provide pause/stop/hide controls

Any automatic moving, blinking, scrolling, or auto-updating content that lasts more than a short moment and appears alongside other content needs user control unless the motion is essential.

Controls must be keyboard reachable and labeled.

### Avoid seizure and discomfort triggers

Avoid flashing, rapid contrast changes, repeating shake, high-speed zoom, vortex/spin, strong parallax, and large peripheral motion. Be especially careful with background video, hero animations, confetti, animated gradients, and scroll-bound movement.

### Maintain focus and reading order

Animation must not move keyboard focus unpredictably. It must not hide focused content, trap focus outside dialogs, or visually reorder content while DOM/screen-reader order stays different.

