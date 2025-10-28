// C:\PadelApp\.hooks\useIsMounted.ts (COMPLETO)

import { useEffect, useState } from 'react';

/**
 * Hook che restituisce true dopo che il componente si è montato.
 * Usato per evitare la navigazione prematura (il bug "Attempted to navigate before mounting").
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Il codice qui sotto viene eseguito DOPO il montaggio iniziale
    setIsMounted(true);

    // Non c'è bisogno di una funzione di cleanup qui
  }, []);

  return isMounted;
};