import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Watch, ShieldCheck, Heart, Coffee, Target, Hand, Sparkles } from 'lucide-react-native';
import { api } from '../../services/api';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard, NeuProgressRing, NeuButton } from '../../theme/components';

export default function DashboardScreen() {
  const router = useRouter();

  const { data: energy, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['energyNow'],
    queryFn: api.getEnergyNow,
  });

  const { data: posture } = useQuery({
    queryKey: ['postureToday'],
    queryFn: () => api.getPostureDay(),
  });

  const { data: focus } = useQuery({
    queryKey: ['focusToday'],
    queryFn: () => api.getFocusSessions(),
  });

  const { data: breaks } = useQuery({
    queryKey: ['breaksToday'],
    queryFn: () => api.getBreaksDay(),
  });

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: api.getDevices,
  });

  const watchDevice = devices?.devices?.find((d: any) => d.type === 'watch');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={() => { refetch(); }} />}
    >
      {/* Device Status Bar */}
      <View style={styles.deviceRow}>
        <View style={styles.deviceBadge}>
          <Watch size={15} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.deviceText}>
            {watchDevice ? `${watchDevice.name} • ${watchDevice.battery_pct}%` : 'Galaxy Watch4 • Conectado'}
          </Text>
        </View>
        <View style={styles.deviceBadge}>
          <ShieldCheck size={15} color={Colors.bandGreen} strokeWidth={2} />
          <Text style={styles.deviceText}>Privacidad Activa</Text>
        </View>
      </View>

      {/* Main Energy Ring Card */}
      <NeuCard style={styles.ringCard}>
        <Text style={styles.sectionTitle}>Presupuesto de Energía</Text>
        <Text style={styles.sectionSubtitle}>Balance físico, mental y de cafeína en tiempo real</Text>

        <View style={styles.ringWrapper}>
          <NeuProgressRing
            physical={energy?.physical || 85}
            mental={energy?.mental || 80}
            caffeine={energy?.caffeineLoad || 25}
            overall={energy?.overall || 82}
            size={220}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.bandGreen }]} />
            <Text style={styles.legendLabel}>Física {energy?.physical || 85}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={styles.legendLabel}>Mental {energy?.mental || 80}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.bandAmber }]} />
            <Text style={styles.legendLabel}>Cafeína {energy?.caffeineLoad || 25}%</Text>
          </View>
        </View>
      </NeuCard>

      {/* Module Overview Cards Grid */}
      <Text style={styles.gridHeading}>Módulos Clave</Text>
      <View style={styles.gridRow}>
        {/* Postura */}
        <NeuCard style={styles.moduleCard} onPress={() => router.push('/(tabs)/posture')}>
          <View style={styles.moduleHeader}>
            <Hand size={18} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.moduleTitle}>Postura</Text>
          </View>
          <Text style={styles.moduleValue}>{posture?.ergonomicDebtMinutes || 0} min</Text>
          <Text style={styles.moduleSubtext}>Deuda ergonómica hoy</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: `${posture?.bands?.greenPct || 85}%`, backgroundColor: Colors.bandGreen }]} />
          </View>
        </NeuCard>

        {/* Foco */}
        <NeuCard style={styles.moduleCard} onPress={() => router.push('/(tabs)/focus')}>
          <View style={styles.moduleHeader}>
            <Target size={18} color={Colors.accent} strokeWidth={2} />
            <Text style={styles.moduleTitle}>Foco</Text>
          </View>
          <Text style={styles.moduleValue}>{focus?.totalMinutes || 105} min</Text>
          <Text style={styles.moduleSubtext}>{focus?.totalSessions || 2} bloques completados</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: '75%', backgroundColor: Colors.accent }]} />
          </View>
        </NeuCard>
      </View>

      <View style={styles.gridRow}>
        {/* Cafeína */}
        <NeuCard style={styles.moduleCard} onPress={() => router.push('/(tabs)/caffeine')}>
          <View style={styles.moduleHeader}>
            <Coffee size={18} color={Colors.bandAmber} strokeWidth={2} />
            <Text style={styles.moduleTitle}>Cafeína</Text>
          </View>
          <Text style={styles.moduleValue}>{energy?.currentCaffeineMg || 95} mg</Text>
          <Text style={styles.moduleSubtext}>Corte: {energy?.cutoffTime || '15:30'} hrs</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: `${Math.min(100, (energy?.currentCaffeineMg || 95) / 4)}%`, backgroundColor: Colors.bandAmber }]} />
          </View>
        </NeuCard>

        {/* Bienestar */}
        <NeuCard style={styles.moduleCard} onPress={() => router.push('/wellbeing')}>
          <View style={styles.moduleHeader}>
            <Heart size={18} color={Colors.bandRed} strokeWidth={2} />
            <Text style={styles.moduleTitle}>Bienestar</Text>
          </View>
          <Text style={styles.moduleValue}>{breaks?.totalCompleted || 4} pausas</Text>
          <Text style={styles.moduleSubtext}>{breaks?.summary?.waterTotalMl || 450} ml de agua</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: '80%', backgroundColor: Colors.bandGreen }]} />
          </View>
        </NeuCard>
      </View>

      {/* AI Assistant Quick Card */}
      <NeuCard style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Sparkles size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.aiTitle}>Sugerencia del Asistente</Text>
        </View>
        <Text style={styles.aiBody}>
          Tu postura se mantuvo neutral el 88% del tiempo en la mañana. Recuerda espaciar tu próximo café antes de las {energy?.cutoffTime || '15:30'} para proteger tu sueño.
        </Text>
        <View style={styles.aiBtnContainer}>
          <NeuButton style={styles.aiBtn} onPress={() => router.push('/(tabs)/assistant')}>
            Abrir Asistente
          </NeuButton>
        </View>
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
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDeep,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    gap: 6,
  },
  deviceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  ringWrapper: {
    marginVertical: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  gridHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  moduleCard: {
    flex: 1,
    padding: Spacing.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  moduleValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  moduleSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  miniBar: {
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceDeep,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  aiCard: {
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  aiBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  aiBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  aiBtn: {
    alignSelf: 'center',
    minWidth: 180,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
});

