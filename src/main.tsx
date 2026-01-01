import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Failed to find root element. Make sure you have a <div id="root"></div> in your index.html');
}

try {
  const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

  createRoot(rootElement).render(
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  );
} catch (error) {
  console.error('Failed to initialize app:', error);
  rootElement.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; text-align: center;">
      <h1>Failed to load app</h1>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
  throw error;
}
