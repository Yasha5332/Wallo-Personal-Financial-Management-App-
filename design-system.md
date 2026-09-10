# Finance App — Design System

## 0. Concept

Most finance apps default to one of two looks: a sterile corporate-bank blue, or a neon-green "growth hacker" fintech look. Neither fits a product that has to feel approachable to a student logging their first coffee expense **and** credible to an employee tracking a salary.

The direction here: **a calm ledger, not a bank counter.** Muted, slightly cool paper background; one confident ink-teal as the anchor color (trust, calm — not "corporate blue #0057FF"); a warm amber used sparingly, like a highlighter pen on a notebook, for the one thing that needs attention. Flat by default — shadows are earned, not decorative.

This keeps it credible for a working adult while still feeling human enough for a 19-year-old tracking allowance money.

---

## 1. Color System

### Core palette (light mode)

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#F3F5F4` | Screen background — cool off-white, not cream |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `surface-alt` | `#EAEDEA` | Subtle section separation, disabled fields |
| `ink` | `#1C1F1D` | Primary text — near-black with a faint green undertone |
| `ink-muted` | `#6B7370` | Secondary text, timestamps, placeholders |
| `border` | `#E2E4DF` | Dividers, input borders |
| `primary` | `#1E3D3C` | Deep ink-teal — primary buttons, active nav, links, brand |
| `primary-pressed` | `#14302F` | Primary button pressed state |
| `accent` | `#E3A335` | Highlighter amber — used sparingly: active goal ring, one key highlight per screen |

### Semantic (money-specific)

| Token | Hex | Usage |
|---|---|---|
| `income` | `#2F8F6B` | Positive amounts, income entries, "under budget" |
| `expense` | `#E2604F` | Negative amounts, expense entries, "over budget" |
| `warning` | `#EFB84B` | Budget at 80–99%, upcoming bill due soon |
| `danger` | `#C4432F` | Budget exceeded, failed action, delete confirmation |

### Category tag colors (for expense categories — use at 15% opacity as a chip background, full opacity for the icon)

`#4A7A8C` (transport · slate blue) · `#8C6A4A` (food · warm brown) · `#6A7A4A` (groceries · olive) · `#8C4A6E` (entertainment · plum) · `#4A6E8C` (bills/utilities · steel blue) · `#7A6A8C` (education/books · muted violet)

### Dark mode (v2, keep these tokens ready even if you ship light-only first)

| Token | Hex |
|---|---|
| `bg-base` | `#14181A` |
| `surface` | `#1D2422` |
| `ink` | `#F3F5F4` |
| `ink-muted` | `#8A928E` |
| `border` | `#2A322F` |

Keep `primary`, `income`, `expense`, `accent` the same hexes in dark mode — don't re-tint them, just let the neutrals shift. This is what makes a dark mode feel considered instead of auto-inverted.

**Rule of restraint:** `accent` (amber) appears once per screen, max. It marks the one thing you want a thumb to land on — a goal progress ring, the "add" FAB, a single callout. If it starts appearing on multiple elements per screen, that's a sign something else should carry the emphasis instead.

---

## 2. Typography

**Display/Headings:** Sora (600 SemiBold, 700 Bold)  
**Body/Data:** Inter (400 Regular, 500 Medium, 600 SemiBold)  

Why this pair: Sora has enough personality to give screens character without being decorative; Inter is one of the most legible faces at small sizes, which matters when a transaction list is mostly numbers.

| Level | Font + Weight | Size / LineHeight | Where used |
|---|---|---|---|
| Balance Display | Sora Bold | 36 / 40 | The big number on the dashboard |
| H1 | Sora SemiBold | 24 / 30 | Screen titles |
| H2 | Sora SemiBold | 18 / 24 | Section headers ("This month", "Shared with roommates") |
| Body | Inter Regular | 15 / 22 | Form inputs, descriptions |
| Subtext | Inter Regular | 13 / 18 | Micro-copy, captions |
| Micro / Overline | Inter Medium, uppercase | 11 / 14 | Badges, card category tags |
| Amount (large) | Sora Bold, tabular-nums | 28 / 32 | Budget remaining, goal progress numbers |
| Amount (list) | Inter SemiBold, tabular-nums | 15 / 20 | In transaction lists |

```typescript
// app/_layout.tsx
import { useFonts, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const [fontsLoaded] = useFonts({
  Sora_600SemiBold,
  Sora_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
});
```

For tabular numerals on Inter in React Native, apply `fontVariant: ['tabular-nums']` on any `<Text>` showing a currency amount.

---

## 3. Spacing & Layout

4pt base grid: `4, 8, 12, 16, 24, 32, 40, 48`

- Screen horizontal padding: `16`
- Space between unrelated sections: `24`
- Space between a label and its value: `4`
- Card internal padding: `16`
- List row height: `56` minimum (comfortable tap target for the whole row)

---

## 4. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8 | Chips, small tags |
| `radius-md` | 12 | Buttons, inputs |
| `radius-lg` | 16 | Cards |
| `radius-pill` | 999 | Category icon circles, filter pills |

**Elevation is flat by default.** Regular cards use `surface` color + a 1px `border`, not a shadow — this avoids the generic "every card has the same soft grey shadow" look. Reserve real shadow for things that float above content: the "Add transaction" FAB, bottom sheets, and modals.

```
shadow-floating: offset (0, 4), blur 12, color rgba(28,31,29,0.12)
```

---

## 5. Iconography

Outline-style icons, consistent 1.5px stroke weight — **Lucide** or **Phosphor** icon sets both work well with Expo (`lucide-react-native` or `phosphor-react-native`). Category icons sit in a `radius-pill` circle filled with that category's color at 15% opacity, icon at full color.

---

## 6. Core Components

**Primary button** — `primary` bg, white text, `radius-md`, height 52, label Inter SemiBold 16. Pressed state → `primary-pressed`.

**Secondary button** — transparent bg, 1.5px `primary` border, `primary` text.

**Destructive button/action** — `danger` text or bg, used only for delete/remove-member type actions.

**Input field** — `surface` bg, 1px `border`, `radius-md`, height 48, padding-horizontal 12. Focus state: border becomes `primary` at 2px.

**Transaction list row** — category icon (pill, 40×40) on the left; title (Body, `ink`) + subtitle/date (Label, `ink-muted`) stacked; amount right-aligned, tabular-nums, `income` green with `+` prefix or `expense` coral with `−` prefix.

**Budget progress bar** — track `surface-alt`, height 8, `radius-pill`. Fill color: `income` green under 80%, `warning` amber 80–99%, `danger` coral at/over 100%.

**Bottom tab bar** — 5 destinations max, icon + label, active = `primary` icon and label, inactive = `ink-muted`. No badges-as-default; only show a badge dot for something actionable (e.g., a pending settle-up request).

**Chip/pill** (category filter, group member) — `radius-pill`, `surface-alt` bg, `ink` text, 8px horizontal padding.

---

## 7. Motion

Keep it to moments that answer a user action, not decorative entrances:
- Adding a transaction: the new row slides in and the balance number ticks to its new value (150–200ms).
- Budget bar crossing a threshold (e.g., into `warning`): a brief color cross-fade, not a bounce.
- Avoid staggered fade-ins on list load — lists should just be there.

---

## 8. Nativewind / Tailwind config

Since the stack uses Nativewind, extend `tailwind.config.js` with these tokens so you use `bg-primary`, `text-ink`, `rounded-lg`, etc. directly instead of hardcoding hex values in components:

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F3F5F4',
        surface: '#FFFFFF',
        'surface-alt': '#EAEDEA',
        ink: '#1C1F1D',
        'ink-muted': '#6B7370',
        border: '#E2E4DF',
        primary: { DEFAULT: '#1E3D3C', pressed: '#14302F' },
        accent: '#E3A335',
        income: '#2F8F6B',
        expense: '#E2604F',
        warning: '#EFB84B',
        danger: '#C4432F',
      },
      fontFamily: {
        display: ['Sora_600SemiBold'],
        'display-bold': ['Sora_700Bold'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
```

---

## 9. Previewing the UI — recommended workflow

**Expo Go is the right choice for this stage.** Run `npx expo start`, scan the QR code with the Expo Go app on your phone (or press `a`/`i` for an emulator), and you get hot reload on save — perfect for iterating on pure UI/Nativewind screens like these.

One thing to plan for: Expo Go only supports the Expo SDK's built-in native modules. It works fine for Nativewind styling and most of Clerk's auth flows, but if you later add a native module outside the Expo SDK (some analytics/session-replay features in PostHog, certain Clerk native passkey flows, etc.), Expo Go won't load it — at that point you'd switch to a **custom development build** (`npx expo prebuild` + `eas build --profile development`) instead of Expo Go, which then installs like your own app but still hot-reloads like Expo Go does. You don't need to worry about that yet — just know it's the next step if a library ever throws a "native module not found" error in Expo Go.

For fast visual iteration on the design direction itself — before wiring anything into actual screens — a quick web mockup (like the one below) is useful to lock in colors/type/spacing, then you translate the confirmed classes into your Nativewind components.
