// Definizione dei mock di React Native per l'ambiente isolato
import React, { useState, Dispatch, SetStateAction } from 'react';

// --- MOCK COMPONENT PROPS (TypeScript Interfaces) ---

interface StyleProp { [key: string]: any; }
interface ViewProps { style?: StyleProp; children?: React.ReactNode; }
interface TextProps { style?: StyleProp; children?: React.ReactNode; }
interface TextInputProps {
  style?: StyleProp;
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: Dispatch<SetStateAction<string>>;
  secureTextEntry?: boolean;
  keyboardType?: string;
  autoCapitalize?: string;
}
interface ButtonProps {
  style?: StyleProp;
  onPress: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}
interface LinkProps { href: string; asChild?: boolean; children?: React.ReactNode; }
interface ActivityIndicatorProps { color?: string; }
interface StyleSheetType { create: (styles: { [key: string]: any }) => { [key: string]: any }; }

// --- MOCK COMPONENTS ---

const View: React.FC<ViewProps> = ({ style, children }) => (
  <div style={{ ...defaultStyles.view, ...style as React.CSSProperties }}>{children}</div>
);
const Text: React.FC<TextProps> = ({ style, children }) => (
  <span style={{ ...defaultStyles.text, ...style as React.CSSProperties }}>{children}</span>
);
const TextInput: React.FC<TextInputProps> = ({
  style, placeholder, placeholderTextColor = 'gray', value, onChangeText, secureTextEntry = false,
  keyboardType = 'default', autoCapitalize = 'none', // Aggiunto per soddisfare TypeScript
}) => (
  <input
    type={secureTextEntry ? 'password' : 'text'}
    placeholder={placeholder}
    value={value}
    onChange={e => onChangeText && onChangeText(e.target.value)}
    style={{
      ...defaultStyles.textInput,
      color: 'black', // Assicura che il testo sia visibile
      '--placeholder-color': placeholderTextColor,
      ...style as React.CSSProperties
    } as React.CSSProperties}
  />
);
const TouchableOpacity: React.FC<ButtonProps> = ({ style, onPress, disabled = false, children }) => (
  <button
    onClick={onPress}
    disabled={disabled}
    style={{
      ...defaultStyles.button,
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style as React.CSSProperties
    }}
  >
    {children}
  </button>
);
const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ color = 'white' }) => (
  <div style={{ color: color }}>Caricamento...</div> // Semplice mock
);

const StyleSheet: StyleSheetType = {
  create: (styles) => styles,
};

// --- MOCK EXPO ROUTER E AUTH CONTEXT ---

// Simula la funzione di routing (necessaria per il Link)
const router = {
  push: (path: string) => console.log(`[Router Mock] PUSHING to: ${path}`),
  replace: (path: string) => console.log(`[Router Mock] REPLACING with: ${path}`),
  back: () => console.log(`[Router Mock] GOING BACK`),
};

// Simula il componente Link
const Link: React.FC<LinkProps> = ({ href, asChild, children }) => {
  const handlePress = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handlePress,
      style: { ...((children as React.ReactElement).props.style || {}), textDecoration: 'none' }
    });
  }
  return (
    <a href={href} onClick={handlePress} style={{ textDecoration: 'none' }}>
      {children}
    </a>
  );
};

// Definisce il tipo di AuthContext per l'uso
interface User { id: string; email: string; }
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Mock di useAuth (Deve essere usato da un Provider, qui solo per evitare errori TS)
const useAuth = (): AuthContextType => {
  const mockUser: User = { id: 'mock-id-123', email: 'user@example.com' };

  return {
    user: null, // L'utente non è loggato all'inizio
    loading: false,
    signIn: async (email, password) => console.log(`[Auth Mock] Signing in ${email}...`),
    signUp: async (email, password) => console.log(`[Auth Mock] Signing up ${email}...`),
    signOut: async () => console.log(`[Auth Mock] Signing out...`),
  };
};

// --- COMPONENTE PRINCIPALE ---

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth(); // Ottiene la funzione di sign-in mock

  const handleLogin = async () => {
    setIsLoading(true);
    console.log(`Tentativo di accesso per: ${email}`);
    // Simula l'autenticazione con il mock, poi naviga
    await signIn(email, password);

    // Naviga alla schermata principale dopo il mock di sign-in
    router.replace('/(app)/home');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accesso all'App</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail as Dispatch<SetStateAction<string>>}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword as Dispatch<SetStateAction<string>>}
        secureTextEntry={true}
      />

      <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.button}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Accedi</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Non hai un account?</Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Registrati qui</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

// --- STILI DI DEFAULT (MOCK) ---
const defaultStyles: StyleProp = {
  view: {
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
  },
  text: {
    fontFamily: 'sans-serif',
    color: '#1F2937',
    margin: 0,
    padding: 0,
  },
  textInput: {
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    padding: '10px',
    margin: '8px 0',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: '8px',
    padding: '12px',
    margin: '16px 0',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

// --- STILI SPECIFICI (Utilizzando StyleSheet mock) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    margin: 'auto',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#1F2937',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  button: {
    backgroundColor: '#3B82F6', // Un bel blu
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  linkButton: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  linkButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 14,
    textDecoration: 'underline',
  },
});

export default LoginScreen;
