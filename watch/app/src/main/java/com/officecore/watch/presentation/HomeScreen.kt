package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.theme.*
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    onNavigate: (Screen) -> Unit
) {
    val listState = rememberScalingLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    ScalingLazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .onRotaryScrollEvent {
                listState.dispatchRawDelta(it.verticalScrollPixels)
                true
            }
            .focusRequester(focusRequester)
            .focusable(),
        state = listState,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Text(
                text = "OfficeCore",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Accent,
                modifier = Modifier.padding(bottom = 6.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Energy) },
                label = { Text("Anillo de Energía", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Física • Mental • Cafeína", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Posture) },
                label = { Text("Postura de Muñeca", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Estado en vivo y deuda", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Focus) },
                label = { Text("Sesión de Foco", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Temporizador 15–120m", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Caffeine) },
                label = { Text("Registrar Cafeína", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Giro de bisel y toma", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Water) },
                label = { Text("Registrar Agua", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Pasos de 50 ml", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Breathing) },
                label = { Text("Respiración Guiada", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Ritmo 4–7–8 con háptica", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Environment) },
                label = { Text("Entorno Físico", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Ruido dB y luz lux", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Calibration) },
                label = { Text("Calibrar Muñeca (30s)", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Fijar postura neutral", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.DayClose) },
                label = { Text("Cerrar Día", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                secondaryLabel = { Text("Ritual de desconexión", color = TextMuted, fontSize = 10.sp) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }

        item {
            Chip(
                onClick = { onNavigate(Screen.Settings) },
                label = { Text("Ajustes", color = TextPrimary, fontWeight = FontWeight.SemiBold) },
                colors = ChipDefaults.chipColors(backgroundColor = SurfaceDeep),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp)
            )
        }
    }
}

