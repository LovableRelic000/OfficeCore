/**
 * OfficeCore Flow & Focus Engine
 * Calculates focus block quality, interruptions, and auto-detects deep work periods.
 */

export interface PcActivityWindow {
  ts_start: Date | string;
  keystrokes: number;
  keystroke_cv: number;
  mouse_events: number;
  idle_s: number;
  app_category: 'editor' | 'terminal' | 'browser' | 'meeting' | 'chat' | 'other';
}

export interface FocusBlockAnalysis {
  isFocusBlock: boolean;
  durationMin: number;
  qualityScore: number; // 0 - 100
  interruptions: number;
  editorDominancePct: number;
  suggestedAction?: 'eye_break' | 'water' | 'stretch';
}

export function analyzeFocusActivity(windows: PcActivityWindow[]): FocusBlockAnalysis {
  if (windows.length < 10) {
    return {
      isFocusBlock: false,
      durationMin: windows.length,
      qualityScore: 70,
      interruptions: 0,
      editorDominancePct: 0,
    };
  }

  let activeMinutes = 0;
  let editorOrTerminalMinutes = 0;
  let interruptions = 0;

  for (let i = 0; i < windows.length; i++) {
    const w = windows[i];
    const isActive = w.idle_s < 45 || w.keystrokes > 10 || w.mouse_events > 15;
    if (isActive) activeMinutes++;

    if (w.app_category === 'editor' || w.app_category === 'terminal') {
      editorOrTerminalMinutes++;
    }

    if (w.app_category === 'chat') {
      interruptions++;
    } else if (w.idle_s > 120) {
      interruptions++;
    }
  }

  const activeRatio = activeMinutes / windows.length;
  const editorRatio = editorOrTerminalMinutes / windows.length;
  const isFocusBlock = windows.length >= 10 && activeRatio >= 0.6 && editorRatio >= 0.5;

  let qualityScore = 100;
  qualityScore -= interruptions * 7;
  qualityScore -= Math.round((1 - editorRatio) * 20);
  qualityScore = Math.max(20, Math.min(100, qualityScore));

  let suggestedAction: 'eye_break' | 'water' | 'stretch' = 'stretch';
  if (windows.length >= 45) {
    suggestedAction = 'stretch';
  } else if (windows.length >= 20) {
    suggestedAction = 'eye_break';
  } else {
    suggestedAction = 'water';
  }

  return {
    isFocusBlock,
    durationMin: windows.length,
    qualityScore,
    interruptions,
    editorDominancePct: Math.round(editorRatio * 100),
    suggestedAction,
  };
}
