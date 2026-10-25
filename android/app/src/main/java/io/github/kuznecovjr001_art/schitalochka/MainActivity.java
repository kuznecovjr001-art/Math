package io.github.kuznecovjr001_art.schitalochka;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        lockPhonesToPortrait(getResources().getConfiguration());
    }

    // Раскладной телефон меняет ширину без пересоздания экрана (configChanges), поэтому проверяем снова.
    @Override
    public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        lockPhonesToPortrait(config);
    }

    // На телефоне в ландшафте высоты не хватает: варианты ответа уходят под край (docs/android-qa.md).
    // Планшеты и развёрнутые складные (от 600dp) поворачиваются свободно.
    private void lockPhonesToPortrait(Configuration config) {
        int wanted = config.smallestScreenWidthDp < 600
            ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
        if (getRequestedOrientation() != wanted) setRequestedOrientation(wanted);
    }
}
