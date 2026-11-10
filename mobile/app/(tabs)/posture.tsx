import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Hand, Sliders, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import { api } from '../../services/api';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../../theme/components';

export default function PostureScreen() {
  const router = useRouter();

  const { data: postureDay } = useQuery({
    queryKey: ['postureToday'],
    queryFn: () => api.getPostureDay(),
  });

  const { data: postureWeek } = useQuery({
    queryKey: ['postureWeek'],
    queryFn: api.getPostureWeek,
  });

  const { data: calibration } = useQuery({
    queryKey: ['postureCalibration'],
    queryFn: api.getPostureCalibration,
  });

  const bands = postureDay?.bands || { greenPct: 84, amberPct: 12, redPct: 4, amberMinutes: 6, redMinutes: 2 };
  const debt = postureDay?.ergonomicDebtMinutes ?? 10;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Summary Card */}
      <NeuCard style={styles.debtCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.debtLabel}>DEUDA ERGONÓMICA DIARIA</Text>
            <Text style={styles.debtValue}>{debt} min</Text>
          </View>
          <View style={[styles.statusIconBadge, { backgroundColor: debt > 25 ? Colors.bandRed : (debt > 15 ? Colors.bandAmber : Colors.bandGreen) }]}>
            <Hand size={22} color="#ffffff" strokeWidth={2} />
          </View>
        </View>

        <Text style={styles.debtExplanation}>
          Calculado a partir de minutos en desviación ámbar (×1) y roja (×2). Mantener la deuda por debajo de 25 min previene dolor de túnel carpiano.
        </Text>

        {/* Bands Distribution */}
        <View style={styles.bandBarsContainer}>
          <View style={styles.bandRow}>
            <Text style={styles.bandName}>Verde (&lt; 15° Neutral)</Text>
            <Text style={styles.bandPct}>{bands.greenPct}%</Text>
          </View>
          <View style={styles.bandTrack}>
            <View style={[styles.bandFill, { width: `${bands.greenPct}%`, backgroundColor: Colors.bandGreen }]} />
          </View>

          <View style={styles.bandRow}>
            <Text style={styles.bandName}>Ámbar (15°–25° Tensión)</Text>
            <Text style={styles.bandPct}>{bands.amberPct}% ({bands.amberMinutes} min)</Text>
          </View>
          <View style={styles.bandTrack}>
            <View style={[styles.bandFill, { width: `${bands.amberPct}%`, backgroundColor: Colors.bandAmber }]} />
          </View>

          <View style={styles.bandRow}>
            <Text style={styles.bandName}>Rojo (&gt; 25° Crítico)</Text>
            <Text style={styles.bandPct}>{bands.redPct}% ({bands.redMinutes} min)</Text>
          </View>
          <View style={styles.bandTrack}>
            <View style={[styles.bandFill, { width: `${bands.redPct}%`, backgroundColor: Colors.bandRed }]} />
          </View>
        </View>
      </NeuCard>

      {/* Calibration Status Card */}
      <NeuCard style={styles.calibCard}>
        <View style={styles.calibHeader}>
          <Sliders size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.calibTitle}>Calibración de Muñeca (30s)</Text>
        </View>
        <Text style={styles.calibText}>
          {calibration?.calibrated
            ? 'Tu reloj está calibrado con tu ángulo neutral de referencia y firma de tecleo.'
            : 'Aún no has calibrado tu postura de hoy. Teclea 30 segundos en tu mejor posición para fijar la referencia.'}
        </Text>
        <NeuPrimaryButton
          title={calibration?.calibrated ? 'Recalibrar Muñeca' : 'Iniciar Calibración (30s)'}
          onPress={() => router.push('/calibration')}
        />
      </NeuCard>

      {/* Weekly History */}
      <Text style={styles.sectionHeading}>Tendencia Semanal de Deuda</Text>
      <NeuCard style={styles.weekCard}>
        {(postureWeek?.dailyTrends || []).map((day: any, idx: number) => (
          <View key={idx} style={styles.dayRow}>
            <Text style={styles.dayDate}>{day.date}</Text>
            <View style={styles.dayProgressWrapper}>
              <View style={[styles.dayBar, { width: `${Math.min(100, day.debtMinutes * 2)}%`, backgroundColor: day.debtMinutes > 25 ? Colors.bandRed : Colors.bandAmber }]} />
            </View>
            <Text style={styles.dayDebtText}>{day.debtMinutes}m</Text>
          </View>
        ))}
      </NeuCard>

      {/* Technical Footnote as per plan.MD */}
      <View style={styles.footnote}>
        <Info size={14} color={Colors.textMuted} strokeWidth={1.75} />
        <Text style={styles.footnoteText}>
          Medición basada en la orientación del Galaxy Watch4 respecto a la gravedad y microvibración de tecleo. No sustituye valoración médica.
        </Text>
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
  debtCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  debtLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.1,
  },
  debtValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statusIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtExplanation: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  bandBarsContainer: {
    gap: 8,
  },
  bandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bandName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  bandPct: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bandTrack: {
    height: 8,
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  bandFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  calibCard: {
    marginBottom: Spacing.md,
  },
  calibHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calibTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  calibText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  weekCard: {
    marginBottom: Spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceDeep,
  },
  dayDate: {
    width: 85,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayProgressWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.pill,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  dayBar: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  dayDebtText: {
    width: 35,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  footnoteText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
