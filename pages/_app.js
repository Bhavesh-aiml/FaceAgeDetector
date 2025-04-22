// Use custom Bootstrap theme from Replit
// This is imported in _document.js to avoid importing twice
import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  // Set up dark theme for Bootstrap 5 
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;