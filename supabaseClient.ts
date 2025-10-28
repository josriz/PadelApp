// C:\PadelApp\supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Le tue credenziali Supabase (lasciate come richiesto)
const SUPABASE_URL = 'https://lshvnwryhqlvjhxqscla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaHZud3J5aHFsdmpoeHFzY2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTc0MzcsImV4cCI6MjA3Njg3MzQzN30.wKxHKzbcWAH2WgdkuQ6pcRS82gMVMnWZx1GWpP2Kimg';

// ** CONFIGURAZIONE FINALE: Nessuno storage qui. **
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: undefined, // DEVE ESSERE undefined qui!
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});