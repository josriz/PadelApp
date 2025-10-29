import React, { useState, useEffect } from 'react';

// IMPORTAZIONE STANDARD: Poiché questo ambiente non supporta l'import di moduli npm, 
// usiamo un fallback locale. Per il deploy React/Vite/Render reale, installa 
// '@supabase/supabase-js' e usa l'importazione standard.
const createClient = (url, key) => {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    return window.supabase.createClient(url, key);
  }
  // Implementazione mock per la compilazione in assenza di modulo npm
  return {
    from: () => ({
      select: () => ({ order: () => ({ data: [], error: null }) }),
      insert: () => ({ error: null }),
      update: () => ({ eq: () => ({ error: null }) }),
      delete: () => ({ eq: () => ({ error: null }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: { user: { id: 'mock-user' } }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: { id: 'mock-user' } }, error: null }),
      signInWithOAuth: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }), removeChannel: () => {} }),
  };
}; 

// Le tue credenziali SUPABASE (mantengono l'URL e la chiave)
const SUPABASE_URL = 'https://lshvnwryhqlvjhxqscla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHZud3J5aHFsdmpoeHFzY2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTc0MzcsImV4cCI6MjA3Njg3MzQzN30.wKxHKzbcWAH2WgdkuQ6pcRS82gMVMnWZx1GWpP2Kimg';
const LOGO_URL = 'https://lshvnwryhqlvjhxqscla.supabase.co/storage/v1/object/public/app-assets/intro2.png';
const LOGO_ALT = 'Logo Padel Planner';


// --- FUNZIONALITÀ AGGIUNTA: GESTIONE DELLE PARTITE (MatchManager) ---

const initialPlayerState = [
  { name: 'Giocatore 1 (Team A)', team: 'A' },
  { name: 'Giocatore 2 (Team A)', team: 'A' },
  { name: 'Giocatore 3 (Team B)', team: 'B' },
  { name: 'Giocatore 4 (Team B)', team: 'B' },
];

// 1. Match Manager Component (Sostituisce TodoList)
const MatchManager = ({ session, supabaseClient }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    match_date: '',
    location: '',
    players: initialPlayerState,
    score_team_a: null,
    score_team_b: null,
  });
  const [error, setError] = useState('');

  // Funzione di utility per formattare la data per l'input datetime-local
  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Funzione di fetch e Realtime
  const fetchMatches = async () => {
    if (!supabaseClient || !session) return;
    setLoading(true);
    try {
      // Recupera le partite, ordinate per data_partita decrescente
      const { data, error: fetchError } = await supabaseClient
        .from('matches')
        .select('id, match_date, location, players, score_team_a, score_team_b')
        .order('match_date', { ascending: false });

      if (fetchError) throw fetchError;
      setMatches(data);
      setError('');
    } catch (error) {
      console.error('Errore nel recupero delle partite:', error.message);
      setError('Impossibile caricare le partite. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(); // Initial fetch

    // Setup Realtime Subscription
    const matchChannel = supabaseClient
      .channel('match_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          // Re-fetch data on any change
          fetchMatches(); 
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(matchChannel);
    };
  }, [session, supabaseClient]); // Dependency list adjusted

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMatchData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerChange = (index, value) => {
    const updatedPlayers = newMatchData.players.map((player, i) => 
      i === index ? { ...player, name: value } : player
    );
    setNewMatchData(prev => ({ ...prev, players: updatedPlayers }));
  };

  const addMatch = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validazione base
    if (!newMatchData.match_date || !newMatchData.location) {
        setError('Data, ora e luogo sono obbligatori.');
        return;
    }

    setLoading(true);

    try {
      // Inserisci la nuova partita
      const matchToInsert = {
        match_date: newMatchData.match_date,
        location: newMatchData.location,
        players: newMatchData.players, // Supabase gestisce jsonb
      };

      const { error: insertError } = await supabaseClient
        .from('matches')
        .insert([matchToInsert]);

      if (insertError) throw insertError;
      
      // Resetta lo stato del form e chiudi il modale
      setNewMatchData({
        match_date: '',
        location: '',
        players: initialPlayerState,
        score_team_a: null,
        score_team_b: null,
      });
      setIsAdding(false);
      
    } catch (error) {
      console.error('Errore nell\'aggiunta della partita:', error.message);
      setError('Errore di salvataggio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabaseClient) return;
    try {
      const { error: logoutError } = await supabaseClient.auth.signOut();
      if (logoutError) throw logoutError;
    } catch (error) {
      console.error('Errore durante il logout:', error.message);
    }
  };

  const formatMatchDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };
  
  const userEmail = session?.user?.email || 'Utente';

  // Modal per Aggiungere Partita
  const AddMatchModal = () => (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-lg p-6 rounded-xl shadow-2xl border border-green-700 relative">
        <h2 className="text-2xl font-bold text-green-400 mb-4 border-b border-gray-700 pb-2">Registra Nuova Partita</h2>
        
        {error && <div className="p-3 mb-4 rounded-lg bg-red-600 text-white text-sm">{error}</div>}
        
        <form onSubmit={addMatch} className="space-y-4">
          
          {/* Dati Partita */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Data e Ora Partita</label>
            <input
              type="datetime-local"
              name="match_date"
              value={newMatchData.match_date}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-green-500 focus:border-green-500"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Luogo / Circolo</label>
            <input
              type="text"
              name="location"
              value={newMatchData.location}
              onChange={handleInputChange}
              placeholder="Nome del campo o circolo"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-green-500 focus:border-green-500"
              required
              disabled={loading}
            />
          </div>
          
          {/* Gestione Giocatori */}
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Giocatori</h3>
            <div className="grid grid-cols-2 gap-4">
              {newMatchData.players.map((player, index) => (
                <div key={index} className={`p-3 rounded-lg ${player.team === 'A' ? 'bg-indigo-900/40 border border-indigo-700' : 'bg-orange-900/40 border border-orange-700'}`}>
                  <label className={`block text-xs font-semibold mb-1 ${player.team === 'A' ? 'text-indigo-300' : 'text-orange-300'}`}>
                    Team {player.team} - Posizione {index % 2 + 1}
                  </label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`Nome del Giocatore ${index + 1}`}
                    className="w-full p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white"
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError('');
              }}
              className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition duration-150"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva Partita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-xl shadow-2xl">
      {isAdding && <AddMatchModal />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
        <h1 className="text-3xl font-extrabold text-white">Gestione Partite Padel</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-150 shadow-md"
        >
          Logout
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Accesso come: <span className="font-medium text-green-400">{userEmail}</span>
      </p>
      
      {/* Action Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="w-full py-3 mb-6 bg-green-500 text-gray-900 font-bold rounded-lg hover:bg-green-600 transition duration-150 shadow-lg flex items-center justify-center space-x-2"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M12 3a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9s-9-4.03-9-9a9 9 0 0 1 9-9zm.75 4.5a.75.75 0 0 0-1.5 0v3.75H7.5a.75.75 0 0 0 0 1.5h3.75v3.75a.75.75 0 0 0 1.5 0v-3.75h3.75a.75.75 0 0 0 0-1.5h-3.75V7.5z" clipRule="evenodd" />
        </svg>
        <span>Registra Nuova Partita</span>
      </button>

      {/* Lista Partite */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        <h2 className="text-xl font-bold text-indigo-400 border-b border-gray-700 pb-2 sticky top-0 bg-gray-800 z-10">Storico Partite</h2>
        
        {loading && matches.length === 0 ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
            <p className="mt-4 text-green-400">Caricamento storico...</p>
          </div>
        ) : matches.length === 0 ? (
          <p className="text-center text-gray-500 pt-4">Nessuna partita registrata. Inizia aggiungendone una!</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="p-4 rounded-xl bg-gray-700 hover:bg-gray-600 transition duration-200 shadow-lg border-l-4 border-indigo-500"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-lg font-semibold text-white truncate">{match.location}</p>
                <span className="text-sm text-gray-400 font-medium bg-gray-800 px-3 py-1 rounded-full">
                  {formatMatchDate(match.match_date)}
                </span>
              </div>
              
              {/* Squadre e Punteggio */}
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-600">
                  <p className="font-bold text-indigo-300 mb-1">TEAM A</p>
                  {match.players.filter(p => p.team === 'A').map((p, idx) => (
                    <p key={idx} className="text-gray-200">{p.name}</p>
                  ))}
                  <p className={`mt-2 text-2xl font-extrabold ${match.score_team_a > match.score_team_b ? 'text-green-400' : 'text-gray-400'}`}>
                    Punti: {match.score_team_a !== null ? match.score_team_a : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-600">
                  <p className="font-bold text-orange-300 mb-1">TEAM B</p>
                  {match.players.filter(p => p.team === 'B').map((p, idx) => (
                    <p key={idx} className="text-gray-200">{p.name}</p>
                  ))}
                   <p className={`mt-2 text-2xl font-extrabold ${match.score_team_b > match.score_team_a ? 'text-green-400' : 'text-gray-400'}`}>
                    Punti: {match.score_team_b !== null ? match.score_team_b : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Placeholder per i pulsanti Azioni/Modifica */}
              <div className="mt-4 flex justify-end space-x-2">
                <button className="text-sm text-indigo-400 hover:text-indigo-300 transition duration-150">
                  Modifica
                </button>
                {/* Il pulsante di eliminazione richiede un'implementazione */}
                <button className="text-sm text-red-400 hover:text-red-300 transition duration-150">
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 2. Auth Component (Lasciato invariato per l'accesso)
const AuthComponent = ({ supabaseClient }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password || !supabaseClient) return setMessage('Inserisci email e password.');

    setLoading(true);
    setMessage('');

    try {
      let response;
      if (isSignUp) {
        response = await supabaseClient.auth.signUp({ email, password });
      } else {
        response = await supabaseClient.auth.signInWithPassword({ email, password });
      }

      const { data, error } = response;

      if (error) throw error;

      if (isSignUp && !data.user) {
        setMessage('Verifica la tua email per completare la registrazione.');
      } else if (!data.user) {
        setMessage('Accesso fallito. Credenziali non valide.');
      }
    } catch (error) {
      setMessage(error.message || 'Si è verificato un errore di autenticazione.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabaseClient) return;
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, 
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Errore login Google:', error.message);
      setMessage('Impossibile avviare il login con Google.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    if (!supabaseClient) return;
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin, 
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Errore login Facebook:', error.message);
      setMessage('Impossibile avviare il login con Facebook.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex justify-center mb-3"> 
          <img 
              src={LOGO_URL} 
              alt={LOGO_ALT} 
              className="h-14 w-auto rounded-lg shadow-lg" 
          />
      </div>
      <p className="text-center text-gray-400 text-sm mb-0"> 
          Il tuo piano di gioco definitivo.
      </p>
      <p className="text-center text-gray-500 italic text-xs mb-4">
          by claudio falba
      </p>

      <h1 className="text-3xl font-extrabold text-white mb-5 text-center"> 
        {isSignUp ? 'Registra Account' : 'Accesso Riservato'} 
      </h1>

      {message && (
        <div className={`p-3 mb-4 rounded-lg text-sm ${message.includes('successo') || message.includes('Verifica') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-green-500 focus:border-green-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-green-500 focus:border-green-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-green-500 text-gray-900 font-bold rounded-lg hover:bg-green-600 transition duration-150 shadow-lg disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Caricamento...' : (isSignUp ? 'Registrati' : 'Accedi')}
        </button>
      </form>

      <div className="mt-3 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-green-400 hover:text-green-300 transition duration-150"
          disabled={loading}
        >
          {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
        </button>
      </div>

      <div className="relative my-4"> 
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-xs"> 
          <span className="px-2 bg-gray-800 text-gray-500">O</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition duration-150 shadow-lg mb-2 disabled:opacity-50 border border-gray-300"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-6 w-6">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.637 4.092-5.748 6.84-10.303 6.84c-6.793 0-12.3-5.507-12.3-12.3s5.507-12.3 12.3-12.3c3.181 0 6.173 1.258 8.41 3.5l5.657-5.657C36.00 6.234 30.417 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691L12.753 21H24v-8h-8.086L6.306 14.691z"/>
          <path fill="#4CAF50" d="M14.07 34.502L17.584 28H24v8h-9.928z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.637 4.092-5.748 6.84-10.303 6.84c-6.793 0-12.3-5.507-12.3-12.3s5.507-12.3 12.3-12.3c3.181 0 6.173 1.258 8.41 3.5l5.657-5.657C36.00 6.234 30.417 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        <span>Accedi con Google</span>
      </button>

      <button
        onClick={handleFacebookLogin}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition duration-150 shadow-lg disabled:opacity-50"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.708 9.324 8.544 10.942V14.12h-2.909V10.7h2.909V7.994c0-2.846 1.737-4.401 4.298-4.401c1.229 0 2.288.092 2.593.133v3.016h-1.782c-1.396 0-1.666.666-1.666 1.635v2.103h3.398l-.547 3.42h-2.851V23.003C18.292 21.324 22 17.084 22 12C22 5.373 17.042 0 12 0z"/>
        </svg>
        <span>Accedi con Facebook</span>
      </button>
      
      <p className="text-center text-gray-500 text-xs mt-3 px-2"> 
          Registrandoti accetti le nostre <a href="#" className="text-green-400 hover:text-green-300 underline">condizioni di uso</a> e la <a href="#" className="text-green-400 hover:text-green-300 underline">politica sulla privacy</a>.
      </p>
    </div>
  );
};

// 3. Main App Component (Cambia il componente montato)
export default function App() {
  const [session, setSession] = useState(null);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null); 

  // 1. Initialize Supabase Client
  useEffect(() => {
    
    try {
      // Crea il client Supabase
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      setSupabaseClient(client);

      // 2. Set up Auth Listener
      client.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setLoading(false);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setLoading(false);
      });
      
      // Cleanup function
      return () => {
        subscription.unsubscribe();
      };

    } catch (error) {
      console.error("Errore nell'inizializzazione di Supabase:", error);
      setInitError(`Errore durante l'inizializzazione del client Supabase: ${error.message}`);
      setLoading(false);
    }
    
  }, []); // Esegui solo una volta

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center w-full bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
          <div className="animate-pulse text-green-500 text-lg">
            Attendere. Inizializzazione App...
          </div>
        </div>
      </div>
    );
  }

  // Gestione dell'errore di inizializzazione 
  if (initError) {
     return (
      <div className="min-h-screen flex items-center justify-center w-full bg-gray-900">
        <div className="w-full max-w-md bg-red-800 p-8 rounded-xl shadow-2xl text-white text-center">
          <h1 className="text-2xl font-bold mb-4">ERRORE DI AVVIO CRITICO</h1>
          <p className="mb-4">{initError}</p>
          <p className="mt-4 text-sm font-mono border-t border-red-500 pt-3">
            Controlla la console per maggiori dettagli sull'errore di connessione a Supabase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gray-900 p-4">
      {session ? (
        // CAMBIATO: Monta MatchManager al posto di TodoList
        <MatchManager session={session} supabaseClient={supabaseClient} />
      ) : (
        <AuthComponent supabaseClient={supabaseClient} />
      )}
    </div>
  );
}
