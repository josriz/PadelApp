// app/(app)/home.tsx
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // CORREZIONE 1: Risolve l'errore di tipizzazione di Expo Router
      router.replace('/(auth)'); // Naviga alla radice del gruppo (che è index.tsx)
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CORREZIONE 2: Gestisce il caso in cui user.email sia null/undefined */}
      <Text style={styles.welcome}>Benvenuto, {user.email ?? 'Utente'}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A' },
  loadingText: { color: '#FBBF24', fontSize: 20 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 20 },
  welcome: { fontSize: 28, fontWeight: 'bold', color: '#FBBF24', marginBottom: 40, textAlign: 'center' },
  logoutBtn: { backgroundColor: '#FBBF24', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 8 },
  logoutText: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
});