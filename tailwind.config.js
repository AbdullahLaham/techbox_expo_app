/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        tb: {
          navy: {
            DEFAULT: '#1B254B', // Deepest blue from logo
            dark: '#111827',   // Darker shade
            light: '#2C3E75',  // For gradients or states
          },
          gold: {
            DEFAULT: '#BF9B30', // Accurate Tech Box Gold
            light: '#EBCB6C',  // Brighter hover state
          },
          background: '#F4F7FE', // Light gray background
          muted: '#8A99B8',      // Faded text/borders
        },
      },
      fontFamily: {
        // (Optional) Define modern fonts here
        // mono: ['SFMono-Regular', 'Menlo'],
      },
    },
  },
  plugins: [],
}

