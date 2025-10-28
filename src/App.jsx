import React, { useState, useEffect, useCallback } from 'react';
// RIMOZIONE: import { createClient } from '@supabase/supabase-js';
// CAUSA DELL'ERRORE: Questo ambiente non supporta l'importazione diretta di pacchetti NPM.
// SOLUZIONE: Ritorno al caricamento dinamico tramite CDN per la compatibilità con il Canvas.

// --- Supabase Configuration (IMPORTANT: Keys inserted below) ---
// Chiavi fornite dall'utente:
const SUPABASE_URL = 'https://lshvnwryhqlvjhxqscla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHZud3J5aHFsdmpoeHFzY2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTc0MzcsImV4cCI6MjA3Njg3MzQzN30.wKxHKzbcWAH2WgdkuQ6pcRS82gMVMnWZx1GWpP2Kimg';

// URL del CDN di Supabase (per questo ambiente)
const SUPABASE_CDN_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; 

// --- LOGO CONFIGURATION (URL Pubblico) ---
const LOGO_URL = 'https://lshvnwryhqlvjhxqscla.supabase.co/storage/v1/object/public/app-assets/intro2.png'; 
const LOGO_ALT = 'Logo Personale Applicazione';

// Funzione per caricare Supabase tramite CDN
const loadSupabaseScript = () => {
    return new Promise((resolve, reject) => {
        // Controlla se è già stato caricato
        if (window.supabase) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = SUPABASE_CDN_URL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Supabase script from CDN.'));
        document.head.appendChild(script);
    });
};


// Componente Logo Semplice
const Logo = () => (
    <div className="flex justify-center mb-6">
        <img 
            src={LOGO_URL} 
            alt={LOGO_ALT} 
            className="h-12 w-auto rounded-lg shadow-lg"
        />
    </div>
);

// Componente principale dell'applicazione
const App = () => {
    const [supabaseClient, setSupabaseClient] = useState(null);
    const [user, setUser] = useState(null); // Supabase User object
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const isConfigured = true;

    // --- Inizializzazione Supabase e Listener (ADATTATO) ---
    useEffect(() => {
        let authListener = null;
        
        const initializeSupabase = async () => {
            setLoading(true);
            setError('');
            setMessage('');
            
            if (!isConfigured) {
                setError("ERRORE DI CONFIGURAZIONE: Incolla l'URL e la Chiave Anonima di Supabase.");
                setLoading(false);
                return;
            }
            
            try {
                // 1. Carica lo script Supabase
                await loadSupabaseScript(); 

                if (!window.supabase || !window.supabase.createClient) {
                     throw new Error("Supabase was loaded, but the client function is missing.");
                }
                
                // 2. INIZIALIZZAZIONE: Usa createClient disponibile globalmente
                const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                setSupabaseClient(client);

                const { data } = client.auth.onAuthStateChange(
                    (event, session) => {
                        setUser(session?.user ?? null);
                        if (event === 'SIGNED_IN') {
                            setMessage("Accesso o registrazione riusciti!");
                        }
                        if (event === 'SIGNED_OUT') {
                            setMessage("Logout effettuato.");
                        }
                        setLoading(false);
                    }
                );
                
                authListener = data.subscription;

                const { data: sessionData } = await client.auth.getSession();
                setUser(sessionData.session?.user ?? null);
                
            } catch (e) {
                console.error("Errore nell'inizializzazione di Supabase:", e);
                setError(`Errore critico: Impossibile inizializzare Supabase. ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        initializeSupabase();
        
        return () => {
             if (authListener) {
                authListener.unsubscribe();
            }
        };
    }, [isConfigured]);
    
    // --- Authentication Handlers ---
    
    const handleRegister = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!supabaseClient) { setError("Servizio di autenticazione non pronto."); return; }
        if (!email || !password) { setError('Devi fornire email e password.'); return; }
        try {
            setLoading(true);
            const { error: signUpError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (signUpError) throw signUpError;
            
            setMessage('Registrazione riuscita! Controlla la tua email per la verifica se è richiesta.');

        } catch (e) {
            setError(`Registrazione fallita: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [email, password, supabaseClient]);

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!supabaseClient) { setError("Servizio di autenticazione non pronto."); return; }
        if (!email || !password) { setError('Devi fornire email e password.'); return; }
        try {
            setLoading(true);
            const { error: signInError } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInError) throw signInError;
            
            setMessage('Accesso riuscito!');

        } catch (e) {
            setError(`Accesso fallito: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [email, password, supabaseClient]);
    
    const handleGoogleLogin = useCallback(async () => {
        setError('');
        setMessage('');
        if (!supabaseClient) { setError("Servizio di autenticazione non pronto."); return; }
        try {
            setLoading(true);
            const { error: signInError } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
            });
            
            if (signInError) throw signInError;

        } catch (e) {
            setError(`Accesso Google fallito: ${e.message}`);
            setLoading(false);
        }
    }, [supabaseClient]);


    const handleLogout = useCallback(async () => {
        setError('');
        setMessage('');
        if (!supabaseClient) return;
        
        try {
            setLoading(true);
            const { error: signOutError } = await supabaseClient.auth.signOut();
            if (signOutError) throw signOutError;
            
            setMessage('Logout effettuato con successo.');
        } catch (e) {
            setError(`Logout fallito: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [supabaseClient]);

    // --- Componente per la To-Do List (Dashboard Protetta) ---
    
    const MainContent = () => {
        const [todos, setTodos] = useState([]);
        const [newTodoTitle, setNewTodoTitle] = useState('');
        const [todoLoading, setTodoLoading] = useState(false);
        const [todoError, setTodoError] = useState('');
        
        const displayEmail = user?.email || 'N/A';
        
        // --- Operazioni CRUD ---

        // READ: Fetch/Subscribe to Todos
        const fetchTodos = useCallback(async () => {
            setTodoLoading(true);
            setTodoError('');
            
            if (!supabaseClient) return;

            try {
                // Legge solo i todo dell'utente corrente (grazie all'RLS!)
                const { data, error } = await supabaseClient
                    .from('todos')
                    .select('id, title, is_complete')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                setTodos(data);
            } catch (e) {
                setTodoError(`Errore nel caricamento delle attività: ${e.message}`);
            } finally {
                setTodoLoading(false);
            }
        }, [supabaseClient]);

        // CREATE: Add new Todo
        const addTodo = useCallback(async (e) => {
            e.preventDefault();
            setTodoError('');
            if (!supabaseClient || !newTodoTitle.trim()) return;
            
            try {
                setTodoLoading(true);
                // NOTA: user_id viene inserito automaticamente grazie al default value in SQL (auth.uid())
                const { data, error } = await supabaseClient
                    .from('todos')
                    .insert({ title: newTodoTitle.trim() })
                    .select('id, title, is_complete'); // Seleziona i dati inseriti per aggiornare lo stato

                if (error) throw error;
                
                // Aggiorna lo stato con la nuova attività in cima
                setTodos(prev => [data[0], ...prev]);
                setNewTodoTitle('');
            } catch (e) {
                setTodoError(`Errore nell'aggiunta dell'attività: ${e.message}`);
            } finally {
                setTodoLoading(false);
            }
        }, [supabaseClient, newTodoTitle]);

        // UPDATE: Toggle completion status
        const toggleTodo = useCallback(async (id, currentStatus) => {
            setTodoError('');
            if (!supabaseClient) return;

            try {
                const { error } = await supabaseClient
                    .from('todos')
                    .update({ is_complete: !currentStatus })
                    .eq('id', id);

                if (error) throw error;
                
                // Aggiorna lo stato locale senza ricaricare tutto
                setTodos(prev => prev.map(todo => 
                    todo.id === id ? { ...todo, is_complete: !currentStatus } : todo
                ));
            } catch (e) {
                setTodoError(`Errore nell'aggiornamento dell'attività: ${e.message}`);
            }
        }, [supabaseClient]);
        
        // DELETE: Remove a Todo
        const deleteTodo = useCallback(async (id) => {
            setTodoError('');
            if (!supabaseClient) return;

            try {
                const { error } = await supabaseClient
                    .from('todos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                // Rimuove l'attività dallo stato locale
                setTodos(prev => prev.filter(todo => todo.id !== id));
            } catch (e) {
                setTodoError(`Errore nella cancellazione dell'attività: ${e.message}`);
            }
        }, [supabaseClient]);


        // Fetch data when component mounts or client changes
        useEffect(() => {
            if (supabaseClient && user) {
                fetchTodos();
            }
        }, [supabaseClient, user, fetchTodos]);


        // --- UI Rendering ---

        return (
            <div className="w-full max-w-lg mx-auto p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
                <Logo />
                
                <h2 className="text-3xl font-bold text-center text-indigo-400">La tua To-Do List</h2>
                
                <p className="text-sm text-center text-gray-400">
                    Accesso: <span className="font-semibold text-white">{displayEmail}</span>
                </p>

                {/* Status/Error Messages */}
                {todoError && (
                    <div className="p-3 bg-red-600 rounded-lg text-white font-medium text-sm">
                        {todoError}
                    </div>
                )}
                
                {/* Form per Aggiungere un Todo */}
                <form onSubmit={addTodo} className="flex space-x-3">
                    <input
                        type="text"
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Cosa devi fare?"
                        required
                        disabled={todoLoading}
                    />
                    <button
                        type="submit"
                        disabled={todoLoading || !newTodoTitle.trim()}
                        className="flex-shrink-0 px-4 py-2 rounded-lg font-bold text-white transition duration-300 transform shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {todoLoading ? 'Aggiunta...' : 'Aggiungi'}
                    </button>
                </form>

                {/* Lista Attività */}
                <div className="space-y-3 pt-4">
                    {todoLoading && todos.length === 0 ? (
                        <p className="text-center text-gray-400">Caricamento attività...</p>
                    ) : todos.length === 0 ? (
                        <p className="text-center text-gray-400">Nessuna attività da fare. Aggiungine una!</p>
                    ) : (
                        todos.map((todo) => (
                            <div key={todo.id} className={`flex items-center p-4 rounded-lg shadow-md transition duration-300 ${todo.is_complete ? 'bg-gray-700 opacity-60' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                
                                {/* Checkbox per completare */}
                                <input
                                    type="checkbox"
                                    checked={todo.is_complete}
                                    onChange={() => toggleTodo(todo.id, todo.is_complete)}
                                    className="h-5 w-5 text-indigo-600 bg-gray-900 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer"
                                />

                                {/* Titolo dell'attività */}
                                <span className={`flex-grow ml-3 text-lg ${todo.is_complete ? 'line-through text-gray-500' : 'text-white'}`}>
                                    {todo.title}
                                </span>

                                {/* Pulsante Cancella */}
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    disabled={todoLoading}
                                    className="p-1 text-red-400 hover:text-red-500 transition duration-150 rounded-full hover:bg-gray-600 disabled:opacity-50"
                                    title="Cancella attività"
                                >
                                    {/* Icona cestino SVG */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"></path>
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>


                {/* Logout Button */}
                <div className="pt-6 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 rounded-lg font-bold text-white transition duration-300 transform shadow-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-500"
                        disabled={loading}
                    >
                        Esci (Logout)
                    </button>
                </div>
            </div>
        );
    };

    // Auth Form (Login/Register) - non modificato...
    const AuthForm = () => (
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
            <Logo />

            <h2 className="text-3xl font-bold text-center text-indigo-400">
                {isRegisterMode ? 'Registrazione Account' : 'Accesso'}
            </h2>

            {error && (
                <div className="p-3 bg-red-600 rounded-lg text-white font-medium">
                    {error}
                </div>
            )}
            {message && (
                <div className="p-3 bg-green-600 rounded-lg text-white font-medium">
                    {message}
                </div>
            )}
            
            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="tua@email.com"
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="********"
                        required
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !isConfigured}
                    className="w-full py-3 rounded-lg font-bold text-white transition duration-300 transform shadow-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? 'Elaborazione...' : (isRegisterMode ? 'Registrati' : 'Accedi')}
                </button>
            </form>
            
            <div className="flex items-center space-x-2">
                <span className="h-px w-full bg-gray-700"></span>
                <span className="text-gray-400 text-sm">OPPURE</span>
                <span className="h-px w-full bg-gray-700"></span>
            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={loading || !isConfigured}
                className="w-full py-3 flex items-center justify-center space-x-3 bg-white text-gray-800 rounded-lg font-semibold transition duration-300 transform shadow-lg hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.316-5.967 7-10.303 7c-6.627 0-12-5.373-12-12c0-6.627 5.373-12 12-12c3.078 0 5.82 1.139 7.954 3.32l5.657-5.657C34.053 4.293 29.261 2 24 2C11.85 2 2 11.85 2 24s9.85 22 22 22c11.082 0 20.334-7.85 21.75-18.083z"/>
                    <path fill="#FF3D00" d="M6.306 14.697l6.632 4.043C15.421 16.592 19.324 14 24 14c3.078 0 5.82 1.139 7.954 3.32l5.657-5.657C34.053 4.293 29.261 2 24 2C16.891 2 10.741 6.273 7.994 12.016z"/>
                    <path fill="#4CAF50" d="M43.611 20.083H24v8h11.303c-1.649 4.316-5.967 7-10.303 7c-6.627 0-12-5.373-12-12c0-6.627 5.373-12 12-12c3.078 0 5.82 1.139 7.954 3.32l5.657-5.657C34.053 4.293 29.261 2 24 2C11.85 2 2 11.85 2 24s9.85 22 22 22c11.082 0 20.334-7.85 21.75-18.083z"/>
                    <path fill="#1976D2" d="M6.306 33.303l6.632 4.043C15.421 35.408 19.324 38 24 38c3.078 0 5.82-1.139 7.954-3.32l5.657 5.657C34.053 45.707 29.261 48 24 48C16.891 48 10.741 43.727 7.994 37.984z"/>
                </svg>
                <span>Accedi con Google</span>
            </button>

            <div className="text-center">
                <button
                    onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); setMessage(''); }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition duration-150"
                    disabled={loading}
                >
                    {isRegisterMode ? 'Hai già un account? Accedi' : "Non hai un account? Registrati"}
                </button>
            </div>
        </div>
    );

    // --- Main Rendering ---
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4">
            {user
                ? <MainContent /> // Show main content (ToDo List) if logged in
                : <AuthForm /> // Show auth form if not logged in
            }
        </div>
    );
};

export default App;
