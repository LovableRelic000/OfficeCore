package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.data.api.ApiClient
import com.officecore.watch.data.api.PostureDayResponse
import com.officecore.watch.theme.*

@Composable
fun PostureScreen(
    onNavigateCalibration: () -> Unit,
    onBack: () -> Unit
) {
    var posture by remember { mutableStateOf(PostureDayResponse()) }

    LaunchedEffect(Unit) {
        ApiClient.getPostureToday().onSuccess { posture = it }
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
            text = "Postura de Muñeca",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Accent
        )
        Spacer(modifier = Modifier.height(4.dp))

        // Band status indicator
        val bandColor = when {
            posture.bands.redMinutes > 10 -> BandRed
            posture.bands.amberMinutes > 15 -> BandAmber
            else -> BandGreen
        }
        val bandText = when {
            posture.bands.redMinutes > 10 -> "Banda Roja (>25°)"
            posture.bands.amberMinutes > 15 -> "Banda Ámbar (15–25°)"
            else -> "Banda Verde (<15°)"
        }

        Text(
            text = bandText,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = bandColor
        )

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "${posture.ergonomicDebtMinutes}m",
            fontSize = 32.sp,
            fontWeight = FontWeight.ExtraBold,
            color = TextPrimary
        )
        Text(
            text = "Deuda ergonómica acumulada",
            fontSize = 10.sp,
            color = TextMuted,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))
        CompactChip(
            onClick = onNavigateCalibration,
            label = { Text("Recalibrar (30s)", fontSize = 11.sp, color = TextPrimary) },
            colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep)
        )
    }
}

