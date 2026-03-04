package com.nextasy.couplesapp

import android.content.Context

object DebugManager {
    fun isDebugEnabled(context: Context): Boolean {
        // DEBUG build always enabled
        if (BuildConfig.DEBUG) return true

        // Firebase App Distribution installer check
        return try {
            val installer = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                context.packageManager
                    .getInstallSourceInfo(context.packageName)
                    .installingPackageName
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getInstallerPackageName(context.packageName)
            }
            installer == "com.google.firebase.appdistribution" ||
            installer == "com.android.vending.debug"
        } catch (e: Exception) {
            false
        }
    }
}
