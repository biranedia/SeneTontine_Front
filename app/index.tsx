import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#2A1E0F',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <View style={{
        backgroundColor: '#FFF8E5',
        width: '100%',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
      }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 60, height: 60 }}
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3E2F0B', marginTop: 10 }}>
            SèneTontine
          </Text>
          <Text style={{ color: '#3E2F0B', marginTop: 5 }}>Épargnez. Ensemble. En confiance.</Text>
        </View>

        <Text>Bon retour 👋</Text>

        <TextInput
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={{ marginVertical: 10, backgroundColor: '#FFF8E5' }}
        />
        <TextInput
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={{ marginVertical: 10, backgroundColor: '#FFF8E5' }}
        />

        <Button
        mode="contained"
        buttonColor="#D2B95B"
        textColor="#2A1E0F"
        style={{ marginVertical: 10 }}
        onPress={() => router.push('/dashboard')}  // ← changé
         >
        Se connecter →
        </Button>

        <Text style={{ textAlign: 'center', marginVertical: 5 }}>OU CONNEXION RAPIDE PAR</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <IconButton icon="facebook" size={30} onPress={() => {}} />
          <IconButton icon="google" size={30} onPress={() => {}} />
        </View>

        <Button
          mode="outlined"
          buttonColor="#FFF8E5"
          textColor="#2A1E0F"
          style={{ marginTop: 20 }}
          onPress={() => router.push('/register')}  // Expo Router navigation
        >
          Créer un compte
        </Button>
      </View>
    </View>
  );
}