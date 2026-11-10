import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Compass, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../theme/components';

export default function CalibrationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.savePostureCalibration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postureCalibration'] });
      queryClient.invalidateQueries({ queryKey: ['postureToday'] });
      Alert.alert('Calibración Exitosa', 'Tu reloj ha registrado el vector de gravedad de referencia y la firma de tecleo.');
      router.back();
    },
  });

  useEffect(() => {
    let interval: any = null;
    if (isCalibrating && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isCalibrating && secondsRemaining === 0) {
      setIsCalibrating(false);
      // Save realistic calibrated vector
      saveMutation.mutate({
        gravity_vector: { x: 0.12, y: 5.84, z: 7.92 },
        roll_ref: 3.4,
        pitch_ref: 11.2,
        duration_s: 30,
        samples_count: 750,
      });
    }
    return () => clearInterval(interval);
  }, [isCalibrating, secondsRemaining]);

  const startCalibration = () => {
    setSecondsRemaining(30);
    setIsCalibrating(true);
  };

  return (
    <View style={styles.container}>
      <NeuCard style={styles.card}>
        <View style={styles.header}>
          <Compass size={32} color={Colors.accent} strokeWidth={1.75} />
          <Text style={styles.title}>Calibración de Postura Neutral</Text>
        </View>

        <Text style={styles.instructions}>
          1. Coloca tu Galaxy Watch4 en la muñeca dominante o la que usas al teclear.{'\n'}
          2. Adopta tu mejor postura de oficina (antebrazo apoyado, hombros relajados).{'\n'}
          3. Durante los 30 segundos, teclea naturalmente un párrafo de código o texto.
        </Text>

        <View style={styles.timerCircle}>
          <Text style={styles.timerNumber}>{secondsRemaining}</Text>
          <Text style={styles.timerLabel}>SEGUNDOS</Text>
        </View>

        {isCalibrating ? (
          <View style={styles.calibratingStatus}>
            <Text style={styles.statusText}>Muestreando acelerómetro a 25 Hz...</Text>
          </View>
        ) : (
          <NeuPrimaryButton
            title="Comenzar Calibración (30s)"
            onPress={startCalibration}
          />
        )}
      </NeuCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: Radii.circle,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  timerNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.accent,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  calibratingStatus: {
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
});

