import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// ====================================================================
// IMPORTAZIONI E CONFIGURAZIONE SUPABASE
// ====================================================================

// --- Variabili Globali (Richieste dall'ambiente Canvas) ---
// Per Supabase, abbiamo bisogno di due chiavi: URL e Anon Key.
// Per questo ambiente, le simuleremo usando le variabili di configurazione di Firebase,
// assumendo che i valori reali siano stati forniti tramite queste variabili.
const DUMMY_SUPABASE_URL = "https://your-supabase-url.supabase.co"; // Sostituire con l'URL reale
const DUMMY_SUPABASE_ANON_KEY = "your-anon-key"; // Sostituire con la Anon Key reale

// Se stessimo usando variabili d'ambiente reali (che non sono disponibili qui), useremmo:
// const supabaseUrl = process.env.SUPABASE_URL || DUMMY_SUPABASE_URL;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DUMMY_SUPABASE_ANON_KEY;

// Utilizziamo un mock per il client Supabase
// In un ambiente reale: import { createClient } from '@supabase/supabase-js'
const mockSupabase = {
    auth: {
        signUp: async ({ email, password }) => { 
            console.log(`Supabase Mock: Registering user ${email}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            // Simula successo
            return { data: { user: { id: 'mock-id-' + Math.random().toString(36).substring(7), email } }, error: null };
        },
        signInWithPassword: async ({ email, password }) => {
            console.log(`Supabase Mock: Signing in user ${email}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            // Simula successo
            return { data: { user: { id: 'mock-id-' + Math.random().toString(36).substring(7), email } }, error: null };
        },
        signOut: async () => {
            console.log("Supabase Mock: Signing out");
            await new Promise(resolve => setTimeout(resolve, 100));
            return { error: null };
        },
        // In un ambiente reale, onAuthStateChange gestisce il re-hydratation
        onAuthStateChange: (callback) => {
            // Mock: Simula che l'utente è sempre disconnesso all'inizio per il login/signup
            callback('SIGNED_OUT', null);
            return { data: { subscription: { unsubscribe: () => {} } } };
        },
        getSession: async () => {
             // Mock: Simula che non c'è sessione attiva
            return { data: { session: null }, error: null };
        }
    },
    // Mock per il database (non usato qui, ma essenziale per Supabase)
    from: () => ({
        insert: () => ({ select: async () => ({ data: [], error: null }) }),
        update: () => ({ select: async () => ({ data: [], error: null }) }),
    }),
    
    // RIMOSSA la definizione 'user: { id: string, email: string }' che causava l'errore.
};

// Inizializzazione fittizia del client Supabase
const supabase = mockSupabase;


// ====================================================================
// Interfaces and Context Definition
// ====================================================================

// L'oggetto 'User' in Supabase è simile ma non identico a quello di Firebase.
// Usiamo un'interfaccia semplice che include ciò che ci serve.
interface SupabaseUser {
    id: string;
    email: string;
    // ... altri campi
}

interface AuthContextType {
    user: SupabaseUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    // Non forniamo 'db' e 'auth' come istanze globali come con Firebase.
    // Gli sviluppatori Supabase tendono a importare e usare il client Supabase direttamente.
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true, 
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ====================================================================
// Authentication Provider Component (Supabase Implementation)
// ====================================================================

// Definiamo l'interfaccia per le props di AuthProvider per il controllo dei tipi
interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Initial Check and Auth State Listener (Supabase style)
    useEffect(() => {
        // Funzione per ottenere la sessione iniziale
        const getInitialSession = async () => {
            // Nota: L'oggetto di ritorno viene tipizzato nel mock per contenere 'session' e 'error'.
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error("Supabase initial session error:", error);
            }
            // Nel mock, 'session' è null, quindi 'user' sarà null.
            if (session?.user) {
                setUser(session.user);
            }
            setLoading(false);
        };

        getInitialSession();
        
        // 2. Auth State Listener (Supabase style)
        // Nota: Nel mock, questo non farà molto, ma è l'API corretta.
        const { data: listener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setUser(session?.user ?? null);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => {
             // In un'implementazione reale: listener?.subscription.unsubscribe();
        };
    }, []);

    // 3. Authentication Methods (Supabase)
    
    // Funzione per il login
    const signIn = async (email: string, password: string) => {
        // La chiamata signInWithPassword restituisce { data: { user, session }, error }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            console.error("Supabase Login Error:", error.message);
            throw new Error(error.message);
        }
        // Il listener onAuthStateChange aggiornerà lo stato
        // Aggiorniamo anche qui lo stato direttamente per un feedback immediato
        setUser(data.user || null); 
    };

    // Funzione per la registrazione
    const signUp = async (email: string, password: string) => {
        // La chiamata signUp restituisce { data: { user, session }, error }
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
            console.error("Supabase Registration Error:", error.message);
            throw new Error(error.message);
        }
        // Il listener onAuthStateChange aggiornerà lo stato
        // Aggiorniamo anche qui lo stato direttamente per un feedback immediato
        setUser(data.user || null);
    };

    // Funzione per il logout
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
             console.error("Supabase Logout Error:", error.message);
             throw new Error(error.message);
        }
        setUser(null);
    };

    const value: AuthContextType = useMemo(() => ({
        user,
        loading,
        signIn,
        signUp,
        signOut,
        // Questi campi non esistono in AuthContextType per Supabase
    }), [user, loading]);

    return (
        <AuthContext.Provider value={value}>
            {/* Mostra una schermata di caricamento se l'autenticazione è ancora in corso */}
            {loading ? <LoadingScreen /> : children}
        </AuthContext.Provider>
    );
};

// ====================================================================
// Mock components for environment compatibility 
// ====================================================================

// Qui manteniamo i mock per i componenti React Native, essenziali per la compilazione
const View = ({ style, children }: {style?: React.CSSProperties, children?: React.ReactNode}) => <div style={{...style, boxSizing: 'border-box', display: 'flex'}}>{children}</div>;
const Text = ({ style, children }: {style?: React.CSSProperties, children?: React.ReactNode}) => <span style={{...style, display: 'block'}}>{children}</span>;

// Placeholder per una schermata di caricamento mentre 'loading' è true
const LoadingScreen: React.FC = () => (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', minHeight: '100vh', flexDirection: 'column'}}>
        <Text style={{color: '#1E3A8A', fontSize: 20, marginBottom: 20}}>Caricamento Autenticazione Supabase...</Text>
        <div style={{border: '4px solid #f3f3f3', borderRadius: '50%', borderTop: '4px solid #1E3A8A', width: '30px', height: '30px', animation: 'spin 1s linear infinite'}}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </View>
);

export default AuthProvider;
