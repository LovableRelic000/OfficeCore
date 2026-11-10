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

data class WatchDrink(val name: String, val mg: Int)

val WATCH_DRINKS = listOf(
    WatchDrink("Americano", 95),
    WatchDrink("Espresso", 65),
    WatchDrink("Té negro", 47),
    WatchDrink("Té verde", 28),
    WatchDrink("Energética", 80),
    WatchDrink("Refresco cola", 34)
)

@Composable
fun CaffeineScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    val scope = rememberCoroutineScope()
    var selectedIdx by remember { mutableStateOf(0) }
    var isLogged by remember { mutableStateOf(false) }
    var rotaryDelta by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }

    val drink = WATCH_DRINKS[selectedIdx]

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                rotaryDelta += it.verticalScrollPixels
                if (rotaryDelta >= 28f) {
                    selectedIdx = (selectedIdx + 1) % WATCH_DRINKS.size
                    haptic.playRotaryDetent()
                    rotaryDelta = 0f
                } else if (rotaryDelta <= -28f) {
                    selectedIdx = (selectedIdx - 1 + WATCH_DRINKS.size) % WATCH_DRINKS.size
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
                text = "Gira el Bisel",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Accent
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = drink.name,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
            Text(
                text = "+${drink.mg} mg",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BandAmber
            )

            Spacer(modifier = Modifier.height(6.dp))

            if (!isLogged) {
                Button(
                    onClick = {
                        isLogged = true
                        haptic.playPattern("water")
                        scope.launch {
                            ApiClient.logCaffeine(drink.name, "Mediano", drink.mg)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
                    modifier = Modifier.height(34.dp)
                ) {
                    Text("Registrar Toma", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                Text(
                    text = "¡Registrado!",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = BandGreen
                )
            }
        }
    }
}

