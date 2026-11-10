package com.officecore.watch.presentation

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.data.api.ApiClient
import com.officecore.watch.data.api.EnergyResponse
import com.officecore.watch.theme.*
import kotlinx.coroutines.launch

@Composable
fun EnergyScreen(
    onNavigateHome: () -> Unit
) {
    var energy by remember { mutableStateOf(EnergyResponse()) }
    var focusedRing by remember { mutableStateOf(0) } // 0: Physical, 1: Mental, 2: Caffeine
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        ApiClient.getEnergyNow().onSuccess { energy = it }
        focusRequester.requestFocus()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                if (it.verticalScrollPixels > 0) {
                    focusedRing = (focusedRing + 1) % 3
                } else if (it.verticalScrollPixels < 0) {
                    focusedRing = (focusedRing + 2) % 3
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable(),
        contentAlignment = Alignment.Center
    ) {
        // Draw 3 Concentric Neumorphic Rings
        Canvas(modifier = Modifier.size(190.dp)) {
            val strokeW = 10.dp.toPx()
            val center = size.width / 2

            // Ring 1: Physical (outer)
            val r1 = center - strokeW
            drawCircle(
                color = SurfaceDeep,
                radius = r1,
                style = Stroke(width = strokeW)
            )
            drawArc(
                color = BandGreen,
                startAngle = -90f,
                sweepAngle = (energy.physical / 100f) * 360f,
                useCenter = false,
                style = Stroke(width = strokeW, cap = StrokeCap.Round)
            )

            // Ring 2: Mental (middle)
            val r2 = r1 - strokeW - 4.dp.toPx()
            drawCircle(
                color = SurfaceDeep,
                radius = r2,
                style = Stroke(width = strokeW)
            )
            drawArc(
                color = Accent,
                startAngle = -90f,
                sweepAngle = (energy.mental / 100f) * 360f,
                useCenter = false,
                style = Stroke(width = strokeW, cap = StrokeCap.Round)
            )

            // Ring 3: Caffeine (inner)
            val r3 = r2 - strokeW - 4.dp.toPx()
            drawCircle(
                color = SurfaceDeep,
                radius = r3,
                style = Stroke(width = strokeW)
            )
            drawArc(
                color = BandAmber,
                startAngle = -90f,
                sweepAngle = (energy.caffeineLoad / 100f) * 360f,
                useCenter = false,
                style = Stroke(width = strokeW, cap = StrokeCap.Round)
            )
        }

        // Center Score & Focused Ring Label
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "${energy.overall}",
                fontSize = 34.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            val ringLabel = when (focusedRing) {
                0 -> "Física ${energy.physical.toInt()}%"
                1 -> "Mental ${energy.mental.toInt()}%"
                else -> "Cafeína ${energy.caffeineLoad.toInt()}%"
            }
            Text(
                text = ringLabel,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = when (focusedRing) {
                    0 -> BandGreen
                    1 -> Accent
                    else -> BandAmber
                }
            )
            Spacer(modifier = Modifier.height(4.dp))
            CompactChip(
                onClick = onNavigateHome,
                label = { Text("Módulos", fontSize = 10.sp, color = TextSecondary) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep)
            )
        }
    }
}

