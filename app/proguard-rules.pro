-keep class ru.cnc.operator.MainActivity { *; }
-keep class ru.cnc.operator.MainActivity$NativeBridge { *; }
-keep class ru.cnc.operator.UpdateReceiver { *; }
-keep class ru.cnc.operator.BootReceiver { *; }
-keep class ru.cnc.operator.UpdateCheck { *; }
-keep class ru.cnc.operator.UpdateSchedule { *; }

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes JavascriptInterface
