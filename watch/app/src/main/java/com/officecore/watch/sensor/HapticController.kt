package com.officecore.watch.sensor

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * OfficeCore Wear OS Haptic Language (Section 9.9 of plan.MD)
 */
class HapticController(context: Context) {

    private val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vm.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    fun playRotaryDetent() {
        if (!vibrator.hasVibrator()) return
        vibrator.vibrate(VibrationEffect.createOneShot(12, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    fun playPattern(patternName: String) {
        if (!vibrator.hasVibrator()) return

        when (patternName) {
            "posture", "two_short_pulses" -> {
                // Two short pulses
                val timings = longArrayOf(0, 70, 80, 70)
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
            "eye_break", "long_gentle_pulse" -> {
                // One long gentle vibration
                vibrator.vibrate(VibrationEffect.createOneShot(350, 100))
            }
            "water", "three_light_taps" -> {
                // Three light taps
                val timings = longArrayOf(0, 45, 60, 45, 60, 45)
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
            "caffeine_limit", "ascending_pulses" -> {
                // Ascending pulses
                val timings = longArrayOf(0, 60, 50, 90, 50, 140)
                val amplitudes = intArrayOf(0, 80, 0, 160, 0, 240)
                if (vibrator.hasAmplitudeControl()) {
                    vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
                } else {
                    vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
                }
            }
            "stress", "double_slow_pulse" -> {
                // Double slow pulse
                val timings = longArrayOf(0, 120, 150, 120)
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
            "focus_end", "long_crescendo_pulse" -> {
                // Long crescendo vibration
                val timings = longArrayOf(0, 100, 40, 200, 40, 400)
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
            "breathing_inhale" -> {
                // Inhale: ascending
                vibrator.vibrate(VibrationEffect.createOneShot(200, 120))
            }
            "breathing_exhale" -> {
                // Exhale: long smooth
                vibrator.vibrate(VibrationEffect.createOneShot(400, 70))
            }
            else -> {
                vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        }
    }
}

