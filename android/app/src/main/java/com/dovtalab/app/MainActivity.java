package com.dovtalab.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import androidx.core.view.WindowCompat; // Добавь этот импорт

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ЭТОТ ВЫЗОВ ВКЛЮЧАЕТ EDGE-TO-EDGE
        registerPlugin(TelegramAuthPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
