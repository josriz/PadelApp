import React, { useState, useContext, createContext, Dispatch, SetStateAction } from 'react';

// ====================================================================
// FIX: Definizione delle interfacce TypeScript per i componenti Mock
// per eliminare gli errori di tipo 'any' e le proprietà mancanti.
// ====================================================================

interface CommonProps {
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

interface ViewProps extends CommonProps {
    // Aggiungi qui altre props specifiche se necessario
}

interface TextInputProps extends CommonProps {
    placeholder?: string;
    placeholderTextColor?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean; // Optional in React Native, ma lo rendiamo esplicito qui
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

interface TouchableOpacityProps extends CommonProps {
    onPress: () => void;
    disabled?: boolean;
}

interface ActivityIndicatorProps {
    color?: string;
}

// --- Componenti Mock ---

const View: React.FC<ViewProps> = ({ style, children }) => <div style={{...style, boxSizing: 'border-box', display: 'flex'}}>{children}</div>;
const Text: React.FC<CommonProps> = ({ style, children }) => <span style={{...style, display: 'block'}}>{children}</span>;

const TextInput: React.FC<TextInputProps> = ({ 
    style, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry,
    // Ignoriamo le props non usate per l'HTML, ma le accettiamo tramite l'interfaccia
    placeholderTextColor, 
    keyboardType, 
    autoCapitalize 
}) => (
  <input 
    type={secureTextEntry ? 'password' : 'text'}
    placeholder={placeholder}
    value={value}
    onChange={e => onChangeText(e.target.value)}
    style={{
        ...style,
        color: '#1F2937', 
        // L'HTML non supporta 'placeholderTextColor' tramite stile inline diretto, 
        // ma lo manteniamo per conformità all'interfaccia RN
    }}
  />
);

const TouchableOpacity: React.FC<TouchableOpacityProps> = ({ style, onPress, disabled, children }) => (
  <button 
    style={{
        ...style, 
        border: 'none', 
        cursor: disabled ? 'default' : 'pointer', 
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
    }} 
    onClick={onPress} 
    disabled={disabled}
  >
    {children}
  </button>
);

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ color }) => (
    <div style={{...styles.spinner, borderTopColor: color}}></div>
);

const StyleSheet = { create: (styles: { [key: string]: React.CSSProperties }) => styles };

// --- Interfacce e Simulazione per Router e AuthContext ---

interface AuthContextType {
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    user: any; // Mantenuto 'any' perché non conosciamo la struttura utente di Firebase
    loading: boolean;
}

const MOCK_AUTH_CONTEXT: AuthContextType = {
    signUp: async (email, password) => { 
        console.log(`Simulazione di registrazione per: ${email}`); 
        await new Promise(resolve => setTimeout(resolve, 100)); 
    },
    signIn: async () => {}, // Mock per conformità
    signOut: async () => {}, // Mock per conformità
    user: null,
    loading: false,
};
const AuthContext = createContext<AuthContextType>(MOCK_AUTH_CONTEXT);
const useAuth = () => useContext(AuthContext);

interface LinkProps extends CommonProps {
    href: string;
    asChild?: boolean;
}

const router = {
    replace: (path: string) => console.log(`Simulazione Navigazione a: ${path}`),
    push: (path: string) => console.log(`Simulazione Push Navigazione a: ${path}`),
};

const Link: React.FC<LinkProps> = ({ href, children }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); router.push(href); }}>
        {children}
    </a>
);
// --- Fine Simulazione ---


export default function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    
    // Ora useAuth è tipizzato
    const { signUp } = useAuth();

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            setError('Compila tutti i campi.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Le password non corrispondono.');
            return;
        }

        setIsSigningUp(true);
        setError('');
        
        try {
            await signUp(email, password);
            router.replace('/'); 
        } catch (e) {
            setError('Errore di registrazione. Riprova.');
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrati</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                secureTextEntry={false} // Aggiunto per conformità a TextInputProps
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
                keyboardType="default" // Aggiunto per conformità
                autoCapitalize="none" // Aggiunto per conformità
            />

            <TextInput
                style={styles.input}
                placeholder="Conferma Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                keyboardType="default" // Aggiunto per conformità
                autoCapitalize="none" // Aggiunto per conformità
            />

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleSignUp} 
                disabled={isSigningUp}
            >
                {isSigningUp ? (
                    <ActivityIndicator color="#1E3A8A" />
                ) : (
                    <Text style={styles.buttonText}>Registrati</Text>
                )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Hai già un account? </Text>
                {/* Naviga alla schermata di login che è la cartella padre (../) */}
                <Link href="../" asChild> 
                    {/* Nota: L'TouchableOpacity qui non ha onPress, è solo un wrapper visivo */}
                    <TouchableOpacity style={{marginLeft: 5}} onPress={() => router.push('../')}>
                        <Text style={styles.linkButton}>Accedi</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 20, minHeight: '100vh', flexDirection: 'column' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#FBBF24', marginBottom: 40, textAlign: 'center' },
    errorText: { color: '#EF4444', marginBottom: 15, textAlign: 'center', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 5, width: '100%', maxWidth: 400 },
    input: { 
        width: '100%', 
        maxWidth: 400, 
        padding: 15, 
        marginBottom: 15, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 8, 
        fontSize: 16, 
        border: '1px solid #E5E7EB',
        boxSizing: 'border-box',
    },
    button: { 
        width: '100%', 
        maxWidth: 400, 
        backgroundColor: '#FBBF24', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginTop: 10,
        display: 'flex', 
        justifyContent: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'opacity 0.3s',
    },
    buttonText: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', display: 'block' },
    linkContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
    linkText: { color: '#FFFFFF', fontSize: 16 },
    linkButton: { color: '#FBBF24', fontSize: 16, fontWeight: '700', textDecoration: 'underline' },
    
    // Stili per l'ActivityIndicator mock
    spinner: {
        border: '4px solid #f3f3f3', 
        borderRadius: '50%',
        borderTop: '4px solid #1E3A8A',
        width: '24px',
        height: '24px',
        animation: 'spin 1s linear infinite',
    },
    // Nota: L'animazione @keyframes deve essere definita nel CSS globale
});

// Aggiungi CSS globale per l'animazione dello spinner
const GlobalStyles = () => (
    <style>
        {`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}
    </style>
);
