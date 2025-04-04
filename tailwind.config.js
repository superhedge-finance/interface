/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    { pattern: /(bg|w|left)-./ },
  ],
  theme: {
    extend: {
      colors: {
        blacknew: {
          '100': '#161717'
        },
        grey: {
          '80': '#494D51',
          '70': '#677079',
          '60': '#828A93',
          '50': '#A5A9AE',
          '40': '#AFB7BE',
          '30': '#D6D7D8',
          '20': '#EBEBEB',
        },
        whitenew: {
          '100': '#F8F8F8',
        },
        accent: '#11CB79',
        error: '#EB6565',
        warning: '#E89D45',
        success: '#70B877',
        indicative: '#4BA6A0',
        active: '#68AC6F',
        matured: '#E89D45',
        callSpread: '#95B221',
        putSpread: '#EB6565',
        butterFly: '#8B78CB',
        greenHover: '#11CB79',
        principalProtection: '#7991DA'
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(267.79deg, #11CB79 42.5%, #11A692 67.51%, #002366 99.18%)',
        'main-gradient': 'linear-gradient(270.15deg, #11CB79 -4.2%, #11A692 41.69%, #002366 99.8%)',
        'dark-gradient': 'linear-gradient(220.71deg, #313131 11.2%, #181818 65.61%)',
        'conic-gradient': 'conic-gradient(from 201.55deg at 80.55% 80.25%, rgba(69, 215, 216, 0.9) 0deg, rgba(146, 215, 32, 0.52) 109.21deg, rgba(69, 215, 216, 0.9) 360deg), radial-gradient(153.44% 427.43% at 107.06% -24.42%, #007C65 0%, #005B4A 17.22%, rgba(0, 58, 48, 0) 32.37%, rgba(0, 33, 27, 0) 45.46%, rgba(0, 14, 12, 0) 62.4%, rgba(0, 4, 3, 0) 80.14%, rgba(0, 0, 0, 0) 100%)',
        'diamond-gradient': 'radial-gradient(197.31% 198.01% at 47.44% -82.95%, rgba(17, 203, 121, 0.16) 0%, rgba(17, 203, 121, 0) 100%)',
        'diamond2-gradient': 'radial-gradient(189.77% 193.68% at 46.79% -80%, rgba(17, 203, 121, 0.16) 0%, rgba(17, 203, 121, 0) 100%)'
      }
    },
  },
  plugins: [],
}
