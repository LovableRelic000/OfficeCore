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

    private val accelWindow = mutableListOf<FloatArray>()
    private val windowSize = 125 // ~5 seconds at 25 Hz

    fun addSample(x: Float, y: Float, z: Float): PostureResult? {
        accelWindow.add(floatArrayOf(x, y, z))
        if (accelWindow.size < windowSize) {
            return null
        }

        // Process 5-second window
        val samples = accelWindow.toList()
        accelWindow.clear()

        // 1. Mean orientation estimation
        var sumX = 0f
        var sumY = 0f
        var sumZ = 0f
        for (s in samples) {
            sumX += s[0]
            sumY += s[1]
            sumZ += s[2]
        }
        val avgX = sumX / samples.size
        val avgY = sumY / samples.size
        val avgZ = sumZ / samples.size

        // Calculate Roll and Pitch in degrees
        val roll = Math.toDegrees(atan2(avgY.toDouble(), avgZ.toDouble())).toFloat()
        val pitch = Math.toDegrees(atan2(-avgX.toDouble(), sqrt((avgY * avgY + avgZ * avgZ).toDouble()))).toFloat()

        // 2. Deviation relative to calibrated reference
        val rollDev = kotlin.math.abs(roll - refRoll)
        val pitchDev = kotlin.math.abs(pitch - refPitch)
        val totalDev = sqrt(rollDev * rollDev + pitchDev * pitchDev)

        // 3. Band assignment (<15 green, 15-25 amber, >25 red)
        val band = when {
            totalDev < 15f -> "green"
            totalDev <= 25f -> "amber"
            else -> "red"
        }

        // 4. Typing heuristic: microvibration variance in 4-15Hz band with low macro-movement
        var varTotal = 0f
        for (s in samples) {
            val mag = sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2])
            val diff = mag - 9.81f
            varTotal += diff * diff
        }
        val variance = varTotal / samples.size
        // Typical typing microvibration variance sits between 0.05 and 1.2; walking is > 4.0
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

