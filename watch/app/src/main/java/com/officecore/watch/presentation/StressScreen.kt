package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import kotlinx.coroutines.launch

val STRESS_TRIGGERS = listOf("Reunión", "Mensaje", "Código/bug", "Tráfico", "Otro")

@Composable
fun StressScreen(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    val scope = rememberCoroutineScope()
    var selectedIdx by remember { mutableStateOf(0) }
    var confirmed by remember { mutableStateOf(false) }
    var rotaryDelta by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }

    val trigger = STRESS_TRIGGERS[selectedIdx]

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        haptic.playPattern("stress")
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                rotaryDelta += it.verticalScrollPixels
                if (rotaryDelta >= 28f) {
                    selectedIdx = (selectedIdx + 1) % STRESS_TRIGGERS.size
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                } else if (rotaryDelta <= -28f) {
                    selectedIdx = (selectedIdx - 1 + STRESS_TRIGGERS.size) % STRESS_TRIGGERS.size
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(14.dp)
        ) {
            Text(
                text = "Pico de Pulso",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = BandRed
            )
            Text(
                text = "¿Qué lo detonó?",
                fontSize = 14.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = trigger,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Accent
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (!confirmed) {
                Button(
                    onClick = {
                        confirmed = true
                        haptic.playPattern("water")
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("Guardar Detonante", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                Text("¡Guardado!", color = BandGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

