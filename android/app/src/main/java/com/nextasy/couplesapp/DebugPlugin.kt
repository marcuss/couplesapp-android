package com.nextasy.couplesapp

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray

@CapacitorPlugin(name = "Debug")
class DebugPlugin : Plugin() {
    private var shakeDetector: ShakeDetector? = null
    private var sensorManager: SensorManager? = null

    override fun load() {
        if (DebugManager.isDebugEnabled(context)) {
            sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            shakeDetector = ShakeDetector {
                notifyListeners("shake", JSObject())
            }
            val accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            sensorManager?.registerListener(
                shakeDetector,
                accelerometer,
                SensorManager.SENSOR_DELAY_UI
            )
        }
    }

    @PluginMethod
    fun isDebugEnabled(call: PluginCall) {
        val ret = JSObject()
        ret.put("enabled", DebugManager.isDebugEnabled(context))
        call.resolve(ret)
    }

    @PluginMethod
    fun getLogs(call: PluginCall) {
        val logs = LogInterceptor.getLogs()
        val arr = JSONArray()
        logs.forEach { arr.put(it.toJson()) }
        val ret = JSObject()
        ret.put("logs", arr)
        call.resolve(ret)
    }

    @PluginMethod
    fun getDeviceInfo(call: PluginCall) {
        val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val ret = JSObject().apply {
            put("model", android.os.Build.MODEL)
            put("systemVersion", "Android ${android.os.Build.VERSION.RELEASE}")
            put("appVersion", pInfo.versionName)
            put("buildNumber", pInfo.longVersionCode.toString())
            put("environment", if (DebugManager.isDebugEnabled(context)) "Debug/Internal" else "Production")
            put("bundleId", context.packageName)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun clearLogs(call: PluginCall) {
        LogInterceptor.clearLogs()
        call.resolve()
    }

    override fun handleOnDestroy() {
        sensorManager?.unregisterListener(shakeDetector)
    }
}
