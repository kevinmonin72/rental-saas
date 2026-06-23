/** @type {import("tailwindcss").Config} */
module.exports = { content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], theme: { extend: { colors: { ridery: { teal: "#14b8a6", orange: "#f97316", dark: "#111827", light: "#f9fafb" } } } }, corePlugins: { preflight: false }, plugins: [], }
