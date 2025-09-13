/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT:'#0b0b12', 2:'#12121b', 3:'#181827' },
        primary: { DEFAULT:'#8b5cf6' },
        accent: { DEFAULT:'#ec4899' }
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { soft:'0 6px 20px rgba(0,0,0,.35)' }
    }
  },
  plugins: []
};
