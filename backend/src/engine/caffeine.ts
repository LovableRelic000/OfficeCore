/**
 * OfficeCore Caffeine Pharmacokinetics Engine
 * Exponential decay model: C(t) = Sum(D_i * 0.5^((t - t_i) / half_life))
 */

export interface CaffeineLog {
  ts: Date | string;
  mg: number;
}

export interface CaffeineState {
  currentMg: number;
  limitMg: number;
  caffeineLoadPct: number; // 0 to 100+
  cutoffTime: string; // "HH:mm"
  bedtime: string; // "HH:mm"
  cutoffAdjusted: boolean;
}

export function calculateCurrentCaffeine(
  logs: CaffeineLog[],
  now: Date = new Date(),
  halfLifeHours: number = 5.0
): number {
  let totalMg = 0;
  const nowMs = now.getTime();

  for (const log of logs) {
    const logTime = new Date(log.ts).getTime();
    if (logTime > nowMs) continue;
    const elapsedHours = (nowMs - logTime) / (1000 * 60 * 60);
    const remaining = log.mg * Math.pow(0.5, elapsedHours / halfLifeHours);
    totalMg += remaining;
  }

  return Math.round(totalMg * 10) / 10;
}

/**
 * Calculates cutoff time for caffeine intake so that at bedtime residual <= 30mg
 * Standard dose considered: 95 mg (Americano)
 */
export function calculateCaffeineCutoff(
  bedtime: string = '23:30', // HH:mm
  halfLifeHours: number = 5.0,
  targetResidualMg: number = 30.0,
  standardDoseMg: number = 95.0,
  poorSleepPriorNight: boolean = false
): { cutoffTime: string; adjustedForSleep: boolean } {
  // Hours required to decay from standardDoseMg to targetResidualMg:
  // targetResidualMg = standardDoseMg * 0.5^(h / halfLifeHours)
  // log(target/standard) = (h / halfLife) * log(0.5)
  // h = halfLife * log(standard / target) / log(2)
  const requiredDecayHours = halfLifeHours * (Math.log(standardDoseMg / targetResidualMg) / Math.log(2));

  const [bHours, bMinutes] = bedtime.split(':').map(Number);
  let cutoffDecimal = bHours + bMinutes / 60 - requiredDecayHours;

  if (poorSleepPriorNight) {
    cutoffDecimal -= 1.0; // Advance cutoff by 1 hour
  }

  while (cutoffDecimal < 0) cutoffDecimal += 24;
  while (cutoffDecimal >= 24) cutoffDecimal -= 24;

  const hours = Math.floor(cutoffDecimal);
  const minutes = Math.floor((cutoffDecimal - hours) * 60);

  const cutoffTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    cutoffTime,
    adjustedForSleep: poorSleepPriorNight,
  };
}

