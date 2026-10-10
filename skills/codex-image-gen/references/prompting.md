# Prompting

The script sends your prompt to the image tool verbatim. Write the full spec yourself.

## Order

Scene → subject → details → constraints. Put the use first so the model picks the right polish.

```text
Use: landing page hero, wide 16:9
Subject: a ceramic coffee mug on a walnut table
Style: clean product photography, shallow depth of field
Composition: mug on the right third, empty space on the left for copy
Lighting: soft morning window light
Text: none
Avoid: logos, watermark, extra objects
```

## Rules

- **Shape:** say "square", "wide 16:9", "tall 9:16 portrait", or "3:1 banner". There is no size option.
- **Exact text:** quote it and name the font style and place: `the word "BREW" in bold rounded black letters, centered`. Spell hard words letter by letter.
- **Photos:** use camera words: lens, angle, depth of field, time of day.
- **Icons and stickers:** say "flat", "single object", "plain white background" or use `--transparent`.
- **Game sprites:** say "pixel art", the bit depth, and "plain background" or `--transparent`.
- **Edits:** name what changes and what stays. `Change only the background to a sunset gradient; keep the product and its edges unchanged.` Repeat the "keep" list every time you iterate.
- **Several input images:** refer to them by order: `the fox from image 1`, `the style of image 2`.
- **Iterate:** change one thing per run and compare.
- Generic prompt: add only the details that help (framing, use, lighting). Do not add objects, brands, or text the user did not ask for.
