import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Watch, ShieldCheck, HeartPulse, Brain, Coffee } from 'lucide-react-native';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuPrimaryButton } from '../theme/components';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <HeartPulse size={36} color={Colors.accent} strokeWidth={2} />
        </View>
        <Text style={styles.title}>OfficeCore</Text>
        <Text style={styles.subtitle}>
          Tu compañero inteligente de bienestar y productividad para trabajo en oficina y home office.
        </Text>
      </View>

      {/* Pillars */}
      <NeuCard style={styles.pillarCard}>
        <View style={styles.pillarHeader}>
          <Watch size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.pillarTitle}>Smartwatch Wear OS como Protagonista</Text>
        </View>
        <Text style={styles.pillarText}>
          Monitorea la desviación de tu muñeca al teclear en tiempo real y te permite registrar café, pausas y foco con el bisel físico sin tocar el teléfono.
        </Text>
      </NeuCard>

      <NeuCard style={styles.pillarCard}>
        <View style={styles.pillarHeader}>
          <Brain size={20} color={Colors.bandGreen} strokeWidth={2} />
          <Text style={styles.pillarTitle}>Motor de Política de Interrupciones</Text>
        </View>
        <Text style={styles.pillarText}>
          No interrumpe tu flujo. Las sugerencias esperan a pausas naturales de tecleo o al final de reuniones y bloques de foco profundo.
        </Text>
      </NeuCard>

      <NeuCard style={styles.pillarCard}>
        <View style={styles.pillarHeader}>
          <ShieldCheck size={20} color={Colors.bandAmber} strokeWidth={2} />
          <Text style={styles.pillarTitle}>Privacidad Estricta por Diseño</Text>
        </View>
        <Text style={styles.pillarText}>
          Cero registro de teclas, títulos de ventana o audio. Todo se procesa con agregaciones locales seguras.
        </Text>
      </NeuCard>

      <NeuPrimaryButton
        title="Continuar al Dashboard"
        style={{ marginTop: Spacing.md }}
        onPress={() => router.replace('/(tabs)')}
      />
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
  header: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Radii.circle,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  pillarCard: {
    marginBottom: 12,
    padding: Spacing.md,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pillarText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

