package com.officecore.watch.presentation

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
import com.officecore.watch.sensor.HapticController
import com.officecore.watch.theme.*
import kotlinx.coroutines.delay

@Composable
fun FocusScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    var durationMin by remember { mutableStateOf(25) }
    var isRunning by remember { mutableStateOf(false) }
    var secondsLeft by remember { mutableStateOf(25 * 60) }
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(isRunning, secondsLeft) {
        if (isRunning && secondsLeft > 0) {
            delay(1000)
            secondsLeft -= 1
        } else if (isRunning && secondsLeft == 0) {
            isRunning = false
            haptic.playPattern("focus_end")
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                if (!isRunning) {
                    if (it.verticalScrollPixels > 0 && durationMin < 120) {
                        durationMin += 5
                        secondsLeft = durationMin * 60
                        haptic.playRotaryDetent()
                    } else if (it.verticalScrollPixels < 0 && durationMin > 15) {
                        durationMin -= 5
                        secondsLeft = durationMin * 60
                        haptic.playRotaryDetent()
                    }
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = if (isRunning) "En Modo Foco" else "Ajustar con Bisel",
                fontSize = 12.sp,
                color = Accent,
                fontWeight = FontWeight.Bold
            )

            val displayMinutes = secondsLeft / 60
            val displaySeconds = secondsLeft % 60
            val timeText = if (isRunning) {
                String.format("%02d:%02d", displayMinutes, displaySeconds)
            } else {
                "${durationMin} min"
            }

            Text(
                text = timeText,
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary,
                modifier = Modifier.padding(vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(6.dp))

            if (!isRunning) {
                Button(
                    onClick = {
                        isRunning = true
                        secondsLeft = durationMin * 60
                        haptic.playPattern("focus_end")
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
                    modifier = Modifier.height(34.dp)
                ) {
                    Text("Iniciar Foco", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                CompactChip(
                    onClick = { isRunning = false },
                    label = { Text("Pausar", fontSize = 11.sp, color = BandAmber) },
                    colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep)
                )
            }
        }
    }
}

