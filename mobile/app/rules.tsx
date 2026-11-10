import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Bell, Moon, Shield } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuToggle, NeuButton } from '../theme/components';

const RULE_TITLES: Record<string, string> = {
  posture: 'Postura de Muñeca',
  eye_break: 'Descanso Ocular 20-20-20',
  water: 'Recordatorio de Hidratación',
  stand: 'Pausa Activa (Ponerse de pie)',
  caffeine_limit: 'Alerta de Límite de Cafeína',
  stress: 'Detección de Estrés y Respiración',
};

export default function RulesScreen() {
  const queryClient = useQueryClient();

  const { data: rulesData } = useQuery({
    queryKey: ['alertRules'],
    queryFn: api.getRules,
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: any }) => api.updateRule(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    },
  });

  const rules = rulesData?.rules || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Política de Interrupciones</Text>
      <Text style={styles.subHeading}>
        OfficeCore decide cuándo y cómo interrumpirte para proteger tu concentración.
      </Text>

      {/* Global Policy Principles Card */}
      <NeuCard style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Shield size={18} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.infoTitle}>Reglas no negociables de entrega</Text>
        </View>
        <Text style={styles.infoBody}>
          1. En foco profundo solo pasan avisos urgentes.{'\n'}
          2. Los avisos diferidos esperan una pausa natural al teclear (≥20s de inactividad).{'\n'}
          3. Máximo 4 avisos por hora en el reloj.
        </Text>
      </NeuCard>

      {/* Rules Toggles */}
      <Text style={styles.sectionHeading}>Módulos y Frecuencia</Text>
      {rules.map((r: any) => (
        <NeuCard key={r.type} style={styles.ruleCard}>
          <View style={styles.ruleTop}>
            <View style={styles.ruleTitleWrapper}>
              <Bell size={16} color={r.enabled ? Colors.accent : Colors.textMuted} strokeWidth={2} />
              <Text style={styles.ruleTitle}>{RULE_TITLES[r.type] || r.type}</Text>
            </View>
            <NeuToggle
              value={!!r.enabled}
              onValueChange={(val) => updateMutation.mutate({ type: r.type, data: { enabled: val } })}
            />
          </View>
          <View style={styles.ruleBottom}>
            <Text style={styles.ruleMeta}>
              Intensidad: <Text style={styles.bold}>{r.intensity}</Text> • Máx: <Text style={styles.bold}>{r.max_per_hour}/hora</Text>
            </Text>
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
  infoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  ruleCard: {
    marginBottom: 10,
    padding: Spacing.md,
  },
  ruleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ruleBottom: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceDeep,
    paddingTop: 6,
  },
  ruleMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
