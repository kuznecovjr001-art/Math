package io.github.kuznecovjr001_art.schitalochka;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        lockPhonesToPortrait(getResources().getConfiguration());
        limitTextZoom();
    }

    // WebView умножает текст на системный масштаб шрифта: при 150–200% ответы уходят под край (docs/android-qa.md).
    // Крупный шрифт уважаем, но не больше 130%: дальше задание не помещается на экран телефона.
    private void limitTextZoom() {
        WebSettings web = getBridge().getWebView().getSettings();
        web.setTextZoom(Math.min(web.getTextZoom(), 130));
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
