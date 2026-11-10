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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.data.api.ApiClient
import com.officecore.watch.sensor.HapticController
import com.officecore.watch.theme.*
import kotlinx.coroutines.launch

val SNOOZE_OPTIONS = listOf(5, 10, 15, 30)

@Composable
fun AlertScreen(
    title: String = "Postura de Muñeca",
    body: String = "Desviación sostenida detectada. Relaja la mano en postura neutral.",
    alertId: Int = 1,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    val scope = rememberCoroutineScope()
    var snoozeIdx by remember { mutableStateOf(0) }
    var rotaryDelta by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        haptic.playPattern("two_short_pulses")
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                rotaryDelta += it.verticalScrollPixels
                if (rotaryDelta >= 28f) {
                    snoozeIdx = (snoozeIdx + 1) % SNOOZE_OPTIONS.size
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                } else if (rotaryDelta <= -28f) {
                    snoozeIdx = (snoozeIdx - 1 + SNOOZE_OPTIONS.size) % SNOOZE_OPTIONS.size
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
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Accent,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = body,
                fontSize = 11.sp,
                color = TextPrimary,
                textAlign = TextAlign.Center,
                lineHeight = 15.sp,
                modifier = Modifier.padding(horizontal = 8.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Button(
                    onClick = {
                        scope.launch { ApiClient.updateAlertOutcome(alertId, "acted") }
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = BandGreen),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("Hecho", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                val snoozeMin = SNOOZE_OPTIONS[snoozeIdx]
                Button(
                    onClick = {
                        scope.launch { ApiClient.updateAlertOutcome(alertId, "snoozed", snoozeMin) }
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = SurfaceDeep),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("+${snoozeMin}m", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

