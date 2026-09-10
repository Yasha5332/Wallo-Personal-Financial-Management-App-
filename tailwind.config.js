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
        base: "#F7F8FC",
        surface: "#FFFFFF",
        "surface-alt": "#F1F3F7",
        ink: "#151A2D",
        "ink-muted": "#667085",
        border: "#E4E7EC",
        primary: {
          DEFAULT: "#16202A",
          pressed: "#0E151C",
          light: "#EAEFF2",
        },
        secondary: {
          DEFAULT: "#FF6B4A",
          pressed: "#E85533",
          light: "#FFF1ED",
          dark: "#C84222",
        },
        accent: {
          DEFAULT: "#FF6B4A",
          light: "#FFF1ED",
          dark: "#C84222",
        },
        income: "#12B76A",
        expense: "#F04438",
        warning: "#F79009",
        danger: "#D92D20",
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
