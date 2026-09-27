// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use once_cell::sync::Lazy;
mod server;
use server::{start_server, SERVER_STATE};
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::Manager;
use tokio::sync::Mutex;

static DEV_MODE: AtomicBool = AtomicBool::new(false);
static DATA_LOCK: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

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
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(rename = "hasApi")]
    #[serde(default)]
    pub has_api: bool,
    #[serde(rename = "apiUrl")]
    pub api_url: Option<String>,
    #[serde(rename = "apiMethod")]
    pub api_method: Option<String>,
    #[serde(default)]
    pub attachments: Vec<String>,
    #[serde(rename = "customActions")]
    #[serde(default)]
    pub custom_actions: Vec<CustomAction>,
    #[serde(rename = "pomodoroDuration")]
    pub pomodoro_duration: Option<u32>,
    #[serde(rename = "pomodoroStartedAt")]
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
#[serde(default)]
pub struct AppSettings {
    #[serde(rename = "kioskMode")]
    pub kiosk_mode: bool,
    #[serde(rename = "lowBrightnessKiosk")]
    pub low_brightness_kiosk: bool,
    #[serde(rename = "weatherApiKey")]
    pub weather_api_key: Option<String>,
    #[serde(rename = "weatherCity")]
    pub weather_city: Option<String>,
    #[serde(rename = "weatherCityId")]
    pub weather_city_id: Option<String>,
    pub theme: String,
    #[serde(rename = "enableApiSupport", default)]
    pub enable_api_support: bool,
    #[serde(rename = "enableCustomActions", default)]
    pub enable_custom_actions: bool,
    #[serde(rename = "globalCommandShortcut", default)]
    pub global_command_shortcut: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            kiosk_mode: false,
            low_brightness_kiosk: true,
            weather_api_key: None,
            weather_city: Some("Quimper".to_string()),
            weather_city_id: None,
            theme: "dark".to_string(),
            enable_api_support: false,
            enable_custom_actions: false,
            global_command_shortcut: false,
        }
    }
}

fn data_file(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(name))
}

async fn read_tasks_file(app: &tauri::AppHandle) -> Result<Vec<Task>, String> {
    let path = data_file(app, "tasks.json")?;
    match tokio::fs::read_to_string(path).await {
        Ok(content) => serde_json::from_str(&content).map_err(|error| error.to_string()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(error) => Err(error.to_string()),
    }
}

async fn write_tasks_file(app: &tauri::AppHandle, tasks: &[Task]) -> Result<(), String> {
    let path = data_file(app, "tasks.json")?;
    let content = serde_json::to_string_pretty(tasks).map_err(|error| error.to_string())?;
    tokio::fs::write(path, content).await.map_err(|error| error.to_string())
}

#[tauri::command]
async fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    dev_log!("[get_settings] lecture des paramètres");
    let _guard = DATA_LOCK.lock().await;
    let path = data_file(&app, "settings.json")?;
    match tokio::fs::read_to_string(path).await {
        Ok(content) => serde_json::from_str(&content).map_err(|error| error.to_string()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(AppSettings::default()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let _guard = DATA_LOCK.lock().await;
    let path = data_file(&app, "settings.json")?;
    let content = serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?;
    tokio::fs::write(path, content).await.map_err(|error| error.to_string())
}

#[tauri::command]
async fn get_tasks(app: tauri::AppHandle) -> Result<Vec<Task>, String> {
    dev_log!("[get_tasks] lecture des tâches");
    let _guard = DATA_LOCK.lock().await;
    read_tasks_file(&app).await
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
async fn save_task(app: tauri::AppHandle, task: Task) -> Result<(), String> {
    dev_log!(
        "[save_task] id={} title=\"{}\" column={} priority={}",
        task.id, task.title, task.column, task.priority
    );
    let _guard = DATA_LOCK.lock().await;
    let mut tasks = read_tasks_file(&app).await?;
    if let Some(existing) = tasks.iter_mut().find(|existing| existing.id == task.id) {
        *existing = task;
    } else {
        tasks.push(task);
    }
    write_tasks_file(&app, &tasks).await
}

#[tauri::command]
async fn delete_task(app: tauri::AppHandle, id: String) -> Result<(), String> {
    dev_log!("[delete_task] id={}", id);
    let _guard = DATA_LOCK.lock().await;
    let mut tasks = read_tasks_file(&app).await?;
    tasks.retain(|task| task.id != id);
    write_tasks_file(&app, &tasks).await
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

    execute_webhook(url, method, body).await
}

pub async fn execute_webhook(
    url: String,
    method: String,
    body: Option<String>,
) -> Result<String, String> {
    let parsed_url = reqwest::Url::parse(&url).map_err(|_| "URL API invalide".to_string())?;
    if !matches!(parsed_url.scheme(), "http" | "https") {
        return Err("Seules les URL HTTP et HTTPS sont autorisées".to_string());
    }

    let method = method.to_uppercase();
    if !matches!(method.as_str(), "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
        return Err(format!("Méthode HTTP non prise en charge : {}", method));
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|error| error.to_string())?;

    let final_body = if url.contains("discord.com/api/webhooks") {
        let content = if let Some(ref b) = body {
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(b) {
                format!(
                    "**{}**\nColonne : {}\nPriorité : {}",
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
                let mut err_body = r.text().await.unwrap_or_default();
                err_body.truncate(500);
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
    let address = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&address)
        .await
        .map_err(|error| format!("Impossible d'ouvrir le port {} : {}", port, error))?;
    tokio::spawn(async move {
        if let Err(error) = start_server(listener).await {
            dev_log!("[start_web_server] arrêt avec erreur : {}", error);
        }
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
        save_settings,
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

#[cfg(test)]
mod tests {
    use super::execute_webhook;

    #[tokio::test]
    async fn webhook_rejects_non_http_urls() {
        let result = execute_webhook("file:///etc/passwd".into(), "GET".into(), None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn webhook_rejects_unknown_methods_before_sending() {
        let result = execute_webhook("https://example.com".into(), "TRACE".into(), None).await;
        assert!(result.is_err());
    }
}
