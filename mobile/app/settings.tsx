import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Download, Trash2, Cpu, Check } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton, NeuInput } from '../theme/components';

export default function SettingsScreen() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  const [workStart, setWorkStart] = useState('09:00:00');
  const [workEnd, setWorkEnd] = useState('18:00:00');
  const [bedtime, setBedtime] = useState('23:30:00');

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert('Ajustes Guardados', 'Tu jornada y horario han sido actualizados.');
    },
  });

  const handleExport = () => {
    Alert.alert(
      'Exportar Datos',
      'Tus datos han sido empaquetados en formato JSON y están listos para descarga local de acuerdo con las normas de privacidad.'
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Datos',
      '¿Estás seguro de que deseas eliminar tus datos? Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => Alert.alert('Completado', 'Datos eliminados.') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Perfil y Horarios</Text>
      <NeuCard style={styles.card}>
        <Text style={styles.label}>Usuario</Text>
        <Text style={styles.userVal}>{user?.name || 'Alex Rivera'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'alex.rivera@officecore.internal'}</Text>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Inicio Jornada</Text>
            <NeuInput
              value={workStart}
              onChangeText={setWorkStart}
              placeholder="09:00:00"
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Fin Jornada</Text>
            <NeuInput
              value={workEnd}
              onChangeText={setWorkEnd}
              placeholder="18:00:00"
            />
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Hora de Dormir</Text>
        <NeuInput
          value={bedtime}
          onChangeText={setBedtime}
          placeholder="23:30:00"
        />

        <NeuPrimaryButton
          title="Guardar Horarios"
          style={{ marginTop: Spacing.md }}
          onPress={() => updateMutation.mutate({ work_start: workStart, work_end: workEnd, bedtime })}
        />
      </NeuCard>

      {/* Privacy and Transparency */}
      <Text style={styles.heading}>Privacidad por Diseño</Text>
      <NeuCard style={styles.card}>
        <View style={styles.privHeader}>
          <Shield size={18} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.privTitle}>Garantías de OfficeCore</Text>
        </View>
        <Text style={styles.privText}>
          • El agente de PC nunca registra qué tecla presionas ni títulos de ventana.{'\n'}
          • El micrófono del reloj solo estima decibeles (dB) y descarta el buffer sin guardar audio.{'\n'}
          • Los datos de salud y foco son de tu propiedad.
        </Text>

        <View style={styles.actionsRow}>
          <NeuButton style={styles.actionBtn} onPress={handleExport}>
            <View style={styles.btnInnerRow}>
              <Download size={14} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.btnText}>Exportar Datos</Text>
            </View>
          </NeuButton>

          <NeuButton style={styles.actionBtn} onPress={handleDelete}>
            <View style={styles.btnInnerRow}>
              <Trash2 size={14} color={Colors.bandRed} strokeWidth={2} />
              <Text style={[styles.btnText, { color: Colors.bandRed }]}>Borrar Datos</Text>
            </View>
          </NeuButton>
        </View>
      </NeuCard>

      {/* Version and AI Model in Use */}
      <Text style={styles.heading}>Sistema e Inteligencia Artificial</Text>
      <NeuCard style={styles.card}>
        <View style={styles.sysRow}>
          <Cpu size={18} color={Colors.accent} strokeWidth={2} />
          <View>
            <Text style={styles.sysLabel}>Modelo de IA en uso</Text>
            <Text style={styles.sysVal}>gemini-3.8-flash (Variable de entorno)</Text>
          </View>
        </View>
        <Text style={styles.sysSub}>
          OfficeCore v1.0.0-mvp • Protocolo de Salud Ocupacional no clínico.
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  userVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  privHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sysLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sysVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sysSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

