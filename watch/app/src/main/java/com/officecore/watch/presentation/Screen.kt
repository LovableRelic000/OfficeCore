package com.officecore.watch.presentation

sealed class Screen(val route: String) {
    object Energy : Screen("energy")
    object Home : Screen("home")
    object Posture : Screen("posture")
    object Focus : Screen("focus")
    object Caffeine : Screen("caffeine")
    object Water : Screen("water")
    object Breathing : Screen("breathing")
    object Alert : Screen("alert")
    object Stress : Screen("stress")
    object Environment : Screen("environment")
    object DayClose : Screen("day_close")
    object Calibration : Screen("calibration")
    object Settings : Screen("settings")
}

