import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { wsClient } from '../services/api';
import { Colors } from '../theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    wsClient.connect();
    const unsubscribe = wsClient.subscribe((msg) => {
      if (msg.type === 'energy_update' || msg.type === 'alert' || msg.type === 'focus_state') {
        queryClient.invalidateQueries();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.surface },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="wellbeing" options={{ title: 'Bienestar' }} />
          <Stack.Screen name="history" options={{ title: 'Historial y Tendencias' }} />
          <Stack.Screen name="rules" options={{ title: 'Reglas de Avisos' }} />
          <Stack.Screen name="devices" options={{ title: 'Dispositivos' }} />
          <Stack.Screen name="sleep" options={{ title: 'Registro de Sueño' }} />
          <Stack.Screen name="calibration" options={{ title: 'Calibración de Muñeca' }} />
          <Stack.Screen name="settings" options={{ title: 'Ajustes y Privacidad' }} />
          <Stack.Screen name="onboarding" options={{ title: 'Bienvenido a OfficeCore' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}