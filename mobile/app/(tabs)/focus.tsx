import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Play, CheckCircle, Clock, Zap, PauseCircle } from 'lucide-react-native';
import { api } from '../../services/api';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../../theme/components';

export default function FocusScreen() {
  const queryClient = useQueryClient();
  const [selectedDuration, setSelectedDuration] = useState<number>(25);

  const { data: focusData, isLoading } = useQuery({
    queryKey: ['focusSessions'],
    queryFn: () => api.getFocusSessions(),
  });

  const startMutation = useMutation({
    mutationFn: (min: number) => api.startFocusSession(min),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusSessions'] });
      Alert.alert('Modo Foco Iniciado', `Sesión de ${selectedDuration} min activa. Los avisos no urgentes se han diferido.`);
    },
  });

  const finishMutation = useMutation({
    mutationFn: (id: number) => api.finishFocusSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusSessions'] });
      Alert.alert('Sesión Completada', '¡Bien hecho! Tómate 20 segundos para relajar la vista.');
    },
  });

  const sessions = focusData?.sessions || [];
  const activeSession = sessions.find((s: any) => !s.end_time);
  const totalMin = focusData?.totalMinutes || 0;
  const avgQuality = sessions.length
    ? Math.round(sessions.reduce((acc: number, s: any) => acc + (s.quality_score || 85), 0) / sessions.length)
    : 90;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Active Session Card or Quick Start */}
      {activeSession ? (
        <NeuCard style={styles.activeFocusCard}>
          <View style={styles.activeHeader}>
            <Zap size={22} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.activeTitle}>Sesión de Foco Activa</Text>
          </View>
          <Text style={styles.activeTimer}>{activeSession.planned_min} min planeados</Text>
          <Text style={styles.activeSub}>Iniciado: {activeSession.start_time?.substring(11, 16)} hrs</Text>
          <NeuButton
            style={styles.finishBtn}
            textStyle={{ color: Colors.bandAmber }}
            onPress={() => finishMutation.mutate(activeSession.id)}
          >
            Terminar Sesión
          </NeuButton>
        </NeuCard>
      ) : (
        <NeuCard style={styles.startCard}>
          <Text style={styles.startTitle}>Iniciar Bloque de Foco</Text>
          <Text style={styles.startSub}>Silencia avisos y activa la política de flujo profundo.</Text>

          {/* Duration Selector Pills */}
          <View style={styles.pillsRow}>
            {[15, 25, 45, 60, 90].map((d) => (
              <NeuButton
                key={d}
                active={selectedDuration === d}
                style={[styles.pillBtn, selectedDuration === d && styles.pillActive]}
                onPress={() => setSelectedDuration(d)}
              >
                {`${d}m`}
              </NeuButton>
            ))}
          </View>

          <NeuPrimaryButton
            title={`Iniciar ${selectedDuration} min`}
            onPress={() => startMutation.mutate(selectedDuration)}
          />
        </NeuCard>
      )}

      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <NeuCard style={styles.statCard}>
          <Clock size={18} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.statValue}>{totalMin} m</Text>
          <Text style={styles.statLabel}>Tiempo Total</Text>
        </NeuCard>

        <NeuCard style={styles.statCard}>
          <CheckCircle size={18} color={Colors.bandGreen} strokeWidth={2} />
          <Text style={styles.statValue}>{avgQuality}%</Text>
          <Text style={styles.statLabel}>Calidad Promedio</Text>
        </NeuCard>

        <NeuCard style={styles.statCard}>
          <Target size={18} color={Colors.bandAmber} strokeWidth={2} />
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Bloques Hoy</Text>
        </NeuCard>
      </View>

      {/* Focus Sessions List */}
      <Text style={styles.sectionHeading}>Sesiones Registradas</Text>
      {sessions.length === 0 ? (
        <NeuCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay bloques de foco registrados hoy.</Text>
        </NeuCard>
      ) : (
        sessions.map((s: any) => (
          <NeuCard key={s.id} style={styles.sessionItem}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTime}>
                {s.start_time?.substring(11, 16)} {s.end_time ? `– ${s.end_time?.substring(11, 16)}` : '(En curso)'}
              </Text>
              <Text style={styles.sessionQuality}>Calidad: {s.quality_score}%</Text>
            </View>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionDetails}>
                Duración: {s.planned_min} min • Interrupciones: {s.interruptions || 0} • {s.source === 'auto' ? 'Detectado por PC' : 'Manual'}
              </Text>
            </View>
          </NeuCard>
        ))
      )}
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
  activeFocusCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  activeTimer: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginVertical: 8,
  },
  activeSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  finishBtn: {
    paddingHorizontal: 24,
  },
  startCard: {
    marginBottom: Spacing.md,
  },
  startTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  startSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  pillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pillActive: {
    backgroundColor: Colors.surfaceDeep,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  sessionItem: {
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sessionQuality: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  sessionMeta: {
    marginTop: 2,
  },
  sessionDetails: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
