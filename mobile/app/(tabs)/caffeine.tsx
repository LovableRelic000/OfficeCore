import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { Coffee, Plus, Clock, Trash2, Moon, AlertCircle } from 'lucide-react-native';
import { api } from '../../services/api';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../../theme/components';

const DRINKS = [
  { name: 'Café americano', mg: 95, size: 'Mediano' },
  { name: 'Espresso', mg: 65, size: 'Sencillo' },
  { name: 'Té negro', mg: 47, size: 'Taza' },
  { name: 'Té verde', mg: 28, size: 'Taza' },
  { name: 'Bebida energética', mg: 80, size: 'Lata' },
];

export default function CaffeineScreen() {
  const queryClient = useQueryClient();
  const [selectedDrink, setSelectedDrink] = useState(DRINKS[0]);

  const { data: caffeineData } = useQuery({
    queryKey: ['caffeineToday'],
    queryFn: () => api.getCaffeineDay(),
  });

  const logMutation = useMutation({
    mutationFn: (d: typeof DRINKS[0]) => api.logCaffeine(d.name, d.size, d.mg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineToday'] });
      queryClient.invalidateQueries({ queryKey: ['energyNow'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCaffeine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineToday'] });
      queryClient.invalidateQueries({ queryKey: ['energyNow'] });
    },
  });

  const currentMg = caffeineData?.currentMg || 0;
  const limitMg = caffeineData?.limitMg || 400;
  const loadPct = caffeineData?.loadPct || 0;
  const cutoffTime = caffeineData?.cutoffTime || '15:30';
  const cutoffAdjusted = caffeineData?.cutoffAdjustedForSleep || false;
  const logs = caffeineData?.logs || [];
  const curve = caffeineData?.curve || [];

  // Generate SVG path for the curve
  const svgWidth = 320;
  const svgHeight = 120;
  let pathD = '';
  if (curve.length > 1) {
    const maxMg = Math.max(150, ...curve.map((p: any) => p.mg));
    const stepX = svgWidth / (curve.length - 1);
    pathD = curve.reduce((acc: string, pt: any, idx: number) => {
      const x = idx * stepX;
      const y = svgHeight - (pt.mg / maxMg) * (svgHeight - 20) - 10;
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Load and Cutoff Card */}
      <NeuCard style={styles.mainCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardSubtitle}>NIVEL ACTIVO EN SISTEMA</Text>
            <Text style={styles.currentValue}>{currentMg} mg</Text>
          </View>
          <View style={[styles.cutoffBadge, cutoffAdjusted && styles.cutoffAdjusted]}>
            <Clock size={16} color={cutoffAdjusted ? Colors.bandAmber : Colors.accent} strokeWidth={2} />
            <Text style={[styles.cutoffText, cutoffAdjusted && { color: Colors.bandAmber }]}>
              Corte: {cutoffTime} hrs
            </Text>
          </View>
        </View>

        {cutoffAdjusted && (
          <View style={styles.alertNotice}>
            <Moon size={14} color={Colors.bandAmber} strokeWidth={2} />
            <Text style={styles.alertNoticeText}>
              Hora límite adelantada 1 hora por descanso deficiente la noche previa.
            </Text>
          </View>
        )}

        {/* Progress Bar of Daily Limit */}
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Consumo frente al límite diario ({limitMg} mg):</Text>
          <Text style={styles.limitVal}>{loadPct}%</Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(100, loadPct)}%`, backgroundColor: loadPct > 80 ? Colors.bandAmber : Colors.bandGreen },
            ]}
          />
        </View>

        {/* Decay Curve SVG */}
        <Text style={styles.curveTitle}>Curva de decaimiento proyectada (vida media 5h)</Text>
        <View style={styles.svgWrapper}>
          <Svg width={svgWidth} height={svgHeight}>
            {/* Safe threshold horizontal dotted line at 30mg */}
            <Line
              x1="0"
              y1={svgHeight - (30 / 150) * (svgHeight - 20) - 10}
              x2={svgWidth}
              y2={svgHeight - (30 / 150) * (svgHeight - 20) - 10}
              stroke={Colors.bandGreen}
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            {pathD ? <Path d={pathD} stroke={Colors.accent} strokeWidth="2.5" fill="none" /> : null}
          </Svg>
          <Text style={styles.safeLineLabel}>-- Umbral de sueño (30 mg)</Text>
        </View>
      </NeuCard>

      {/* Quick Add Intake */}
      <Text style={styles.sectionHeading}>Registrar Toma</Text>
      <NeuCard style={styles.addCard}>
        <View style={styles.drinksGrid}>
          {DRINKS.map((d) => (
            <NeuButton
              key={d.name}
              active={selectedDrink.name === d.name}
              style={[styles.drinkBtn, selectedDrink.name === d.name && styles.drinkBtnActive]}
              onPress={() => setSelectedDrink(d)}
            >
              <Text style={styles.drinkBtnName}>{d.name}</Text>
              <Text style={styles.drinkBtnMg}>{d.mg} mg</Text>
            </NeuButton>
          ))}
        </View>
        <NeuPrimaryButton
          title={`Agregar ${selectedDrink.name} (+${selectedDrink.mg} mg)`}
          onPress={() => logMutation.mutate(selectedDrink)}
        />
      </NeuCard>

      {/* Intake Logs List */}
      <Text style={styles.sectionHeading}>Tomas de Hoy</Text>
      {logs.length === 0 ? (
        <NeuCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No has registrado bebidas con cafeína hoy.</Text>
        </NeuCard>
      ) : (
        logs.map((l: any) => (
          <NeuCard key={l.id} style={styles.logCard}>
            <View style={styles.logLeft}>
              <Coffee size={20} color={Colors.bandAmber} strokeWidth={2} />
              <View>
                <Text style={styles.logTitle}>{l.drink_type}</Text>
                <Text style={styles.logTime}>{l.ts?.substring(11, 16)} hrs • {l.size}</Text>
              </View>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logMg}>+{l.mg} mg</Text>
              <TouchableOpacity onPress={() => deleteMutation.mutate(l.id)}>
                <Trash2 size={16} color={Colors.textMuted} strokeWidth={1.5} />
              </TouchableOpacity>
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
  mainCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.1,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cutoffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDeep,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
    gap: 6,
  },
  cutoffAdjusted: {
    backgroundColor: 'rgba(237, 137, 54, 0.15)',
  },
  cutoffText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 137, 54, 0.12)',
    padding: 8,
    borderRadius: Radii.sm,
    gap: 6,
    marginVertical: 6,
  },
  alertNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.bandAmber,
    fontWeight: '600',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  limitLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  limitVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  curveTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  svgWrapper: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.md,
    paddingVertical: 8,
  },
  safeLineLabel: {
    fontSize: 10,
    color: Colors.bandGreen,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  addCard: {
    marginBottom: Spacing.md,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  drinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  drinkBtnActive: {
    backgroundColor: Colors.surfaceDeep,
  },
  drinkBtnName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  drinkBtnMg: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 12,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logMg: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.bandAmber,
  },
});
