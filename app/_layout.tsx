import React, { FC, ReactNode, useEffect, useState } from 'react';
// Usiamo i mock per la compatibilità in questo ambiente
// In un progetto reale: import { Slot, useRouter, Redirect } from 'expo-router';
// In un progetto reale: import AuthProvider, { useAuth } from './context/AuthContext'; 

// ====================================================================
// MOCK per Expo Router e Auth Context
// ====================================================================
interface Style {
    [key: string]: any;
}

// MOCK Componenti React Native / Router
const View: FC<{ style?: Style; children: ReactNode }> = ({ style, children }) => <div style={{...style, boxSizing: 'border-box'}}>{children}</div>;
const Text: FC<{ style?: Style; children: ReactNode }> = ({ style, children }) => <span style={{...style, display: 'block'}}>{children}</span>;

// MOCK di Redirect
const Redirect: FC<{ href: string }> = ({ href }) => {
    useEffect(() => {
        // Simula il reindirizzamento usando console.log
        console.log(`[Router Mock] REDIRECTING to: ${href}`);
    }, [href]);
    // Rende un div vuoto per bloccare il rendering dello slot
    return <div style={{ display: 'none' }} />; 
};

// MOCK di Slot (Il contenuto dell'app viene reso qui)
const Slot: FC = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
        <Text style={{fontSize: 24, color: '#333'}}>
            [Contenuto Slot Principale]
        </Text>
        <Text style={{fontSize: 14, color: '#666', marginTop: 10}}>
             Se vedi questo, il reindirizzamento ha fallito.
        </Text>
    </View>
);

// MOCK di useAuth (Deve essere coerente con AuthContext.tsx)
const useAuth = () => ({
    // Simula lo stato di disconnessione (user: null) per forzare il login iniziale
    user: null, 
    loading: false, // Non in caricamento per andare subito al check
    signIn: async (email: string, password: string) => true,
    signUp: async (email: string, password: string) => true,
    signOut: async () => {},
});

// MOCK del Provider (Semplicemente renderizza i figli)
const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

// ====================================================================
// SCHERMATA DI CARICAMENTO (Quando loading è true)
// ====================================================================

const LoadingScreen: FC = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 20, color: '#1F2937' }}>Caricamento app...</Text>
    </View>
);

// ====================================================================
// LOGICA DI REINDIRIZZAMENTO DEL LAYOUT
// ====================================================================

const RootLayout: FC = () => {
    const { user, loading } = useAuth();
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Simula il completamento del check iniziale per sbloccare la navigazione
        // In un'app reale, questo sarebbe controllato da onAuthStateChanged
        const timer = setTimeout(() => setIsAuthReady(true), 100); 
        return () => clearTimeout(timer);
    }, []);

    if (loading || !isAuthReady) {
        return <LoadingScreen />;
    }

    // Se l'utente NON è loggato, reindirizza al gruppo di autenticazione.
    // L'uso di Redirect interrompe il rendering dello Slot.
    if (!user) {
        return <Redirect href="/(auth)/index" />;
    }

    // Se l'utente è loggato, lascia che il router navighi all'interno dello Slot.
    return <Slot />;
};

// ====================================================================
// EXPORT COMPONENTE PADRE
// ====================================================================

const RootLayoutWrapper: FC = () => {
    return (
        <AuthProvider>
            <RootLayout />
        </AuthProvider>
    );
};

export default RootLayoutWrapper;
