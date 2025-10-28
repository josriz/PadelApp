import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>👤 Il Mio Profilo</Text>
    <Text style={styles.subtitle}>Qui gestirai i tuoi dati e le tue impostazioni.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1E3A8A', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#4B5563' 
  }
});

export default ProfileScreen;
