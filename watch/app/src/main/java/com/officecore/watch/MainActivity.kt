package com.officecore.watch

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.officecore.watch.presentation.*
import com.officecore.watch.sensor.SensorService
import com.officecore.watch.theme.OfficeCoreWatchTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Start background sensor monitoring service
        try {
            val serviceIntent = Intent(this, SensorService::class.java)
            startService(serviceIntent)
        } catch (e: Exception) {
            // Foreground service permission or background start exception handled gracefully
        }

        setContent {
            OfficeCoreWatchTheme {
                val navController = rememberSwipeDismissableNavController()

                SwipeDismissableNavHost(
                    navController = navController,
                    startDestination = Screen.Energy.route
                ) {
                    composable(Screen.Energy.route) {
                        EnergyScreen(
                            onNavigateHome = { navController.navigate(Screen.Home.route) }
                        )
                    }

                    composable(Screen.Home.route) {
                        HomeScreen(
                            onNavigate = { screen -> navController.navigate(screen.route) }
                        )
                    }

                    composable(Screen.Posture.route) {
                        PostureScreen(
                            onNavigateCalibration = { navController.navigate(Screen.Calibration.route) },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Focus.route) {
                        FocusScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Caffeine.route) {
                        CaffeineScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Water.route) {
                        WaterScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Breathing.route) {
                        BreathingScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Alert.route) {
                        AlertScreen(
                            onDismiss = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Stress.route) {
                        StressScreen(
                            onDismiss = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Environment.route) {
                        EnvironmentScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.DayClose.route) {
                        DayCloseScreen(
                            onStartBreathingRitual = { navController.navigate(Screen.Breathing.route) },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Calibration.route) {
                        CalibrationScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Settings.route) {
                        SettingsScreen(
                            onBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}

