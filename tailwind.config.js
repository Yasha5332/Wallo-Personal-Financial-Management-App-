/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base: "#F3F5F4",
        surface: "#FFFFFF",
        "surface-alt": "#EAEDEA",
        ink: "#1C1F1D",
        "ink-muted": "#6B7370",
        border: "#E2E4DF",
        primary: {
          DEFAULT: "#1E3D3C",
          pressed: "#14302F",
          light: "#E6EFED",
        },
        secondary: {
          DEFAULT: "#E3A335",
          pressed: "#C78C25",
          light: "#FBF2DE",
          dark: "#A87317",
        },
        accent: {
          DEFAULT: "#E3A335",
          light: "#FBF2DE",
          dark: "#A87317",
        },
        income: "#2F8F6B",
        expense: "#E2604F",
        warning: "#EFB84B",
        danger: "#C4432F",
        category: {
          transport: "#3B82F6",
          food: "#F97316",
          groceries: "#22C55E",
          entertainment: "#8B5CF6",
          bills: "#14B8A6",
          education: "#EC4899",
        },
      },
      fontFamily: {
        display: ["Sora_600SemiBold", "sans-serif"],
        "display-bold": ["Sora_700Bold", "sans-serif"],
        body: ["Inter_400Regular", "sans-serif"],
        "body-medium": ["Inter_500Medium", "sans-serif"],
        "body-semibold": ["Inter_600SemiBold", "sans-serif"],
        "body-bold": ["Inter_700Bold", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
