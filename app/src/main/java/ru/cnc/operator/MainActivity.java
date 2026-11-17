package ru.cnc.operator;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    private WebView web;
    private BroadcastReceiver dlReceiver;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);

        web.setBackgroundColor(Color.parseColor("#0E1318"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new NativeBridge(), "Native");
        setContentView(web);

        dlReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id < 0) return;
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                Uri uri = null;
                try { uri = dm.getUriForDownloadedFile(id); } catch (Exception ignored) {}
                if (uri == null) {
                    toast("Не удалось скачать обновление");
                    return;
                }
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try {
                    startActivity(install);
                } catch (Exception e) {
                    toast("Разрешите установку из этого источника в настройках");
                }
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dlReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(dlReceiver, filter);
        }

        web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onDestroy() {
        try { if (dlReceiver != null) unregisterReceiver(dlReceiver); } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent event) {
        if (code == KeyEvent.KEYCODE_BACK && web != null) {
            web.evaluateJavascript("(window.appBack && window.appBack()) ? '1' : '0'",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"\"1\"".equals(value)) finish();
                        }
                    });
            return true;
        }
        return super.onKeyDown(code, event);
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    public class NativeBridge {

        @JavascriptInterface
        public String versionName() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pi.versionName == null ? "" : pi.versionName;
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public int versionCode() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return (int) pi.getLongVersionCode();
                return pi.versionCode;
            } catch (Exception e) {
                return 0;
            }
        }

        @JavascriptInterface
        public boolean canInstall() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                return getPackageManager().canRequestPackageInstalls();
            }
            return true;
        }

        @JavascriptInterface
        public void toastMsg(final String msg) {
            toast(msg);
        }

        /** Асинхронный GET: результат отдаём в window.__nativeHttp(cbId, body). */
        @JavascriptInterface
        public void httpGet(final String url, final String cbId) {
            new Thread(new Runnable() {
                @Override public void run() {
                    String body = "";
                    HttpURLConnection c = null;
                    try {
                        c = (HttpURLConnection) new URL(url).openConnection();
                        c.setConnectTimeout(9000);
                        c.setReadTimeout(9000);
                        c.setInstanceFollowRedirects(true);
                        c.setRequestProperty("Accept", "application/json, text/plain, */*");
                        c.setRequestProperty("User-Agent", "CNCOperator");
                        int code = c.getResponseCode();
                        if (code >= 200 && code < 400) {
                            InputStream is = c.getInputStream();
                            ByteArrayOutputStream bo = new ByteArrayOutputStream();
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
                            body = bo.toString("UTF-8");
                        }
                    } catch (Exception ignored) {
                    } finally {
                        if (c != null) c.disconnect();
                    }
                    final String out = body;
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            try {
                                web.evaluateJavascript(
                                        "window.__nativeHttp && window.__nativeHttp(" + JSONObject.quote(cbId) + "," +
                                                JSONObject.quote(out) + ")", null);
                            } catch (Exception ignored) {}
                        }
                    });
                }
            }).start();
        }

        /** Качает APK системным загрузчиком и открывает установщик по завершении. */
        @JavascriptInterface
        public void installUpdate(final String url, final String title) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                        r.setTitle("Обновление: ЧПУ Оператор");
                        r.setDescription(title == null ? "" : title);
                        r.setMimeType("application/vnd.android.package-archive");
                        r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        r.setDestinationInExternalFilesDir(MainActivity.this, null, "update.apk");
                        dm.enqueue(r);
                        toast("Скачиваю обновление…");
                    } catch (Exception e) {
                        toast("Не удалось начать загрузку");
                    }
                }
            });
        }
    }
}
