package com.officecore.watch.tile

import androidx.wear.tiles.*
import androidx.wear.tiles.material.CompactChip
import androidx.wear.tiles.material.Text
import androidx.wear.tiles.material.Typography
import androidx.wear.tiles.material.layouts.PrimaryLayout
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.officecore.watch.data.api.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.guava.future

class EnergyTileService : TileService() {
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        return scope.future {
            val energy = ApiClient.getEnergyNow().getOrDefault(com.officecore.watch.data.api.EnergyResponse())

            val primaryLayout = PrimaryLayout.Builder(requestParams.deviceParameters!!)
                .setPrimaryLabelTextContent(
                    Text.Builder(this@EnergyTileService, "OfficeCore Energía")
                        .setTypography(Typography.TYPOGRAPHY_CAPTION1)
                        .setColor(ColorBuilders.argb(0xFF9B72CF.toInt()))
                        .build()
                )
                .setContent(
                    LayoutElementBuilders.Column.Builder()
                        .addContent(
                            Text.Builder(this@EnergyTileService, "${energy.overall}")
                                .setTypography(Typography.TYPOGRAPHY_DISPLAY1)
                                .setColor(ColorBuilders.argb(0xFF4A5568.toInt()))
                                .build()
                        )
                        .addContent(
                            Text.Builder(this@EnergyTileService, "Física ${energy.physical.toInt()}% • Mental ${energy.mental.toInt()}%")
                                .setTypography(Typography.TYPOGRAPHY_CAPTION2)
                                .setColor(ColorBuilders.argb(0xFF718096.toInt()))
                                .build()
                        )
                        .build()
                )
                .build()

            TileBuilders.Tile.Builder()
                .setResourcesVersion("1")
                .setTimeline(
                    TimelineBuilders.Timeline.Builder()
                        .addTimelineEntry(
                            TimelineBuilders.TimelineEntry.Builder()
                                .setLayout(
                                    LayoutElementBuilders.Layout.Builder()
                                        .setRoot(primaryLayout)
                                        .build()
                                )
                                .build()
                        )
                        .build()
                )
                .build()
        }
    }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<androidx.wear.protolayout.ResourceBuilders.Resources> {
        return Futures.immediateFuture(
            androidx.wear.protolayout.ResourceBuilders.Resources.Builder()
                .setVersion("1")
                .build()
        )
    }
}

