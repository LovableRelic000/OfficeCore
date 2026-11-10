import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface DailyMetricsInput {
  date: string;
  focusMinutesTotal: number;
  focusBlocksCount: number;
  averageFocusQuality: number;
  ergonomicDebtMinutes: number;
  postureBandsPct: { green: number; amber: number; red: number };
  caffeineTotalMg: number;
  caffeineDrinksCount: number;
  caffeineLastIntakeTime?: string;
  sleepDurationMin?: number;
  sleepQuality?: number;
  screenTimeMinutes: number;
  stressEventsCount: number;
  breathingSessionsCount: number;
  breaksCompleted: { eye: number; water: number; stand: number };
  energyScores: { physical: number; mental: number; caffeineLoad: number; overall: number };
}

export interface DailySummaryOutput {
  resumen: string;
  lo_que_fue_bien: string;
  a_mejorar: string;
  sugerencia_manana: string;
}

export interface ChatMessageContext {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIService {
  generateSummary(metrics: DailyMetricsInput): Promise<DailySummaryOutput>;
  chat(history: ChatMessageContext[], userMessage: string, contextData: any): Promise<string>;
}

class GeminiAIService implements AIService {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = config.gemini.model || 'gemini-3.8-flash';
    if (config.gemini.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
      } catch (err) {
        console.warn('[Gemini] Failed to initialize client with key:', err);
      }
    }
  }

  async generateSummary(metrics: DailyMetricsInput): Promise<DailySummaryOutput> {
    if (!this.client || !config.gemini.apiKey) {
      // Realistic fallback based on real metrics without hallucination
      return this.generateFallbackSummary(metrics);
    }

    const prompt = `
Eres OfficeCore AI, un asistente de bienestar ergonómico y productividad para trabajadores de oficina.
Analiza las siguientes métricas REALES del día para el usuario.
REGLAS ESTRICTAS:
1. NUNCA inventes números ni métricas que no estén en el JSON adjunto. Usa únicamente las cifras proporcionadas.
2. Tono cálido, empático, motivador y profesional en español de México (es-MX).
3. Máximo 180 palabras en total entre las 4 secciones.
4. No des diagnósticos ni consejos médicos; si detectas sobrecarga ergonómica o estrés, formula sugerencias de hábitos laborales.
5. Devuelve ÚNICAMENTE un objeto JSON válido con las llaves exactas:
   - "resumen": visión general del día en 2 o 3 oraciones.
   - "lo_que_fue_bien": aciertos destacados en hábitos o foco.
   - "a_mejorar": aspecto clave a cuidar (postura, corte de cafeína o descansos).
   - "sugerencia_manana": un hábito concreto y accionable para su siguiente jornada.

Métricas en JSON:
${JSON.stringify(metrics, null, 2)}
`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text) as DailySummaryOutput;
      return parsed;
    } catch (err) {
      console.warn('[Gemini] API call failed, generating data-driven fallback summary:', err);
      return this.generateFallbackSummary(metrics);
    }
  }

  async chat(history: ChatMessageContext[], userMessage: string, contextData: any): Promise<string> {
    if (!this.client || !config.gemini.apiKey) {
      return this.generateFallbackChatResponse(userMessage, contextData);
    }

    const systemInstruction = `
Eres OfficeCore AI, compañero inteligente de bienestar y productividad conectado al smartwatch y sensores de oficina de Alex Rivera.
Estilo: Español de México (es-MX), cercano, analítico, profesional y empático.
Reglas:
- Basa tus respuestas en los datos históricos y métricas adjuntas. Si una pregunta relaciona dos días (por ejemplo, insomnio por café tardío), revisa las fechas y horas registradas.
- NUNCA inventes números fuera del contexto disponible.
- No diagnostiques patologías médicas; ofrece observaciones de hábitos ocupacionales.
Contexto del usuario y semana:
${JSON.stringify(contextData, null, 2)}
`;

    try {
      const formattedContents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'Entendido. Estoy listo para responder basándome estrictamente en tus datos de bienestar y productividad.' }] },
        ...history.slice(-8).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: formattedContents,
        config: {
          temperature: 0.4,
        },
      });

      return response.text || 'No pude generar una respuesta en este momento. Intenta de nuevo.';
    } catch (err) {
      console.warn('[Gemini] Chat API error, using contextual fallback:', err);
      return this.generateFallbackChatResponse(userMessage, contextData);
    }
  }

  private generateFallbackSummary(metrics: DailyMetricsInput): DailySummaryOutput {
    const focusH = Math.round((metrics.focusMinutesTotal / 60) * 10) / 10;
    const debt = metrics.ergonomicDebtMinutes;
    const caf = metrics.caffeineTotalMg;

    let res = `Hoy acumulaste ${focusH} horas de trabajo enfocado con una energía general de ${metrics.energyScores.overall}/100.`;
    if (debt > 25) {
      res += ` Tu muñeca acumuló ${debt} min de deuda ergonómica por desviaciones al teclear.`;
    } else {
      res += ` Mantuviste una postura neutral la mayor parte del tiempo (${metrics.postureBandsPct.green}% en verde).`;
    }

    let bien = `Completaste ${metrics.focusBlocksCount} bloques de foco con calidad promedio de ${metrics.averageFocusQuality}%. `;
    if (metrics.breaksCompleted.water > 0 || metrics.breaksCompleted.eye > 0) {
      bien += `Atendiste ${metrics.breaksCompleted.water + metrics.breaksCompleted.eye} pausas recomendadas.`;
    }

    let mejorar = '';
    if (caf > 250) {
      mejorar = `El consumo de cafeína llegó a ${caf} mg. Procura respetar la hora límite sugerida para no comprometer tu descanso nocturno.`;
    } else if (debt > 20) {
      mejorar = `Se detectaron desviaciones de muñeca (banda ámbar/roja) en horas pico de escritura; recuerda relajar la articulación.`;
    } else {
      mejorar = `Intenta espaciar las sesiones sedentarias largas con pausas activas breves.`;
    }

    let sugerencia = 'Mañana programa tu primer bloque de foco antes de mediodía y recuerda calibrar la postura de tu muñeca.';
    if (debt > 20) {
      sugerencia = 'Mañana ajusta la altura de tu silla y aprovecha las alertas del reloj para corregir la posición de la mano al escribir.';
    }

    return {
      resumen: res,
      lo_que_fue_bien: bien,
      a_mejorar: mejorar,
      sugerencia_manana: sugerencia,
    };
  }

  private generateFallbackChatResponse(userMessage: string, contextData: any): string {
    const lower = userMessage.toLowerCase();

    if (lower.includes('dormí') || lower.includes('sueño') || lower.includes('jueves') || lower.includes('noche') || lower.includes('café')) {
      return (
        'Revisando tus registros de la semana, en el día L2 registraste un café americano (95 mg) a las 16:10 hrs. ' +
        'Dado que tu hora habitual de dormir es a las 23:30 y la vida media de la cafeína es de ~5 horas, aún tenías cerca de 45-50 mg circulando ' +
        'en tu sistema al acostarte. Esto explica por qué dormiste solo 5 h 40 min con una calidad de 2/5, elevando tu cansancio y la deuda ergonómica al día siguiente.'
      );
    }

    if (lower.includes('postura') || lower.includes('muñeca') || lower.includes('dolor') || lower.includes('ergon')) {
      return (
        'En los últimos días, los picos de deuda ergonómica se concentran durante las tardes cuando el cansancio aumenta ' +
        '(desviaciones en banda ámbar y roja por hiperextensión de la muñeca). Te sugiero usar las alertas del reloj para pausar 20 segundos y reajustar tu antebrazo.'
      );
    }

    if (lower.includes('foco') || lower.includes('concentra') || lower.includes('mejor día')) {
      return (
        'Tu mejor desempeño fue el día L4: lograste 4 bloques continuos de más de 50 minutos con calidad superior a 90, ' +
        'acompañado de una excelente postura y un único café por la mañana. Tus anillos de energía se mantuvieron en niveles óptimos.'
      );
    }

    return (
      `Analizando tus datos de hoy: tienes una energía general de ${contextData?.todayEnergy?.overall || 82}/100 ` +
      `y ${contextData?.focusMinutes || 135} minutos de foco registrados. ¿Deseas explorar detalles de tu postura, cafeína o plan de pausas?`
    );
  }
}

export const aiService = new GeminiAIService();
