package com.dovtalab.app

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.telegram.login.TelegramLogin

@CapacitorPlugin(name = "TelegramAuth")
class TelegramAuthPlugin : Plugin() {

    private val clientId = "8312544948"
    private val redirectUri = "https://app1145916531-login.tg.dev/tglogin"

    override fun load() {
        TelegramLogin.init(
            clientId = clientId,
            redirectUri = redirectUri,
            scopes = listOf("profile")
        )
    }

    @PluginMethod
    fun login(call: PluginCall) {
        saveCall(call)
        activity?.let {
            TelegramLogin.startLogin(it)
        } ?: call.reject("Activity is null")
    }

    override fun handleOnNewIntent(intent: Intent?) {
        super.handleOnNewIntent(intent)
        val savedCall = savedCall ?: return
        val uri = intent?.data ?: run {
            savedCall.reject("No intent data")
            return
        }

        if (uri.host == "app1145916531-login.tg.dev") {
            TelegramLogin.handleLoginResponse(
                uri,
                onSuccess = { loginData ->
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("idToken", loginData.idToken)
                    savedCall.resolve(ret)
                },
                onError = { error ->
                    savedCall.reject("Login failed: ${error.message}")
                }
            )
        } else {
            savedCall.reject("Unknown redirect host")
        }
    }
}