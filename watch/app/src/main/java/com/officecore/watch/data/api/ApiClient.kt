package com.officecore.watch.data.api

import com.officecore.watch.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object ApiClient {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .build()

    private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

    private fun buildRequest(endpoint: String, method: String = "GET", bodyJson: String? = null): Request {
        val url = "${BuildConfig.BACKEND_URL}$endpoint"
        val builder = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer ${BuildConfig.DEMO_TOKEN}")
            .addHeader("Content-Type", "application/json")

        if (method == "POST") {
            builder.post((bodyJson ?: "{}").toRequestBody(JSON_MEDIA))
        } else if (method == "PATCH") {
            builder.patch((bodyJson ?: "{}").toRequestBody(JSON_MEDIA))
        }

        return builder.build()
    }

    suspend fun getEnergyNow(): Result<EnergyResponse> = withContext(Dispatchers.IO) {
        try {
            val req = buildRequest("/energy/now")
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val str = res.body?.string() ?: ""
                    Result.success(json.decodeFromString<EnergyResponse>(str))
                } else {
                    Result.success(EnergyResponse()) // Graceful fallback
                }
            }
        } catch (e: Exception) {
            Result.success(EnergyResponse())
        }
    }

    suspend fun getPostureToday(): Result<PostureDayResponse> = withContext(Dispatchers.IO) {
        try {
            val req = buildRequest("/posture/day")
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val str = res.body?.string() ?: ""
                    Result.success(json.decodeFromString<PostureDayResponse>(str))
                } else {
                    Result.success(PostureDayResponse())
                }
            }
        } catch (e: Exception) {
            Result.success(PostureDayResponse())
        }
    }

    suspend fun logCaffeine(drinkType: String, size: String, mg: Int): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = json.encodeToString(CaffeineLogRequest(drinkType, size, mg))
            val req = buildRequest("/caffeine/logs", "POST", body)
            client.newCall(req).execute().use { res ->
                Result.success(res.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logBreak(kind: String, outcome: String = "done", amountMl: Int? = null): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = json.encodeToString(BreakLogRequest(kind, outcome, amountMl))
            val req = buildRequest("/breaks", "POST", body)
            client.newCall(req).execute().use { res ->
                Result.success(res.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logBreathing(durationS: Int, pattern: String, hrBefore: Int, hrAfter: Int): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = json.encodeToString(BreathingLogRequest(durationS, pattern, hrBefore, hrAfter))
            val req = buildRequest("/wellbeing/breathing", "POST", body)
            client.newCall(req).execute().use { res ->
                Result.success(res.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestAlert(alertRequest: AlertRequest): Result<AlertResponse?> = withContext(Dispatchers.IO) {
        try {
            val body = json.encodeToString(alertRequest)
            val req = buildRequest("/alerts/request", "POST", body)
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) {
                    val str = res.body?.string() ?: ""
                    Result.success(json.decodeFromString<AlertResponse>(str))
                } else {
                    Result.success(null)
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateAlertOutcome(alertId: Int, outcome: String, snoozeMin: Int? = null): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val payload = """{"outcome":"$outcome"${snoozeMin?.let { ",\"snooze_min\":$it" } ?: ""}}"""
            val req = buildRequest("/alerts/$alertId/outcome", "POST", payload)
            client.newCall(req).execute().use { res ->
                Result.success(res.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun ingestBatch(batch: WatchIngestRequest): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val body = json.encodeToString(batch)
            val req = buildRequest("/ingest/watch", "POST", body)
            client.newCall(req).execute().use { res ->
                Result.success(res.isSuccessful)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

