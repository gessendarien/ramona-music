package com.ramonamusic.app.downloader

import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.stream.AudioStream
import java.io.File
import java.util.concurrent.Executors

/**
 * React Native native module that provides:
 * - Stream URL extraction via NewPipeExtractor (replaces WebView-based StreamExtractor.js)
 * - Download initiation via DownloadService (Foreground Service)
 * - Library scanning of downloaded tracks
 */
class RamonaDownloaderModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newFixedThreadPool(3)
    private var isInitialized = false

    companion object {
        const val NAME = "RamonaDownloader"
        private const val TAG = "RamonaDownloader"

        fun getBackupDir(context: android.content.Context): File {
            val dir = File(context.filesDir, "ramona/backups")
            if (!dir.exists()) {
                dir.mkdirs()
            }
            return dir
        }
    }

    override fun getName(): String = NAME

    /**
     * Initialize NewPipeExtractor. Called lazily on first use.
     */
    private fun ensureInitialized() {
        if (!isInitialized) {
            synchronized(this) {
                if (!isInitialized) {
                    try {
                        NewPipe.init(DownloaderImpl.getInstance())
                        isInitialized = true
                        Log.d(TAG, "NewPipeExtractor initialized successfully")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to initialize NewPipeExtractor", e)
                    }
                }
            }
        }
    }

    /**
     * Send events to JavaScript (React Native) side.
     */
    fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * Extract the best audio stream URL for a YouTube video.
     * Called from JS: RamonaDownloader.extractStreamUrl(videoId)
     * Returns a direct audio URL string.
     */
    @ReactMethod
    fun extractStreamUrl(videoId: String, promise: Promise) {
        executor.execute {
            try {
                ensureInitialized()

                val url = "https://www.youtube.com/watch?v=$videoId"
                val extractor = ServiceList.YouTube
                    .getStreamExtractor(url)
                extractor.fetchPage()

                val audioStreams: List<AudioStream> = extractor.audioStreams
                    ?: emptyList()

                if (audioStreams.isEmpty()) {
                    promise.reject("NO_AUDIO", "No audio streams found for video $videoId")
                    return@execute
                }

                // Pick the highest bitrate audio stream
                val bestStream = audioStreams.maxByOrNull { it.averageBitrate }
                    ?: audioStreams[0]

                val streamUrl = bestStream.content
                if (streamUrl.isNullOrEmpty()) {
                    promise.reject("NO_URL", "Audio stream URL is empty for video $videoId")
                    return@execute
                }

                Log.d(TAG, "Extracted stream for $videoId: bitrate=${bestStream.averageBitrate}, format=${bestStream.format?.name}")
                promise.resolve(streamUrl)

            } catch (e: Exception) {
                Log.e(TAG, "Error extracting stream URL for $videoId", e)
                promise.reject("EXTRACTION_ERROR", "Failed to extract stream: ${e.message}", e)
            }
        }
    }

    /**
     * Start downloading a track. Extracts the audio URL first, then delegates
     * to DownloadService (Foreground Service) for reliable background downloading.
     * Called from JS: RamonaDownloader.startDownload(videoId, title, artist)
     */
    @ReactMethod
    fun startDownload(videoId: String, title: String, artist: String, promise: Promise) {
        executor.execute {
            try {
                ensureInitialized()

                // Extract audio stream URL
                val url = "https://www.youtube.com/watch?v=$videoId"
                val extractor = ServiceList.YouTube
                    .getStreamExtractor(url)
                extractor.fetchPage()

                val audioStreams = extractor.audioStreams ?: emptyList()
                if (audioStreams.isEmpty()) {
                    promise.reject("NO_AUDIO", "No audio streams found")
                    return@execute
                }

                val bestStream = audioStreams.maxByOrNull { it.averageBitrate }
                    ?: audioStreams[0]
                val streamUrl = bestStream.content

                if (streamUrl.isNullOrEmpty()) {
                    promise.reject("NO_URL", "Audio stream URL is empty")
                    return@execute
                }

                // Start DownloadService with the extracted URL
                val intent = Intent(reactContext, DownloadService::class.java).apply {
                    action = DownloadService.ACTION_START_DOWNLOAD
                    putExtra(DownloadService.EXTRA_VIDEO_ID, videoId)
                    putExtra(DownloadService.EXTRA_TITLE, title)
                    putExtra(DownloadService.EXTRA_ARTIST, artist)
                    putExtra(DownloadService.EXTRA_STREAM_URL, streamUrl)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactContext.startForegroundService(intent)
                } else {
                    reactContext.startService(intent)
                }

                promise.resolve("Download started")

            } catch (e: Exception) {
                Log.e(TAG, "Error starting download for $videoId", e)
                promise.reject("DOWNLOAD_START_ERROR", "Failed to start download: ${e.message}", e)
            }
        }
    }

    /**
     * Scan the backup directory and return metadata for all downloaded tracks.
     * Called from JS: RamonaDownloader.getLibraryTracks()
     * Returns a JSON string of the tracks array.
     */
    @ReactMethod
    fun getLibraryTracks(promise: Promise) {
        executor.execute {
            try {
                val backupDir = getBackupDir(reactContext)
                val tracksArray = Arguments.createArray()

                if (backupDir.exists() && backupDir.isDirectory) {
                    val audioFiles = backupDir.listFiles { file ->
                        file.isFile && (file.name.endsWith(".mp3", true)
                                || file.name.endsWith(".m4a", true)
                                || file.name.endsWith(".mp4", true))
                    }

                    audioFiles?.sortedByDescending { it.lastModified() }?.forEachIndexed { index, file ->
                        val trackMap = Arguments.createMap()

                        // Parse "Artist - Title.mp3" format
                        val nameWithoutExt = file.nameWithoutExtension
                        val parts = nameWithoutExt.split(" - ", limit = 2)
                        val artist: String
                        val title: String

                        if (parts.size >= 2) {
                            artist = parts[0]
                            title = parts[1]
                        } else {
                            artist = "Unknown Artist"
                            title = nameWithoutExt
                        }

                        trackMap.putString("id", "library-$index")
                        trackMap.putString("originalId", null) // No YouTube ID stored in filename
                        trackMap.putString("title", title)
                        trackMap.putString("artist", artist)
                        trackMap.putString("duration", "--:--")
                        trackMap.putBoolean("isLocal", true)
                        trackMap.putString("filePath", file.absolutePath)
                        trackMap.putString("localUrl", "file://${file.absolutePath}")
                        trackMap.putString(
                            "thumbnail",
                            "https://via.placeholder.com/150/0e0e0e/ffb3ae?text=Local"
                        )

                        tracksArray.pushMap(trackMap)
                    }
                }

                val result = Arguments.createMap()
                result.putArray("tracks", tracksArray)
                promise.resolve(result)

            } catch (e: Exception) {
                Log.e(TAG, "Error scanning library", e)
                promise.reject("LIBRARY_ERROR", "Failed to scan library: ${e.message}", e)
            }
        }
    }

    /**
     * Required for NativeEventEmitter support on Android.
     */
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN event emitter
    }
}
