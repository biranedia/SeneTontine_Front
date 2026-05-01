// app/register.tsx
import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#2A1E0F',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
      >
        <View style={{
          backgroundColor: '#FFF8E5',
          width: '100%',
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          marginVertical: 20,
        }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={require('../assets/logo.png')}
              style={{ width: 60, height: 60 }}
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3E2F0B', marginTop: 10 }}>
              SèneTontine
            </Text>
            <Text style={{ color: '#3E2F0B', marginTop: 5 }}>
              Épargnez. Ensemble. En confiance.
            </Text>
          </View>

          <Text style={{ fontSize: 18, fontWeight: '600', color: '#3E2F0B', marginBottom: 4 }}>
            Créer un compte 🤝
          </Text>
          <Text style={{ color: '#7A6030', marginBottom: 10, fontSize: 13 }}>
            Rejoignez votre communauté d'épargne
          </Text>

          {/* Champs */}
          <TextInput
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            style={{ marginVertical: 8, backgroundColor: '#FFF8E5' }}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ marginVertical: 8, backgroundColor: '#FFF8E5' }}
            left={<TextInput.Icon icon="phone" />}
          />

          <TextInput
            label="Adresse e-mail (optionnel)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginVertical: 8, backgroundColor: '#FFF8E5' }}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ marginVertical: 8, backgroundColor: '#FFF8E5' }}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TextInput
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            style={{ marginVertical: 8, backgroundColor: '#FFF8E5' }}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirm ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirm(!showConfirm)}
              />
            }
          />

          {/* Bouton principal */}
          <Button
            mode="contained"
            buttonColor="#D2B95B"
            textColor="#2A1E0F"
            style={{ marginVertical: 14 }}
            onPress={() => router.push('/dashboard')}  // ← changé
             >
           Créer mon compte →
          </Button>

          {/* Séparateur */}
          <Text style={{ textAlign: 'center', marginVertical: 5, color: '#7A6030', fontSize: 12 }}>
            OU INSCRIPTION RAPIDE PAR
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <IconButton icon="facebook" size={30} onPress={() => {}} />
            <IconButton icon="google" size={30} onPress={() => {}} />
          </View>

          {/* Retour login */}
          <Button
            mode="outlined"
            buttonColor="#FFF8E5"
            textColor="#2A1E0F"
            style={{ marginTop: 10 }}
            onPress={() => router.back()}
          >
            Déjà un compte ? Se connecter
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}