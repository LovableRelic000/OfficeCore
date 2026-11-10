/**
 * OfficeCore Unified Energy Engine
 * Single source of truth for daily physical, mental, and caffeine scores.
 */

export interface EnergyComponents {
  physical: number; // 0 - 100
  mental: number;   // 0 - 100
  caffeineLoad: number; // 0 - 100 (% of daily limit in system)
  overall: number;  // 0 - 100 weighted combination
}

export interface EnergyInputData {
  // Physical parameters
  ergonomicDebtMin: number; // amber * 1 + red * 2
  sedentaryMinutesWithoutBreak: number;
  screenTimeMinutesWithoutEyeRest: number;
  standBreaksCount: number;
  stretchCount: number;

  // Mental parameters
  focusMinutesToday: number;
  meetingMinutesToday: number;
  stressEventsCount: number;
  breathingSessionsCompleted: number;

  // Caffeine
  currentCaffeineMg: number;
  caffeineLimitMg: number;
}

// Configurable baseline weights
export const ENERGY_WEIGHTS = {
  physical: {
    ergonomicDebtPenaltyPerMin: 0.35,
    sedentaryPenaltyPer10Min: 2.0,
    visualFatiguePenaltyPer20Min: 2.5,
    standBreakRecovery: 8.0,
    stretchRecovery: 12.0,
  },
  mental: {
    focusFatiguePer30Min: 3.5,
    meetingFatiguePer30Min: 5.0,
    stressEventPenalty: 7.0,
    breathingRecovery: 10.0,
  },
  overall: {
    physicalWeight: 0.40,
    mentalWeight: 0.45,
    caffeineWeight: 0.15,
  },
};

export function calculateEnergy(input: EnergyInputData): EnergyComponents {
  // 1. Physical Energy
  let physical = 100.0;
  physical -= input.ergonomicDebtMin * ENERGY_WEIGHTS.physical.ergonomicDebtPenaltyPerMin;
  physical -= (Math.max(0, input.sedentaryMinutesWithoutBreak - 50) / 10) * ENERGY_WEIGHTS.physical.sedentaryPenaltyPer10Min;
  physical -= (Math.max(0, input.screenTimeMinutesWithoutEyeRest - 20) / 20) * ENERGY_WEIGHTS.physical.visualFatiguePenaltyPer20Min;
  physical += input.standBreaksCount * ENERGY_WEIGHTS.physical.standBreakRecovery;
  physical += input.stretchCount * ENERGY_WEIGHTS.physical.stretchRecovery;
  physical = Math.max(10, Math.min(100, Math.round(physical * 10) / 10));

  // 2. Mental Energy
  let mental = 100.0;
  mental -= (input.focusMinutesToday / 30) * ENERGY_WEIGHTS.mental.focusFatiguePer30Min;
  mental -= (input.meetingMinutesToday / 30) * ENERGY_WEIGHTS.mental.meetingFatiguePer30Min;
  mental -= input.stressEventsCount * ENERGY_WEIGHTS.mental.stressEventPenalty;
  mental += input.breathingSessionsCompleted * ENERGY_WEIGHTS.mental.breathingRecovery;
  mental = Math.max(15, Math.min(100, Math.round(mental * 10) / 10));

  // 3. Caffeine Load (Percentage of safe limit currently active)
  const caffeineRatio = input.caffeineLimitMg > 0 ? input.currentCaffeineMg / input.caffeineLimitMg : 0;
  const caffeineLoad = Math.min(150, Math.round(caffeineRatio * 100 * 10) / 10);

  // Caffeine score for overall: ideal is moderate caffeine (20-60%), penalty if > 90%
  let caffeineFactor = 100;
  if (caffeineLoad > 100) {
    caffeineFactor = Math.max(20, 100 - (caffeineLoad - 100) * 1.5);
  } else if (caffeineLoad > 80) {
    caffeineFactor = 85;
  } else {
    caffeineFactor = 95;
  }

  // 4. Overall Energy
  const overall = Math.round(
    physical * ENERGY_WEIGHTS.overall.physicalWeight +
    mental * ENERGY_WEIGHTS.overall.mentalWeight +
    caffeineFactor * ENERGY_WEIGHTS.overall.caffeineWeight
  );

  return {
    physical,
    mental,
    caffeineLoad,
    overall: Math.max(10, Math.min(100, overall)),
  };
}

