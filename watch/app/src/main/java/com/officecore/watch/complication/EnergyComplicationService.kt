package com.officecore.watch.complication

import androidx.wear.watchface.complications.data.*
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import com.officecore.watch.data.api.ApiClient

class EnergyComplicationService : SuspendingComplicationDataSourceService() {

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
        val energy = ApiClient.getEnergyNow().getOrDefault(com.officecore.watch.data.api.EnergyResponse())

        return when (request.complicationType) {
            ComplicationType.RANGED_VALUE -> {
                RangedValueComplicationData.Builder(
                    value = energy.overall.toFloat(),
                    min = 0f,
                    max = 100f,
                    contentDescription = PlainComplicationText.Builder("Energía: ${energy.overall}").build()
                )
                    .setText(PlainComplicationText.Builder("${energy.overall}").build())
                    .setTitle(PlainComplicationText.Builder("ENERGÍA").build())
                    .build()
            }
            ComplicationType.SHORT_TEXT -> {
                ShortTextComplicationData.Builder(
                    text = PlainComplicationText.Builder("${energy.overall}").build(),
                    contentDescription = PlainComplicationText.Builder("Energía").build()
                )
                    .setTitle(PlainComplicationText.Builder("OC").build())
                    .build()
            }
            else -> null
        }
    }

    override fun getPreviewData(type: ComplicationType): ComplicationData? {
        return when (type) {
            ComplicationType.RANGED_VALUE -> {
                RangedValueComplicationData.Builder(
                    value = 82f,
                    min = 0f,
                    max = 100f,
                    contentDescription = PlainComplicationText.Builder("Energía").build()
                )
                    .setText(PlainComplicationText.Builder("82").build())
                    .setTitle(PlainComplicationText.Builder("ENERGÍA").build())
                    .build()
            }
            ComplicationType.SHORT_TEXT -> {
                ShortTextComplicationData.Builder(
                    text = PlainComplicationText.Builder("82").build(),
                    contentDescription = PlainComplicationText.Builder("Energía").build()
                ).build()
            }
            else -> null
        }
    }
}

