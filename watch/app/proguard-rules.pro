# Keep Compose and Serialization
-keepattributes *Annotation*
-dontwarn java.lang.invoke.**
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}
-keep class com.officecore.watch.data.api.** { *; }

