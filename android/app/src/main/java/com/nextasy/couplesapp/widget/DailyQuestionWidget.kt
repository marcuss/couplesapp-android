package com.nextasy.couplesapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.nextasy.couplesapp.R
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

/**
 * DailyQuestionWidget
 *
 * Android AppWidget that displays the daily couple question from LoveCompass.
 * Reads the Supabase auth token from SharedPreferences (written by the Capacitor app),
 * fetches today's question, and updates the widget RemoteViews.
 *
 * Size: 4×2 cells (full-width, medium height)
 * Design: rose-to-pink gradient, bold white text, compass icon
 */
class DailyQuestionWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_REFRESH = "com.nextasy.couplesapp.widget.REFRESH"

        private const val SUPABASE_URL = "https://klpshxvjzsdqolkrabvb.supabase.co"
        private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscHNoeHZqenNkcW9sa3JhYnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5NTQ5NzUsImV4cCI6MjA1NjUzMDk3NX0.LuQPRBTPnABknkHGmUGMHu_D-LMn4JtSCF5V2V7ZQAM"

        // SharedPreferences keys (Capacitor stores these via the app)
        private const val PREFS_NAME = "CapacitorStorage"
        private const val KEY_AUTH_TOKEN = "supabase.auth.token"
        private const val KEY_COUPLE_ID = "supabase.couple.id"

        // Deep link to /daily-question in the Capacitor WebView
        private const val DEEP_LINK_URL = "com.nextasy.couplesapp://daily-question"

        private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

        /**
         * Trigger a refresh of all active widget instances.
         * Called from the main app after the user logs in.
         */
        fun requestUpdate(context: Context) {
            val intent = Intent(context, DailyQuestionWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val ids = AppWidgetManager.getInstance(context)
                    .getAppWidgetIds(ComponentName(context, DailyQuestionWidget::class.java))
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                ComponentName(context, DailyQuestionWidget::class.java)
            )
            onUpdate(context, appWidgetManager, ids)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Show loading state immediately
        val loadingViews = RemoteViews(context.packageName, R.layout.widget_daily_question)
        loadingViews.setTextViewText(R.id.widget_question_text, "Loading today's question…")
        loadingViews.setTextViewText(R.id.widget_category, "🧭 LoveCompass")
        appWidgetManager.updateAppWidget(appWidgetId, loadingViews)

        scope.launch {
            val views = buildRemoteViews(context)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private suspend fun buildRemoteViews(context: Context): RemoteViews = withContext(Dispatchers.IO) {
        val views = RemoteViews(context.packageName, R.layout.widget_daily_question)

        // Set up tap intent → open app at /daily-question
        val openIntent = Intent(Intent.ACTION_VIEW).apply {
            setPackage(context.packageName)
            data = android.net.Uri.parse(DEEP_LINK_URL)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

        // Load auth credentials
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_AUTH_TOKEN, null)
        val coupleId = prefs.getString(KEY_COUPLE_ID, null)

        if (token.isNullOrEmpty() || coupleId.isNullOrEmpty()) {
            views.setTextViewText(R.id.widget_question_text, "Open LoveCompass to get started 💕")
            views.setTextViewText(R.id.widget_category, "🧭 LoveCompass")
            return@withContext views
        }

        // Fetch today's question
        val result = fetchDailyQuestion(coupleId, token)
        if (result != null) {
            views.setTextViewText(R.id.widget_question_text, result.first)
            views.setTextViewText(R.id.widget_category, "${categoryIcon(result.second)} ${result.second.replaceFirstChar { it.uppercase() }}")
        } else {
            views.setTextViewText(R.id.widget_question_text, "What's one thing you love most about us?")
            views.setTextViewText(R.id.widget_category, "🧭 Daily Question")
        }

        views
    }

    private fun fetchDailyQuestion(coupleId: String, token: String): Pair<String, String>? {
        return try {
            val url = URL("$SUPABASE_URL/rest/v1/rpc/get_daily_question")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")
            conn.setRequestProperty("apikey", ANON_KEY)
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.connectTimeout = 15_000
            conn.readTimeout = 15_000
            conn.doOutput = true

            val body = """{"p_couple_id":"$coupleId"}"""
            conn.outputStream.use { it.write(body.toByteArray()) }

            if (conn.responseCode in 200..299) {
                val response = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(response)
                val translations = json.optJSONObject("translations")
                val lang = Locale.getDefault().language
                val text = translations?.optString(lang)?.takeIf { it.isNotEmpty() }
                    ?: translations?.optString("en")?.takeIf { it.isNotEmpty() }
                    ?: "What do you love most about us?"
                val category = json.optString("category", "communication")
                Pair(text, category)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun categoryIcon(category: String): String = when (category) {
        "communication" -> "💬"
        "intimacy" -> "💕"
        "dreams" -> "🌟"
        "memories" -> "📸"
        "values" -> "🌿"
        "fun" -> "😄"
        "gratitude" -> "🙏"
        "conflict" -> "🤝"
        "finances" -> "💰"
        "growth" -> "🌱"
        "family" -> "👨‍👩‍👧"
        "adventure" -> "🗺️"
        else -> "🧭"
    }
}
