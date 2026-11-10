import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Send, CheckCircle2, AlertOctagon, Lightbulb, MessageSquare } from 'lucide-react-native';
import { api } from '../../services/api';
import { Colors, Radii, Spacing } from '../../theme/tokens';
import { NeuCard, NeuPrimaryButton, NeuButton, NeuInput } from '../../theme/components';

export default function AssistantScreen() {
  const queryClient = useQueryClient();
  const [chatInput, setChatInput] = useState('');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['aiSummaryToday'],
    queryFn: () => api.getAiSummary(),
  });

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['aiChatHistory'],
    queryFn: api.getAiChatHistory,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.generateAiSummary(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSummaryToday'] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: (msg: string) => api.sendAiChat(msg),
    onSuccess: () => {
      setChatInput('');
      queryClient.invalidateQueries({ queryKey: ['aiChatHistory'] });
    },
  });

  const summary = summaryData?.summary || {
    resumen: 'Analizando tus métricas de foco, postura y energía...',
    lo_que_fue_bien: 'Buen progreso en bloques de foco.',
    a_mejorar: 'Atender descansos 20-20-20.',
    sugerencia_manana: 'Recuerda calibrar tu postura al iniciar tu jornada.',
  };

  const messages = chatData?.messages || [
    { role: 'assistant', content: '¡Hola Alex! Soy tu asistente de bienestar OfficeCore. Puedes preguntarme sobre tus patrones de foco, la causa de tu cansancio o tu historial de cafeína.' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Daily Structured Summary */}
        <NeuCard style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.headerLeft}>
              <Sparkles size={20} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.summaryTitle}>Resumen del Día</Text>
            </View>
            <NeuButton
              style={styles.regenBtn}
              onPress={() => regenerateMutation.mutate()}
            >
              {regenerateMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <View style={styles.regenInner}>
                  <RefreshCw size={12} color={Colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.regenText}>Regenerar</Text>
                </View>
              )}
            </NeuButton>
          </View>

          <Text style={styles.summaryMainText}>{summary.resumen}</Text>

          {/* Breakdown cards */}
          <View style={styles.sectionItem}>
            <View style={styles.bulletHeader}>
              <CheckCircle2 size={16} color={Colors.bandGreen} strokeWidth={2} />
              <Text style={styles.bulletTitle}>Lo que fue bien</Text>
            </View>
            <Text style={styles.bulletBody}>{summary.lo_que_fue_bien}</Text>
          </View>

          <View style={styles.sectionItem}>
            <View style={styles.bulletHeader}>
              <AlertOctagon size={16} color={Colors.bandAmber} strokeWidth={2} />
              <Text style={styles.bulletTitle}>Puntos a mejorar</Text>
            </View>
            <Text style={styles.bulletBody}>{summary.a_mejorar}</Text>
          </View>

          <View style={styles.sectionItem}>
            <View style={styles.bulletHeader}>
              <Lightbulb size={16} color={Colors.accent} strokeWidth={2} />
              <Text style={styles.bulletTitle}>Sugerencia para mañana</Text>
            </View>
            <Text style={styles.bulletBody}>{summary.sugerencia_manana}</Text>
          </View>
        </NeuCard>

        {/* Chat Section */}
        <Text style={styles.chatSectionHeading}>Conversación con tus Métricas</Text>
        <Text style={styles.chatSectionSub}>Pregúntale sobre días específicos, insomnio o postura.</Text>

        {/* Pre-canned query chips */}
        <View style={styles.chipsRow}>
          {[
            '¿Por qué dormí mal esa noche?',
            '¿Cómo estuvo mi postura hoy?',
            '¿Cuál fue mi mejor día de foco?',
          ].map((prompt, i) => (
            <NeuButton
              key={i}
              style={styles.chipBtn}
              textStyle={styles.chipText}
              onPress={() => chatMutation.mutate(prompt)}
            >
              {prompt}
            </NeuButton>
          ))}
        </View>

        {/* Messages Stream */}
        <View style={styles.messagesContainer}>
          {messages.map((m: any, idx: number) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                  {m.content}
                </Text>
              </View>
            );
          })}
          {chatMutation.isPending && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color={Colors.accent} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Chat Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Haz una pregunta sobre tus datos..."
          placeholderTextColor={Colors.textMuted}
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={() => {
            if (chatInput.trim()) chatMutation.mutate(chatInput.trim());
          }}
        />
        <NeuButton
          style={styles.sendBtn}
          onPress={() => {
            if (chatInput.trim()) chatMutation.mutate(chatInput.trim());
          }}
        >
          <Send size={16} color={Colors.accent} strokeWidth={2} />
        </NeuButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  regenBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  regenInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regenText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryMainText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  sectionItem: {
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 8,
  },
  bulletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bulletTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bulletBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  chatSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  chatSectionSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  chipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: Radii.md,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceRaised,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  },
  userMessageText: {
    color: '#ffffff',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceDeep,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceDeep,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.circle,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
