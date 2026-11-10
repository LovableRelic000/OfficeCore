import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Watch, Laptop, Smartphone, Key, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { api } from '../services/api';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton } from '../theme/components';

export default function DevicesScreen() {
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: api.getDevices,
  });

  const codeMutation = useMutation({
    mutationFn: api.createPairingCode,
    onSuccess: (res) => {
      setPairingCode(res.code);
    },
  });

  const devices = devicesData?.devices || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dispositivos Enlazados</Text>
      <Text style={styles.subHeading}>Ecosistema de sensores de Alex Rivera</Text>

      {/* Paired devices list */}
      {devices.map((d: any) => {
        const isWatch = d.type === 'watch';
        const isPC = d.type === 'pc';
        const Icon = isWatch ? Watch : isPC ? Laptop : Smartphone;

        return (
          <NeuCard key={d.id} style={styles.deviceCard}>
            <View style={styles.deviceLeft}>
              <View style={styles.iconWell}>
                <Icon size={22} color={Colors.accent} strokeWidth={1.75} />
              </View>
              <View>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Text style={styles.deviceType}>{d.type?.toUpperCase()} • Batería: {d.battery_pct}%</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={14} color={Colors.bandGreen} strokeWidth={2} />
              <Text style={styles.statusText}>Activo</Text>
            </View>
          </NeuCard>
        );
      })}

      {/* PC Agent Pairing Section */}
      <Text style={styles.sectionHeading}>Emparejar Agente de PC</Text>
      <NeuCard style={styles.pairingCard}>
        <View style={styles.pairingHeader}>
          <Key size={20} color={Colors.accent} strokeWidth={2} />
          <Text style={styles.pairingTitle}>Código de Emparejamiento</Text>
        </View>
        <Text style={styles.pairingDesc}>
          Genera un código temporal de 6 dígitos para enlazar una nueva laptop con tu cuenta de OfficeCore.
        </Text>

        {pairingCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{pairingCode}</Text>
            <Text style={styles.codeSub}>Válido por 15 minutos</Text>
          </View>
        ) : null}

        <NeuPrimaryButton
          title={pairingCode ? 'Generar Nuevo Código' : 'Generar Código de 6 Dígitos'}
          onPress={() => codeMutation.mutate()}
        />
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
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWell: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deviceType: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceDeep,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.bandGreen,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pairingCard: {
    padding: Spacing.md,
  },
  pairingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pairingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pairingDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 6,
  },
  codeSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
