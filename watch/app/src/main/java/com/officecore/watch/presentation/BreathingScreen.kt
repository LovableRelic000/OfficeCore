package com.officecore.watch.presentation

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.data.api.ApiClient
import com.officecore.watch.sensor.HapticController
import com.officecore.watch.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun BreathingScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    val scope = rememberCoroutineScope()
    var bpmRate by remember { mutableStateOf(6) } // 4 to 8 respiraciones por minuto
    var phase by remember { mutableStateOf("Inhala") }
    var rotaryDelta by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }

    // Pulsing circle animation
    val infiniteTransition = rememberInfiniteTransition(label = "breathing")
    val cycleMs = (60_000 / bpmRate)
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(cycleMs / 2, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(scale) {
        if (scale > 0.85f && phase != "Exhala") {
            phase = "Exhala"
            haptic.playPattern("breathing_exhale")
        } else if (scale < 0.55f && phase != "Inhala") {
            phase = "Inhala"
            haptic.playPattern("breathing_inhale")
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                rotaryDelta += it.verticalScrollPixels
                if (rotaryDelta >= 30f && bpmRate < 8) {
                    bpmRate += 1
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                } else if (rotaryDelta <= -30f && bpmRate > 4) {
                    bpmRate -= 1
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable(),
        contentAlignment = Alignment.Center
    ) {
        // Breathing Expanding Circle
        Canvas(modifier = Modifier.size(160.dp)) {
            val radius = (size.minDimension / 2) * scale
            drawCircle(
                color = AccentLight,
                radius = radius
            )
            drawCircle(
                color = Accent,
                radius = radius * 0.7f
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = phase,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
            Text(
                text = "$bpmRate resp/min",
                fontSize = 10.sp,
                color = SurfaceDeep,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

