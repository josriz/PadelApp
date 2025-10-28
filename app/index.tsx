import { useEffect, FC } from 'react';
// Uso del MOCK router per compatibilità ambiente
const router = {
    replace: (path: string) => { console.log(`[Router Mock] REPLACING path: ${path}`); },
};

// ====================================================================
// Questa schermata serve solo come punto di ingresso per Expo Router.
// Reindirizza immediatamente alla schermata di Login.
// ====================================================================
const RedirectScreen: FC = () => {
    useEffect(() => {
        // Reindirizza esplicitamente alla schermata di Login (index del gruppo auth).
        // Questo bypassa il problema del routing che non trova il contenuto predefinito del gruppo.
        router.replace('/(auth)/index'); 
    }, []);

    // Mostra una schermata di caricamento mentre il router reindirizza
    return (
        <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
            <span>Caricamento iniziale...</span>
        </div>
    );
};

export default RedirectScreen;
