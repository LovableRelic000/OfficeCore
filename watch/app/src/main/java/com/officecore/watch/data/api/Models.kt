package com.officecore.watch.data.api

import kotlinx.serialization.Serializable

@Serializable
data class EnergyResponse(
    val physical: Float = 85f,
    val mental: Float = 80f,
    val caffeineLoad: Float = 25f,
    val overall: Int = 82,
    val currentCaffeineMg: Float = 95f,
    val caffeineLimitMg: Int = 400,
    val cutoffTime: String = "15:30",
    val cutoffAdjustedForSleep: Boolean = false,
    val lastUpdated: String? = null
)

@Serializable
data class PostureBands(
    val greenPct: Int = 85,
    val amberPct: Int = 12,
    val redPct: Int = 3,
    val amberMinutes: Int = 6,
    val redMinutes: Int = 2
)

@Serializable
data class PostureDayResponse(
    val date: String = "",
    val totalWindows: Int = 0,
    val ergonomicDebtMinutes: Int = 10,
    val bands: PostureBands = PostureBands()
)

@Serializable
data class AlertCopy(
    val title: String,
    val body: String,
    val actionPrimary: String,
    val actionSecondary: String? = null
)

@Serializable
data class AlertResponse(
    val decision: String, // "deliver", "defer", "drop"
    val defer_until: String? = null,
    val haptic_pattern: String = "two_short_pulses",
    val copy: AlertCopy,
    val alertId: Int = 0
)

@Serializable
data class AlertRequest(
    val type: String,
    val priority: String = "normal",
    val inDeepFocus: Boolean = false,
    val inMeeting: Boolean = false,
    val isTyping: Boolean = false,
    val idleSeconds: Int = 0
)

@Serializable
data class CaffeineLogRequest(
    val drink_type: String,
    val size: String = "Mediano",
    val mg: Int
)

@Serializable
data class BreakLogRequest(
    val kind: String,
    val outcome: String = "done",
    val amount_ml: Int? = null
)

@Serializable
data class BreathingLogRequest(
    val duration_s: Int,
    val pattern: String = "4-7-8",
    val hr_before: Int,
    val hr_after: Int
)

@Serializable
data class PostureWindowItem(
    val ts_start: String,
    val duration_s: Int = 5,
    val typing: Boolean = false,
    val roll_dev: Float = 0f,
    val pitch_dev: Float = 0f,
    val deviation_deg: Float = 0f,
    val band: String = "green"
)

@Serializable
data class HeartSampleItem(
    val ts: String,
    val bpm: Int,
    val moving: Boolean = false
)

@Serializable
data class EnvironmentSampleItem(
    val ts: String,
    val noise_db: Float,
    val lux: Float
)

@Serializable
data class WatchIngestRequest(
    val batteryPct: Int? = null,
    val postureWindows: List<PostureWindowItem>? = null,
    val heartSamples: List<HeartSampleItem>? = null,
    val environmentSamples: List<EnvironmentSampleItem>? = null
)

