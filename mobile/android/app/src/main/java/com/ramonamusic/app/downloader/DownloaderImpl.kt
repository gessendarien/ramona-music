package com.ramonamusic.app.downloader

import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import org.schabi.newpipe.extractor.exceptions.ReCaptchaException
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * OkHttp-based Downloader implementation required by NewPipeExtractor.
 * This handles all HTTP requests that the extractor makes internally
 * when fetching page data from YouTube.
 */
class DownloaderImpl private constructor() : Downloader() {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    companion object {
        private var instance: DownloaderImpl? = null

        @JvmStatic
        fun getInstance(): DownloaderImpl {
            if (instance == null) {
                instance = DownloaderImpl()
            }
            return instance!!
        }
    }

    override fun execute(request: Request): Response {
        val httpMethod = request.httpMethod()
        val url = request.url()
        val headers = request.headers()
        val dataToSend = request.dataToSend()

        val requestBuilder = okhttp3.Request.Builder()
            .url(url)
            .method(
                httpMethod,
                if (dataToSend != null) dataToSend.toRequestBody() else null
            )

        // Add all headers from the NewPipe request
        for ((headerName, headerValueList) in headers) {
            if (headerValueList.size > 1) {
                requestBuilder.removeHeader(headerName)
                for (headerValue in headerValueList) {
                    requestBuilder.addHeader(headerName, headerValue)
                }
            } else if (headerValueList.size == 1) {
                requestBuilder.header(headerName, headerValueList[0])
            }
        }

        val response = client.newCall(requestBuilder.build()).execute()
        val responseCode = response.code

        if (responseCode == 429) {
            response.close()
            throw ReCaptchaException("reCaptcha Challenge requested", url)
        }

        val responseBody = response.body?.string() ?: ""
        val latestUrl = response.request.url.toString()

        val responseHeaders: MutableMap<String, List<String>> = mutableMapOf()
        for (headerName in response.headers.names()) {
            responseHeaders[headerName] = response.headers.values(headerName)
        }

        response.close()

        return Response(
            responseCode,
            response.message,
            responseHeaders,
            responseBody,
            latestUrl
        )
    }
}
