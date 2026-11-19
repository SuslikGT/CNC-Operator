package ru.cnc.operator;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public final class UpdateCheck {

    private static final String URL_JSON =
            "https://raw.githubusercontent.com/SuslikGT/CNC-Operator/main/update.json";
    private static final String CHANNEL = "updates";
    private static final int NOTIFY_ID = 4242;
    private static final String PREFS = "updates";
    private static final String KEY_LAST = "lastNotified";

    private UpdateCheck() {}

    public static void check(final Context context) {
        final Context app = context.getApplicationContext();
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String body = fetch(URL_JSON);
                    if (body == null || body.isEmpty()) return;
                    JSONObject j = new JSONObject(body);
                    String ver = j.optString("version", "").trim();
                    String notes = j.optString("notes", "").trim();
                    String cur = currentVersion(app);
                    if (ver.isEmpty() || cur.isEmpty()) return;
                    if (!isNewer(ver, cur)) return;
                    if (ver.equals(app.getSharedPreferences(PREFS, 0).getString(KEY_LAST, ""))) return;
                    show(app, ver, notes);
                    app.getSharedPreferences(PREFS, 0).edit().putString(KEY_LAST, ver).apply();
                } catch (Exception ignored) {
                }
            }
        }).start();
    }

    private static String fetch(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(10000);
            c.setReadTimeout(10000);
            c.setInstanceFollowRedirects(true);
            c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("User-Agent", "CNCOperator");
            int code = c.getResponseCode();
            InputStream is = (code >= 200 && code < 400) ? c.getInputStream() : c.getErrorStream();
            if (is == null) return null;
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
            return bo.toString("UTF-8");
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private static String currentVersion(Context app) {
        try {
            PackageInfo pi = app.getPackageManager().getPackageInfo(app.getPackageName(), 0);
            return pi.versionName == null ? "" : pi.versionName;
        } catch (Exception e) {
            return "";
        }
    }

    static boolean isNewer(String remote, String current) {
        String[] a = remote.split("\\.");
        String[] b = current.split("\\.");
        int n = Math.max(a.length, b.length);
        for (int i = 0; i < n; i++) {
            int x = i < a.length ? parse(a[i]) : 0;
            int y = i < b.length ? parse(b[i]) : 0;
            if (x != y) return x > y;
        }
        return false;
    }

    private static int parse(String s) {
        try {
            return Integer.parseInt(s.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private static void show(Context app, String ver, String notes) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                app.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                        != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        NotificationManager nm = (NotificationManager) app.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Обновления",
                    NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Новые версии приложения");
            nm.createNotificationChannel(ch);
        }

        Intent open = new Intent(app, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(app, 0, open, flags);

        String text = notes.isEmpty() ? "Нажмите, чтобы обновить" : notes;
        if (text.length() > 180) text = text.substring(0, 180) + "…";

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            b = new Notification.Builder(app, CHANNEL);
        } else {
            b = new Notification.Builder(app);
        }
        b.setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle("ЧПУ Оператор " + ver)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setWhen(System.currentTimeMillis());
        try {
            nm.notify(NOTIFY_ID, b.build());
        } catch (Exception ignored) {
        }
    }
}
