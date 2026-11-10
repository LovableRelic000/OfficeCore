package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.theme.*

@Composable
fun DayCloseScreen(
    onStartBreathingRitual: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Cierre de Jornada",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Accent
        )

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("120m", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("Foco", fontSize = 10.sp, color = TextMuted)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("10m", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BandAmber)
                Text("Deuda", fontSize = 10.sp, color = TextMuted)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("95mg", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BandGreen)
                Text("Café", fontSize = 10.sp, color = TextMuted)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
            onClick = onStartBreathingRitual,
            colors = ButtonDefaults.buttonColors(backgroundColor = Accent),
            modifier = Modifier.height(34.dp)
        ) {
            Text("Cerrar Día (1m)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

