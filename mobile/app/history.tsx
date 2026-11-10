import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard } from '../theme/components';

export default function HistoryScreen() {
  const { data: weekData } = useQuery({
    queryKey: ['historyWeek'],
    queryFn: api.getHistoryWeek,
  });

  const { data: trendsData } = useQuery({
    queryKey: ['historyTrends'],
    queryFn: () => api.getHistoryTrends(4),
  });

  const summaries = weekData?.summaries || [];
  const focus = weekData?.focus || [];
  const sleep = weekData?.sleep || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Resumen Semanal de Alex Rivera</Text>
      <Text style={styles.subHeading}>Evolución de hábitos, descanso y rendimiento</Text>

      {/* Week Highlights */}
      <View style={styles.highlightsRow}>
        <NeuCard style={styles.highlightCard}>
          <Award size={18} color={Colors.bandGreen} strokeWidth={2} />
          <Text style={styles.highlightVal}>L4 (Mejor)</Text>
          <Text style={styles.highlightLabel}>4 bloques foco, postura 88%</Text>
        </NeuCard>

        <NeuCard style={styles.highlightCard}>
          <AlertCircle size={18} color={Colors.bandAmber} strokeWidth={2} />
          <Text style={styles.highlightVal}>L3 (Reto)</Text>
          <Text style={styles.highlightLabel}>Insomnio tras café 16:10</Text>
        </NeuCard>
      </View>

      {/* Daily Summaries from Seed/AI */}
      <Text style={styles.sectionHeading}>Días de la Semana</Text>
      {summaries.map((s: any, idx: number) => (
        <NeuCard key={idx} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{s.date}</Text>
            <Text style={styles.dayStoryBadge}>{s.metrics?.storyKey || 'Jornada'}</Text>
          </View>
          <Text style={styles.dayResumen}>{s.ai?.resumen}</Text>
          <View style={styles.metricsRow}>
            <Text style={styles.metricItem}>Foco: {s.metrics?.focusBlocksCount || 2} bloques</Text>
            <Text style={styles.metricItem}>Sueño: {Math.round((s.metrics?.sleepMin || 420) / 60)}h</Text>
            <Text style={styles.metricItem}>Cafeína: {s.metrics?.caffeineMg || 95} mg</Text>
          </View>
        </NeuCard>
      ))}

      {/* 4-Week Trends */}
      <Text style={styles.sectionHeading}>Tendencias de 4 Semanas</Text>
      <NeuCard style={styles.trendsCard}>
        <View style={styles.trendRow}>
          <TrendingUp size={18} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.trendTitle}>Consistencia de Foco y Descanso</Text>
        </View>
        <Text style={styles.trendText}>
          Tus mejores días de foco coinciden con noches de más de 7 horas de sueño y con el último café antes de las 14:30.
        </Text>
      </NeuCard>
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subHeading: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  highlightCard: {
    flex: 1,
    padding: Spacing.md,
  },
  highlightVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  dayCard: {
    marginBottom: 10,
    padding: Spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayStoryBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    backgroundColor: Colors.surfaceDeep,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  dayResumen: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceDeep,
    paddingTop: 6,
  },
  metricItem: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  trendsCard: {
    padding: Spacing.md,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  trendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
