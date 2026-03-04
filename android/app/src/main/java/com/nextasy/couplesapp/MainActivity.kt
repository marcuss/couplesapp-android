package com.nextasy.couplesapp

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(DebugPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
