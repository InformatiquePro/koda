// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
mod server;
use server::{start_server, SERVER_STATE};
use std::env;
use std::sync::atomic::{AtomicBool, Ordering};

static DEV_MODE: AtomicBool = AtomicBool::new(false);

macro_rules! dev_log {
    ($($arg:tt)*) => {
        if DEV_MODE.load(std::sync::atomic::Ordering::Relaxed) {
            eprintln!($($arg)*);
        }
    };
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomAction {
    pub id: String,
    pub label: String,
    #[serde(rename = "triggerColumn")]
    pub trigger_column: String,
    #[serde(rename = "actionType")]
    pub action_type: String,
    pub payload: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubTask {
    pub id: String,
    pub label: String,
    pub status: String,
    #[serde(rename = "blockedReason")]
    pub blocked_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub column: String,
    pub priority: String,
    pub tags: Vec<String>,
    #[serde(rename = "hasApi")]
    pub has_api: bool,
    #[serde(rename = "apiUrl")]
    pub api_url: Option<String>,
    #[serde(rename = "apiMethod")]
    pub api_method: Option<String>,
    pub attachments: Vec<String>,
    #[serde(rename = "customActions")]
    pub custom_actions: Vec<CustomAction>,
    #[serde(rename = "pomodoroDuration")]
    pub pomodoro_duration: Option<u32>,
    pub pomodoro_started_at: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "blockedReason")]
    pub blocked_reason: Option<String>,
    #[serde(rename = "subTasks", default)]
    pub sub_tasks: Vec<SubTask>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    #[serde(rename = "kioskMode")]
    pub kiosk_mode: bool,
    #[serde(rename = "lowBrightnessKiosk")]
    pub low_brightness_kiosk: bool,
    #[serde(rename = "weatherApiKey")]
    pub weather_api_key: Option<String>,
    #[serde(rename = "weatherCity")]
    pub weather_city: Option<String>,
    pub theme: String,
    #[serde(rename = "enableApiSupport", default)]
    pub enable_api_support: bool,
    #[serde(rename = "enableCustomActions", default)]
    pub enable_custom_actions: bool,
}

#[tauri::command]
async fn get_settings() -> Result<AppSettings, String> {
    dev_log!("[get_settings] lecture des paramètres");
    Ok(AppSettings {
        kiosk_mode: false,
       low_brightness_kiosk: true,
       weather_api_key: None,
       weather_city: Some("Vannes".to_string()),
       theme: "dark".to_string(),
       enable_api_support: false,
       enable_custom_actions: false,
    })
}

#[tauri::command]
async fn get_tasks() -> Result<Vec<Task>, String> {
    dev_log!("[get_tasks] lecture des tâches");
    Ok(vec![])
}

#[tauri::command]
fn force_quit() {
    std::process::exit(0);
}

#[tauri::command]
async fn set_global_shortcut_enabled(
    app: tauri::AppHandle,
    enabled: bool,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
    use tauri::Manager;

    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::SHIFT),
                                 Code::Space,
    );

    let _ = app.global_shortcut().unregister(shortcut.clone());

    if enabled {
        dev_log!("[global_shortcut] activation Ctrl+Shift+Space");
        app.global_shortcut()
        .on_shortcut(shortcut, move |app_handle, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                dev_log!("[global_shortcut] déclenché — ouverture fenêtre palette");

                // Log 1 : vérif fenêtre existante
                if let Some(w) = app_handle.get_webview_window("command-palette") {
                    dev_log!("[global_shortcut] fenêtre existante — toggle show/hide");
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                        #[cfg(debug_assertions)]
                        w.open_devtools();
                    }
                    return;
                }
                dev_log!("[global_shortcut] pas de fenêtre existante, création...");

                #[cfg(debug_assertions)]
                let url = tauri::WebviewUrl::External(
                    "http://localhost:1420/command-palette.html".parse().unwrap()
                );
                #[cfg(not(debug_assertions))]
                let url = tauri::WebviewUrl::App("command-palette.html".into());

                dev_log!("[global_shortcut] URL définie, appel WebviewWindowBuilder...");

                let result = tauri::WebviewWindowBuilder::new(
                    app_handle,
                    "command-palette",
                    url,
                )
                .title("Koda — Commandes")
                .inner_size(680.0, 420.0)
                .resizable(false)
                .decorations(false)
                .always_on_top(true)
                .center()
                .focused(true)
                .skip_taskbar(true)
                .transparent(true)
                .build();

                dev_log!("[global_shortcut] build() terminé");

                match result {
                    Ok(w) => {
                        dev_log!("[global_shortcut] fenêtre créée OK — appel show()...");
                        let show_result = w.show();
                        dev_log!("[global_shortcut] show() résultat : {:?}", show_result);
                        let focus_result = w.set_focus();
                        dev_log!("[global_shortcut] set_focus() résultat : {:?}", focus_result);
                    }
                    Err(e) => {
                        dev_log!("[global_shortcut] ERREUR build() : {:?}", e);
                    }
                }
            }
        })
        .map_err(|e| e.to_string())?;
    } else {
        dev_log!("[global_shortcut] désactivation");
    }

    Ok(())
}

#[tauri::command]
async fn save_task(task: Task) -> Result<(), String> {
    dev_log!(
        "[save_task] id={} title=\"{}\" column={} priority={}",
        task.id, task.title, task.column, task.priority
    );
    Ok(())
}

#[tauri::command]
async fn delete_task(id: String) -> Result<(), String> {
    dev_log!("[delete_task] id={}", id);
    Ok(())
}

#[tauri::command]
async fn export_tasks_json(tasks: Vec<Task>) -> Result<String, String> {
    dev_log!("[export_tasks_json] export de {} tâche(s)", tasks.len());
    serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())
}

#[tauri::command]
async fn send_webhook(
    url: String,
    method: String,
    body: Option<String>,
) -> Result<String, String> {
    dev_log!("[send_webhook] method={} url={}", method, url);

    let client = reqwest::Client::new();

    let final_body = if url.contains("discord.com/api/webhooks") {
        let content = if let Some(ref b) = body {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(b) {
                format!(
                    "**{}**\\nColonne : {}\\nPriorité : {}",
                    parsed["title"].as_str().unwrap_or("Tâche Koda"),
                        parsed["column"].as_str().unwrap_or("?"),
                        parsed["priority"].as_str().unwrap_or("?"),
                )
            } else {
                b.clone()
            }
        } else {
            "Notification Koda".to_string()
        };
        serde_json::json!({ "content": content }).to_string()
    } else {
        body.unwrap_or_default()
    };

    let res: Result<reqwest::Response, reqwest::Error> = match method.as_str() {
        "POST" => client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(final_body)
        .send()
        .await,
        "PUT" => client
        .put(&url)
        .header("Content-Type", "application/json")
        .body(final_body)
        .send()
        .await,
        "PATCH" => client
        .patch(&url)
        .header("Content-Type", "application/json")
        .body(final_body)
        .send()
        .await,
        "DELETE" => client.delete(&url).send().await,
        _ => client.get(&url).send().await,
    };

    match res {
        Ok(r) => {
            let status = r.status();
            dev_log!("[send_webhook] réponse HTTP {}", status);
            if status.is_success() || status.as_u16() == 204 {
                Ok(format!("HTTP {}", status))
            } else {
                let err_body = r.text().await.unwrap_or_default();
                Err(format!("HTTP {} — {}", status, err_body))
            }
        }
        Err(e) => {
            dev_log!("[send_webhook] erreur : {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn start_web_server(port: u16) -> Result<String, String> {
    dev_log!("[start_web_server] démarrage sur le port {}", port);
    tokio::spawn(async move {
        start_server(port).await;
    });
    let ip = local_ip().unwrap_or_else(|| "localhost".to_string());
    Ok(format!("http://{}:{}", ip, port))
}

#[tauri::command]
async fn sync_tasks_to_server(tasks: Vec<Task>) -> Result<(), String> {
    dev_log!("[sync_tasks] {} tâche(s)", tasks.len());
    let mut stored = SERVER_STATE.tasks.lock().await;
    *stored = tasks.clone();
    let json = serde_json::to_string(&tasks).map_err(|e| e.to_string())?;
    let _ = SERVER_STATE.tx.send(json);
    Ok(())
}

#[tauri::command]
async fn stop_web_server() -> Result<(), String> {
    dev_log!("[stop_web_server] arrêt du serveur");
    let _ = SERVER_STATE.shutdown.send(());
    Ok(())
}

#[tauri::command]
fn is_dev_mode() -> bool {
    DEV_MODE.load(Ordering::Relaxed)
}

fn local_ip() -> Option<String> {
    use std::net::UdpSocket;
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    Some(socket.local_addr().ok()?.ip().to_string())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let is_dev = args.contains(&"-dev".to_string());
    DEV_MODE.store(is_dev, Ordering::Relaxed);

    if is_dev {
        eprintln!("⚠️  Koda lancé en MODE DEV — logs activés");
    } else {
        eprintln!("Log désactivé. Lancer Koda avec l'argument -dev pour activer les logs.");
    }

    tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
        use tauri::Manager;
        use tauri::Emitter;
        use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
        use tauri::menu::{MenuBuilder, MenuItem};

        dev_log!("[setup] Koda initialisé");

        let app_handle = app.handle().clone();
        app.get_webview_window("main").unwrap()
        .on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                dev_log!("[setup] fermeture interceptée !");
                api.prevent_close();
                let _ = app_handle.emit("ask-close-or-background", ());
            }
        });

        let show_item = MenuItem::with_id(app, "show", "Ouvrir Koda", true, None::<&str>)?;
        let quit_item = MenuItem::with_id(app, "quit", "Quitter Koda", true, None::<&str>)?;
        let menu = MenuBuilder::new(app).items(&[&show_item, &quit_item]).build()?;

        TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)   // ✅ corrige le warning
        .tooltip("Koda")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                }
            }
            "quit" => std::process::exit(0),
                       _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up, ..
            } = event {
                if let Some(w) = tray.app_handle().get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.unminimize();
                    let _ = w.set_focus();
                }
            }
        })
        .build(app)?;

        Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        get_settings,
        get_tasks,
        save_task,
        delete_task,
        send_webhook,
        export_tasks_json,
        start_web_server,
        sync_tasks_to_server,
        stop_web_server,
        is_dev_mode,
        set_global_shortcut_enabled,
        force_quit,
    ])
    .run(tauri::generate_context!())
    .expect("error while running Koda");
}
