package ru.cnc.operator;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public final class UpdateSchedule {

    private static final long HOUR = 60L * 60L * 1000L;

    private UpdateSchedule() {}

    public static void arm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(context, UpdateReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(context, 1, i, flags);
        try {
            am.setInexactRepeating(AlarmManager.RTC,
                    System.currentTimeMillis() + HOUR, AlarmManager.INTERVAL_DAY, pi);
        } catch (Exception ignored) {
        }
    }
}
