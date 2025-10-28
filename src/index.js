import React from 'react';
import ReactDOM from 'react-dom/client';
// Importiamo l'app Web che abbiamo costruito:
import App from './App.jsx'; 
import './index.css'; // Mantiene l'importazione del CSS standard

const rootElement = document.getElementById('root');

if (rootElement) {
  // Questo codice avvia l'app nel browser.
  // Abbiamo rimosso 'as HTMLElement' che è una sintassi TypeScript.
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* Assicurati che il tuo componente principale sia importato da App.jsx */}
      <App />
    </React.StrictMode>
  );
} else {
  console.error("L'elemento con ID 'root' non è stato trovato nel DOM.");
}
