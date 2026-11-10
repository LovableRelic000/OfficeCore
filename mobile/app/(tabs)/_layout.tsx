import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Hand, Target, Coffee, Sparkles, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.textPrimary,
          fontSize: 18,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: Colors.shadowDark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'OfficeCore',
          tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="posture"
        options={{
          title: 'Postura',
          headerTitle: 'Salud de Muñeca',
          tabBarIcon: ({ color }) => <Hand size={20} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Foco',
          headerTitle: 'Protector de Flujo',
          tabBarIcon: ({ color }) => <Target size={20} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="caffeine"
        options={{
          title: 'Cafeína',
          headerTitle: 'Reloj de Cafeína',
          tabBarIcon: ({ color }) => <Coffee size={20} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Asistente',
          headerTitle: 'Asistente IA',
          tabBarIcon: ({ color }) => <Sparkles size={20} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          headerTitle: 'Módulos y Ajustes',
          tabBarIcon: ({ color }) => <MoreHorizontal size={20} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}
