package com.nextasy.couplesapp

import org.json.JSONObject
import java.time.Instant
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

data class LogEntry(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: String = Instant.now().toString(),
    val level: String,
    val message: String,
    val metadata: Map<String, String>? = null
) {
    fun toJson() = JSONObject().apply {
        put("id", id)
        put("timestamp", timestamp)
        put("level", level)
        put("message", message)
        metadata?.forEach { (k, v) -> put(k, v) }
    }
}

object LogInterceptor {
    private val logs = CopyOnWriteArrayList<LogEntry>()
    private const val MAX_LOGS = 500

    fun log(message: String, level: String = "info", metadata: Map<String, String>? = null) {
        if (logs.size >= MAX_LOGS) logs.removeAt(0)
        logs.add(LogEntry(level = level, message = message, metadata = metadata))
    }

    fun getLogs(): List<LogEntry> = logs.toList()
    fun clearLogs() = logs.clear()
}
