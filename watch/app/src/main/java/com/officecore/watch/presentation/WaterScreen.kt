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

@Composable
fun WaterScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    val scope = rememberCoroutineScope()
    var amountMl by remember { mutableStateOf(250) }
    var confirmed by remember { mutableStateOf(false) }
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                if (it.verticalScrollPixels > 0 && amountMl < 1000) {
                    amountMl += 50
                    haptic.playRotaryDetent()
                } else if (it.verticalScrollPixels < 0 && amountMl > 50) {
                    amountMl -= 50
                    haptic.playRotaryDetent()
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
                text = "Registrar Agua",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Accent
            )
            Text(
                text = "$amountMl ml",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary,
                modifier = Modifier.padding(vertical = 4.dp)
            )

            if (!confirmed) {
                Button(
                    onClick = {
                        confirmed = true
                        haptic.playPattern("water")
                        scope.launch {
                            ApiClient.logBreak("water", "done", amountMl)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
                    modifier = Modifier.height(34.dp)
                ) {
                    Text("Confirmar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                Text(
                    text = "¡Hidratación anotada!",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = BandGreen
                )
            }
        }
    }
}

