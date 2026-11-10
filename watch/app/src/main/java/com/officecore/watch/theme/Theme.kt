package com.officecore.watch.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.MaterialTheme

val WearColors = Colors(
    primary = Accent,
    primaryVariant = AccentLight,
    secondary = BandAmber,
    secondaryVariant = BandGreen,
    background = Surface,
    surface = SurfaceDeep,
    error = BandRed,
    onPrimary = Color(0xFFFFFFFF),
    onSecondary = Color(0xFFFFFFFF),
    onBackground = TextPrimary,
    onSurface = TextSecondary,
    onError = Color(0xFFFFFFFF),
)

@Composable
fun OfficeCoreWatchTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colors = WearColors,
        content = content
    )
}

