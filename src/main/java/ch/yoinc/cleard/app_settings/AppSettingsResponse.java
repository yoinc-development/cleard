package ch.yoinc.cleard.app_settings;

import java.util.Map;

public record AppSettingsResponse(
        String currency
) {
    static final String DEFAULT_CURRENCY = "CHF";

    public static AppSettingsResponse from(Map<String, String> values) {
        return new AppSettingsResponse(
                values.getOrDefault(AppSettings.CURRENCY, DEFAULT_CURRENCY)
        );
    }
}
