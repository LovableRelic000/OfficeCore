package com.officecore.watch.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.officecore.watch.BuildConfig
import com.officecore.watch.theme.*

@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    var hapticStrong by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Surface)
            .padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Ajustes",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Accent
        )

        Spacer(modifier = Modifier.height(6.dp))

        ToggleChip(
            checked = hapticStrong,
            onCheckedChange = { hapticStrong = it },
            label = { Text("Háptica Fuerte", fontSize = 11.sp, color = TextPrimary) },
            toggleControl = {
                Switch(checked = hapticStrong)
            },
            colors = ToggleChipDefaults.toggleChipColors(
                checkedEndBackgroundColor = SurfaceDeep,
                uncheckedEndBackgroundColor = SurfaceDeep
            ),
            modifier = Modifier.fillMaxWidth().height(42.dp)
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Backend: ${BuildConfig.BACKEND_URL.replace("http://", "")}",
            fontSize = 9.sp,
            color = TextMuted
        )
    }
}

