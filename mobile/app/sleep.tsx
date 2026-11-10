import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Star, Clock, CheckCircle } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../theme/components';

export default function SleepScreen() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(4);

  const { data: sleepData } = useQuery({
    queryKey: ['sleepWeek'],
    queryFn: api.getSleepWeek,
  });

  const sleepMutation = useMutation({
    mutationFn: () => {
      const durationMin = hours * 60;
      return api.logSleep({
        bedtime: '23:30:00',
        wake: '07:00:00',
        duration_min: durationMin,
        quality,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleepWeek'] });
      queryClient.invalidateQueries({ queryKey: ['caffeineToday'] });
      Alert.alert('Registro Guardado', 'Se ha actualizado tu historial y ajustado la hora límite de cafeína.');
    },
  });

  const logs = sleepData?.logs || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Sleep Log Card */}
      <NeuCard style={styles.logCard}>
        <View style={styles.cardHeader}>
          <Moon size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.cardTitle}>¿Cómo dormiste anoche?</Text>
        </View>
        <Text style={styles.cardDesc}>
          El descanso regula directamente tu presupuesto de energía y la hora límite de tu último café.
        </Text>

        {/* Hours Selector */}
        <Text style={styles.label}>Horas dormidas: {hours} h</Text>
        <View style={styles.selectorRow}>
          {[5, 6, 7, 8, 9].map((h) => (
            <NeuButton
              key={h}
              active={hours === h}
              style={[styles.smallBtn, hours === h && styles.btnActive]}
              onPress={() => setHours(h)}
            >
              {`${h}h`}
            </NeuButton>
          ))}
        </View>

        {/* Quality Selector */}
        <Text style={styles.label}>Calidad del descanso (1 - 5):</Text>
        <View style={styles.selectorRow}>
          {[1, 2, 3, 4, 5].map((q) => (
            <NeuButton
              key={q}
              active={quality === q}
              style={[styles.smallBtn, quality === q && styles.btnActive]}
              onPress={() => setQuality(q)}
            >
              <View style={styles.starRow}>
                <Text style={[styles.qText, quality === q && { color: Colors.accent }]}>{q}</Text>
                <Star size={12} color={quality === q ? Colors.accent : Colors.textMuted} fill={quality === q ? Colors.accent : 'none'} />
              </View>
            </NeuButton>
          ))}
        </View>

        <NeuPrimaryButton
          title="Guardar Registro de Sueño"
          onPress={() => sleepMutation.mutate()}
        />
      </NeuCard>

      {/* Week Overview */}
      <Text style={styles.sectionHeading}>Historial de la Semana</Text>
      {logs.map((l: any) => (
        <NeuCard key={l.id} style={styles.historyCard}>
          <View style={styles.histLeft}>
            <Clock size={16} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.histDate}>{l.date}</Text>
          </View>
          <View style={styles.histRight}>
            <Text style={styles.histDuration}>{Math.floor(l.duration_min / 60)}h {l.duration_min % 60}m</Text>
            <View style={styles.histStarRow}>
              <Star size={12} color={Colors.bandAmber} fill={Colors.bandAmber} />
              <Text style={styles.histQuality}>{l.quality}/5</Text>
            </View>
          </View>
        </NeuCard>
      ))}
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
  logCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnActive: {
    backgroundColor: Colors.surfaceDeep,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  qText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  histLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  histRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  histDuration: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  histStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  histQuality: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

