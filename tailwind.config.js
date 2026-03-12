module.exports = {
  mode: 'jit',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'google-sans': ['Open Sans', 'sans-serif'],
        'hind-font': ['Hind', 'sans-serif'],
        'font-robot': ['Roboto', 'sans-serif'],
        'robot-condensed': ['Roboto Condensed', 'sans-serif'],
        'robot-slab': ['Roboto Slab', 'serif'],
        'source-serif': ['Source Serif Pro', 'serif'],
        'ubuntu-mono': ['Ubunto Mono', 'monospace'],
        'ubunto': ['Ubuntu', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
        'space-mono': ['Space Mono', 'monospace'],
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'ibm-sans': ['IBM Plex Sans', 'sans-serif'],
        'ibm-mono': ['IBM Plex Mono', 'monospace'],
        'path-ex': ['Pathway Extreme', 'sans-serif'],
        'fira-sans': ['Fira Sans', 'sans-serif'],
        'montserr': ['Montserrat', 'sans-serif'],
        'mont-sub': ['Montserrat Subrayada', 'sans-serif'],
        'bungee-shade': ['Bungee Shade', 'sans-serif'],
        'bungee-inline': ['Bungee Inline', 'sans-serif'],
        'gothic-exp': ["Special Gothic Expanded One", 'sans-serif'],
        "share-tech": ["Share Tech", "sans-serif"],
        "gothic-cond": ["Special Gothic Condensed One", "sans-serif"],
        "merriweather": ["Merriweather", "serif"],
        "playfair-disp": ["Playfair Display", "serif"],
        "stack-head": ["Stack Sans Headline", "sans-serif"]
      },
      backgroundImage: theme => ({
'headerpic':
        'url(https://i.pinimg.com/originals/82/61/db/8261dbfb8be94c32d494ff96fe6869ab.jpg)',
        'study': 
        'url(https://i.pinimg.com/736x/00/77/cb/0077cbd5b342e791060befe976f36d71.jpg)',
        'placeholder':
        'url(https://i.pinimg.com/736x/f9/ea/7d/f9ea7d24a5d41e402de1136a93e64502.jpg)',
        'about': 
        'url(https://i.pinimg.com/736x/02/70/e4/0270e43f060c27d1fc813b0d571486ba.jpg)',
        'about-alt':
        'url(https://i.pinimg.com/736x/a8/86/31/a88631a6cb3782335da177c676adcf62.jpg)',
        'about-alt-sec': 
        'url(https://i.pinimg.com/736x/00/dd/51/00dd51f71c38e46e8c12023381988970.jpg)',
        'data-sci':
        'url(https://i.pinimg.com/736x/e6/b6/e7/e6b6e7b1f782a3c01cdcea20c97fab80.jpg)',
        'front-end': 
        'url(https://i.pinimg.com/736x/cb/8f/44/cb8f44d1fd4fb33fbbbe38856a30b934.jpg)',
        'back-end':
        'url(https://i.pinimg.com/736x/cf/08/c6/cf08c6497d39a426236d623d5122aa78.jpg)',
        'cybersecurity':
        'url(https://i.pinimg.com/736x/d2/60/86/d260867b4c1aa05838dcf7976356e67d.jpg)',
        'projman':
        'url(https://i.pinimg.com/736x/a6/3c/ac/a63cac8c6bc37444541277cec0cce383.jpg)',
        'soft-eng':
        'url(https://i.pinimg.com/736x/ef/b9/0a/efb90a48271c4709c74828315466ed41.jpg)',
        'ux-des':
        'url(https://i.pinimg.com/736x/35/a1/e2/35a1e25e38e6a84f770926816c689367.jpg)'
      })
    }
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/line-clamp'),
    require('tailwind-scrollbar')
  ]
}
