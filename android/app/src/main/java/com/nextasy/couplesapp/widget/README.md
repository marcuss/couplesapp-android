# DailyQuestionWidget — Android AppWidget

Daily Question widget for LoveCompass (Capacitor) Android app.

## Files

| File | Description |
|------|-------------|
| `DailyQuestionWidget.kt` | AppWidgetProvider — handles updates, fetches question |
| `res/layout/widget_daily_question.xml` | Widget layout (4×2 cells) |
| `res/xml/widget_info.xml` | AppWidget metadata and size info |
| `res/drawable/widget_background.xml` | Rose-to-pink gradient background |
| `res/drawable/widget_badge_background.xml` | Semi-transparent category badge |

## How It Works

1. On widget update, reads auth token from SharedPreferences (`CapacitorStorage`)
2. Makes a POST to Supabase RPC `get_daily_question` with the couple_id
3. Displays question text + category badge in the widget RemoteViews
4. Tapping the widget opens the app via deep link `com.nextasy.couplesapp://daily-question`

## Integration with Capacitor App

After login, the Capacitor app should save auth data to SharedPreferences:

```kotlin
// In MainActivity.kt or a Capacitor plugin:
val prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
prefs.edit()
    .putString("supabase.auth.token", accessToken)
    .putString("supabase.couple.id", coupleId)
    .apply()

// Trigger widget refresh
DailyQuestionWidget.requestUpdate(this)
```

Or from JavaScript in the Capacitor web layer via a custom plugin that writes to SharedPreferences.

## Widget Size
- Target: 4×2 cells (full width of most home screens)
- Min width: 292dp, min height: 130dp
- Update frequency: once per day (86400000ms)

## Deep Link
Tap opens: `com.nextasy.couplesapp://daily-question`
This should be handled in MainActivity to route to `/daily-question` in the WebView.
