package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.sensor.HapticController
import com.officecore.watch.theme.*
import kotlinx.coroutines.delay

@Composable
fun CalibrationScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val haptic = remember { HapticController(context) }
    var secondsLeft by remember { mutableStateOf(30) }
    var isCalibrating by remember { mutableStateOf(false) }

    LaunchedEffect(isCalibrating, secondsLeft) {
        if (isCalibrating && secondsLeft > 0) {
            delay(1000)
            secondsLeft -= 1
        } else if (isCalibrating && secondsLeft == 0) {
            isCalibrating = false
            haptic.playPattern("water")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Calibrar Postura",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Accent
        )

        Spacer(modifier = Modifier.height(4.dp))

        if (isCalibrating) {
            Text(
                text = "${secondsLeft}s",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
            Text(
                text = "Teclea normalmente...",
                fontSize = 10.sp,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
        } else if (secondsLeft == 0) {
            Text(
                text = "¡Calibrado!",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = BandGreen
            )
            Spacer(modifier = Modifier.height(6.dp))
            CompactChip(
                onClick = onBack,
                label = { Text("Volver", fontSize = 11.sp, color = TextPrimary) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep)
            )
        } else {
            Text(
                text = "Coloca el antebrazo en tu postura ideal y teclea.",
                fontSize = 11.sp,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = {
                    isCalibrating = true
                    secondsLeft = 30
                },
                colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
                modifier = Modifier.height(34.dp)
            ) {
                Text("Iniciar (30s)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

