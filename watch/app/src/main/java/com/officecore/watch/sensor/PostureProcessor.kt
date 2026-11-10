package com.officecore.watch.sensor

import kotlin.math.atan2
import kotlin.math.sqrt

data class PostureResult(
    val rollDeg: Float,
    val pitchDeg: Float,
    val rollDev: Float,
    val pitchDev: Float,
    val totalDevDeg: Float,
    val band: String, // "green", "amber", "red"
    val isTyping: Boolean
)

class PostureProcessor {
    var refRoll: Float = 0f
    var refPitch: Float = 10f

    private val windowSize = 50 // ~5 seconds at 10 Hz
    private var sampleCount = 0
    private var sumX = 0f
    private var sumY = 0f
    private var sumZ = 0f
    private var sumMagVariance = 0f

    fun addSample(x: Float, y: Float, z: Float): PostureResult? {
        sumX += x
        sumY += y
        sumZ += z
        val mag = sqrt(x * x + y * y + z * z)
        val diff = mag - 9.81f
        sumMagVariance += diff * diff

        sampleCount++
        if (sampleCount < windowSize) {
            return null
        }

        val avgX = sumX / sampleCount
        val avgY = sumY / sampleCount
        val avgZ = sumZ / sampleCount
        val variance = sumMagVariance / sampleCount

        // Reset rolling counters
        sampleCount = 0
        sumX = 0f
        sumY = 0f
        sumZ = 0f
        sumMagVariance = 0f

        // Calculate Roll and Pitch in degrees
        val roll = Math.toDegrees(atan2(avgY.toDouble(), avgZ.toDouble())).toFloat()
        val pitch = Math.toDegrees(atan2(-avgX.toDouble(), sqrt((avgY * avgY + avgZ * avgZ).toDouble()))).toFloat()

        // Deviation relative to calibrated reference
        val rollDev = kotlin.math.abs(roll - refRoll)
        val pitchDev = kotlin.math.abs(pitch - refPitch)
        val totalDev = sqrt(rollDev * rollDev + pitchDev * pitchDev)

        // Band assignment (<15 green, 15-25 amber, >25 red)
        val band = when {
            totalDev < 15f -> "green"
            totalDev <= 25f -> "amber"
            else -> "red"
        }

        // Typing heuristic
        val isTyping = variance in 0.04f..1.5f

        return PostureResult(
            rollDeg = roll,
            pitchDeg = pitch,
            rollDev = rollDev,
            pitchDev = pitchDev,
            totalDevDeg = totalDev,
            band = band,
            isTyping = isTyping
        )
    }
}

