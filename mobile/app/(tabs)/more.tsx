import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  Calendar,
  Sliders,
  Laptop,
  Moon,
  Compass,
  Settings,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard } from '../../theme/components';

export default function MoreScreen() {
  const router = useRouter();

  const menuItems = [
    { title: 'Bienestar y Entorno', desc: 'Estrés, respiración guiada, ruido y lux', icon: Heart, route: '/wellbeing' },
    { title: 'Historial y Tendencias', desc: 'Resumen semanal y comparativa de 4 semanas', icon: Calendar, route: '/history' },
    { title: 'Reglas de Avisos', desc: 'Frecuencia, horario de silencio y prioridades', icon: Sliders, route: '/rules' },
    { title: 'Dispositivos y Enlace', desc: 'Estado del reloj y emparejado del agente PC', icon: Laptop, route: '/devices' },
    { title: 'Registro de Sueño', desc: 'Historial de descanso y ajuste de cafeína', icon: Moon, route: '/sleep' },
    { title: 'Calibración de Muñeca', desc: 'Asistente de postura neutral y tecleo (30s)', icon: Compass, route: '/calibration' },
    { title: 'Ajustes y Privacidad', desc: 'Jornada, exportar y borrar datos, versión', icon: Settings, route: '/settings' },
    { title: 'Guía de Bienvenida', desc: 'Principios de privacidad y uso de la app', icon: HelpCircle, route: '/onboarding' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Módulos Complementarios</Text>
      {menuItems.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <NeuCard
            key={idx}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconWell}>
                <IconComponent size={20} color={Colors.accent} strokeWidth={1.75} />
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
          </NeuCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
});
