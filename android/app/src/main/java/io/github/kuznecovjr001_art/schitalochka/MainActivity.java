package io.github.kuznecovjr001_art.schitalochka;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // На телефоне в ландшафте высоты не хватает: варианты ответа уходят под край (docs/android-qa.md).
        // Планшеты (от 600dp) поворачиваются свободно.
        if (getResources().getConfiguration().smallestScreenWidthDp < 600) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
        }
    }
}
