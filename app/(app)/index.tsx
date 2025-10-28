import { useAuth } from '@context/AuthContext';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const HomeMain = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Benvenuto!</Text>
      <Text style={styles.subtitle}>Sei loggato come: {user?.email}</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={handleLogout} color="#DB4437" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1E3A8A' },
  subtitle: { fontSize: 16, color: '#374151', textAlign: 'center' }
});

export default HomeMain;
