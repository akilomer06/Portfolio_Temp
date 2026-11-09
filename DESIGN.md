# Webly design system

Webly uses an editorial layout and a paper plane to connect the work from brief to launch. Keep the project screenshots prominent and give each page one clear action.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| Warm grey | `#e1e0db` | Default page surface |
| Paper | `#faf9f6` | Forms, cards, and light controls |
| Lavender | `#a48fbc` | Illustration and large accent surfaces |
| Deep violet | `#59426f` | Links, buttons, and keyboard focus |
| Ink | `#25222b` | Body and headline text |
| Muted ink | `#57515e` | Supporting text |
| Rule | `#bdb6c2` | Section borders and dividers |

Use ink or deep violet for text on warm grey. Reserve lavender for larger shapes and accents. The CMS can change the base palette, so check contrast again when changing theme settings.

## Type and layout

- Fraunces for display text and Hanken Grotesk for body copy and controls.
- Body copy starts at 16 px with about 1.5 line height. Use 20–22 px for a lead and 28–56 px for section headings. The homepage headline scales to 96 px on wide screens.
- Use 4, 8, 16, 24, 40, 64, and 96 px as spacing anchors. Use fluid page gutters and collapse columns before their text becomes crowded.
- Use border rules to separate sections. Keep project captures sharp and consistently framed. Use an accurate caption when a capture shows a particular interaction or screen.

## Components and motion

- Use the filled violet button for the primary action, the outlined version for secondary actions, and underlined links for navigation in body copy.
- Keep controls at least 44 px high. Give keyboard focus a visible violet ring and preserve browser semantics on buttons and links.
- Label fields explicitly. Use inline form status for progress, confirmation, and errors. On a connection error, keep the draft values in the form.
- The homepage paper plane is the main animated sequence. It pauses offscreen and falls back to a still frame for reduced motion and slow or data-saving connections.
- Use the folded-paper mark beside the wordmark. The square mark works as a favicon. Social previews use a consistent 1200 × 630 layout with an individual project title and capture.
