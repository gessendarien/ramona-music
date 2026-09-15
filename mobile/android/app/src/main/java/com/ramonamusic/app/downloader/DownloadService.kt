package com.ramonamusic.app.downloader

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Android Foreground Service that handles music downloads in the background.
 *
 * This service:
 * - Survives app minimization, screen off, and Doze Mode
 * - Shows a persistent notification with download progress
 * - Downloads audio files using OkHttp with proper headers
 * - Emits progress events to React Native via RCTDeviceEventEmitter
 * - Supports queued downloads (processes one at a time)
 */
class DownloadService : Service() {

    companion object {
        const val ACTION_START_DOWNLOAD = "com.ramonamusic.app.START_DOWNLOAD"

        const val EXTRA_VIDEO_ID = "video_id"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_STREAM_URL = "stream_url"

        private const val CHANNEL_ID = "ramona_downloads"
        private const val CHANNEL_NAME = "Ramona Music Downloads"
        private const val NOTIFICATION_ID = 9001
        private const val TAG = "DownloadService"

        private const val USER_AGENT =
            "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/116.0.0.0 Mobile Safari/537.36"
    }

    private data class DownloadTask(
        val videoId: String,
        val title: String,
        val artist: String,
        val streamUrl: String
    )

    private val downloadQueue = ConcurrentLinkedQueue<DownloadTask>()
    private val isProcessing = AtomicBoolean(false)
    private val executor = Executors.newSingleThreadExecutor()

    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_START_DOWNLOAD) {
            val videoId = intent.getStringExtra(EXTRA_VIDEO_ID) ?: return START_NOT_STICKY
            val title = intent.getStringExtra(EXTRA_TITLE) ?: "Unknown"
            val artist = intent.getStringExtra(EXTRA_ARTIST) ?: "Unknown Artist"
            val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: return START_NOT_STICKY

            val task = DownloadTask(videoId, title, artist, streamUrl)
            downloadQueue.add(task)

            // Show foreground notification immediately
            startForeground(NOTIFICATION_ID, buildNotification("Preparing download...", 0))

            processQueue()
        }

        return START_NOT_STICKY
    }

    /**
     * Process the download queue sequentially.
     */
    private fun processQueue() {
        if (isProcessing.compareAndSet(false, true)) {
            executor.execute {
                while (downloadQueue.isNotEmpty()) {
                    val task = downloadQueue.poll() ?: break
                    executeDownload(task)
                }
                isProcessing.set(false)

                // Stop the service when queue is empty
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
    }

    /**
     * Execute a single download task.
     */
    private fun executeDownload(task: DownloadTask) {
        val backupDir = RamonaDownloaderModule.getBackupDir(this)

        // Sanitize filename
        val safeTitle = sanitizeFilename(task.title).take(100)
        val safeArtist = sanitizeFilename(task.artist).take(60)
        val filename = "$safeArtist - $safeTitle.mp3"
        val outputFile = File(backupDir, filename)

        // Check if already downloaded
        if (outputFile.exists() && outputFile.length() > 0) {
            Log.d(TAG, "File already exists: $filename")
            sendEvent("DOWNLOAD_COMPLETE", Arguments.createMap().apply {
                putString("trackId", task.videoId)
                putString("filename", filename)
            })
            return
        }

        try {
            updateNotification("Downloading: ${task.title}", 0)

            val request = Request.Builder()
                .url(task.streamUrl)
                .header("User-Agent", USER_AGENT)
                .build()

            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful) {
                Log.e(TAG, "Download failed with HTTP ${response.code}")
                sendEvent("DOWNLOAD_ERROR", Arguments.createMap().apply {
                    putString("trackId", task.videoId)
                    putString("error", "HTTP ${response.code}")
                })
                response.close()
                return
            }

            val body = response.body
            if (body == null) {
                sendEvent("DOWNLOAD_ERROR", Arguments.createMap().apply {
                    putString("trackId", task.videoId)
                    putString("error", "Empty response body")
                })
                response.close()
                return
            }

            val contentLength = body.contentLength()
            val tempFile = File(backupDir, "${task.videoId}.tmp")

            var bytesDownloaded = 0L
            var lastProgressEmit = 0

            body.byteStream().use { inputStream ->
                FileOutputStream(tempFile).use { outputStream ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int

                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        outputStream.write(buffer, 0, bytesRead)
                        bytesDownloaded += bytesRead

                        // Calculate and emit progress
                        if (contentLength > 0) {
                            val progress = ((bytesDownloaded * 100) / contentLength).toInt()
                                .coerceIn(0, 100)

                            // Only emit every 2% to avoid flooding
                            if (progress - lastProgressEmit >= 2 || progress == 100) {
                                lastProgressEmit = progress
                                updateNotification("${task.title}", progress)
                                sendEvent("DOWNLOAD_PROGRESS", Arguments.createMap().apply {
                                    putString("trackId", task.videoId)
                                    putInt("progress", progress)
                                })
                            }
                        }
                    }
                }
            }

            response.close()

            // Rename temp file to final filename
            if (tempFile.exists() && tempFile.length() > 0) {
                if (outputFile.exists()) {
                    outputFile.delete()
                }
                tempFile.renameTo(outputFile)

                Log.d(TAG, "Download complete: $filename (${outputFile.length()} bytes)")
                sendEvent("DOWNLOAD_COMPLETE", Arguments.createMap().apply {
                    putString("trackId", task.videoId)
                    putString("filename", filename)
                })
            } else {
                Log.e(TAG, "Downloaded file is empty or missing")
                tempFile.delete()
                sendEvent("DOWNLOAD_ERROR", Arguments.createMap().apply {
                    putString("trackId", task.videoId)
                    putString("error", "Downloaded file is empty")
                })
            }

        } catch (e: Exception) {
            Log.e(TAG, "Download error for ${task.videoId}", e)

            // Clean up temp file
            File(backupDir, "${task.videoId}.tmp").delete()

            sendEvent("DOWNLOAD_ERROR", Arguments.createMap().apply {
                putString("trackId", task.videoId)
                putString("error", e.message ?: "Unknown download error")
            })
        }
    }

    /**
     * Send an event to the React Native JavaScript side.
     */
    private fun sendEvent(eventName: String, params: com.facebook.react.bridge.WritableMap) {
        try {
            val reactContext = (application as? com.facebook.react.ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext

            reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send event $eventName", e)
        }
    }

    /**
     * Create the notification channel (required for Android 8.0+).
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows download progress for music backups"
                setShowBadge(false)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    /**
     * Build a notification with the given content and progress.
     */
    private fun buildNotification(content: String, progress: Int): Notification {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Ramona Music")
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)

        if (progress in 1..99) {
            builder.setProgress(100, progress, false)
            builder.setSmallIcon(android.R.drawable.stat_sys_download)
        } else if (progress >= 100) {
            builder.setProgress(0, 0, false)
            builder.setSmallIcon(android.R.drawable.stat_sys_download_done)
            builder.setContentText("Download complete: $content")
            builder.setOngoing(false)
        }

        return builder.build()
    }

    /**
     * Update the foreground notification with new progress.
     */
    private fun updateNotification(content: String, progress: Int) {
        val notification = buildNotification(content, progress)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    /**
     * Sanitize a string for use as a filename.
     */
    private fun sanitizeFilename(name: String): String {
        return name.replace(Regex("[/\\\\:*?\"<>|]"), "_").trim()
    }

    override fun onDestroy() {
        super.onDestroy()
        executor.shutdownNow()
    }
}
