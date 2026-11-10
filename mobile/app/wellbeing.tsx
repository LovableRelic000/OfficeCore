import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Heart, Wind, Volume2, Sun, Eye, Droplet, UserCheck } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard } from '../theme/components';

export default function WellbeingScreen() {
  const { data: stressData } = useQuery({
    queryKey: ['stressEvents'],
    queryFn: () => api.getStressEvents(),
  });

  const { data: breaksData } = useQuery({
    queryKey: ['breaksToday'],
    queryFn: () => api.getBreaksDay(),
  });

  const { data: envData } = useQuery({
    queryKey: ['envToday'],
    queryFn: () => api.getEnvironmentDay(),
  });

  const stressEvents = stressData?.events || [];
  const triggers = stressData?.triggersSummary || { 'Reunión': 2, 'Mensaje': 1, 'Código/bug': 1 };
  const breaks = breaksData?.summary || { eye: 2, water: 3, waterTotalMl: 650, stand: 2, stretch: 1 };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stress & Heart Map */}
      <Text style={styles.heading}>Eventos de Estrés y Pulso</Text>
      <NeuCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={20} color={Colors.bandRed} strokeWidth={2} />
          <Text style={styles.cardTitle}>Picos de Pulso en Reposo</Text>
        </View>
        <Text style={styles.cardDesc}>
          Detectados cuando el pulso supera la línea base en +20 bpm sin movimiento activo sostenido.
        </Text>

        <View style={styles.triggersContainer}>
          <Text style={styles.subHeading}>Detonantes Reportados:</Text>
          <View style={styles.triggersList}>
            {Object.entries(triggers).map(([tag, count], idx) => (
              <View key={idx} style={styles.triggerBadge}>
                <Text style={styles.triggerText}>{tag}: {count as number}</Text>
              </View>
            ))}
          </View>
        </View>
      </NeuCard>

      {/* Pausas Inteligentes */}
      <Text style={styles.heading}>Pausas Realizadas Hoy</Text>
      <View style={styles.breaksGrid}>
        <NeuCard style={styles.breakCard}>
          <Eye size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.breakCount}>{breaks.eye}</Text>
          <Text style={styles.breakLabel}>Descansos 20-20-20</Text>
        </NeuCard>

        <NeuCard style={styles.breakCard}>
          <Droplet size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.breakCount}>{breaks.waterTotalMl} ml</Text>
          <Text style={styles.breakLabel}>Agua ({breaks.water} tomas)</Text>
        </NeuCard>

        <NeuCard style={styles.breakCard}>
          <UserCheck size={20} color={Colors.bandGreen} strokeWidth={2} />
          <Text style={styles.breakCount}>{breaks.stand}</Text>
          <Text style={styles.breakLabel}>De pie / Estirar</Text>
        </NeuCard>

        <NeuCard style={styles.breakCard}>
          <Wind size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.breakCount}>2 ses.</Text>
          <Text style={styles.breakLabel}>Respiración 4-7-8</Text>
        </NeuCard>
      </View>

      {/* Entorno Físico */}
      <Text style={styles.heading}>Condiciones de Entorno</Text>
      <View style={styles.envRow}>
        <NeuCard style={styles.envCard}>
          <View style={styles.envHeader}>
            <Volume2 size={18} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.envTitle}>Ruido Ambiental</Text>
          </View>
          <Text style={styles.envValue}>{envData?.avgNoiseDb || 48} dB</Text>
          <Text style={styles.envSub}>Nivel confortable (&lt; 65 dB)</Text>
        </NeuCard>

        <NeuCard style={styles.envCard}>
          <View style={styles.envHeader}>
            <Sun size={18} color={Colors.bandAmber} strokeWidth={2} />
            <Text style={styles.envTitle}>Iluminación</Text>
          </View>
          <Text style={styles.envValue}>{envData?.avgLux || 380} lux</Text>
          <Text style={styles.envSub}>Óptimo para pantalla</Text>
        </NeuCard>
      </View>
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  triggersContainer: {
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.md,
    padding: 10,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  triggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerBadge: {
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breaksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  breakCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  breakCount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  breakLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  envRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  envCard: {
    flex: 1,
    padding: Spacing.md,
  },
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  envTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  envValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  envSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
