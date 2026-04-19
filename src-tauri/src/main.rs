// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
mod server;
use server::{start_server, SERVER_STATE};


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
    pub api_url: Option<String>,      // pour api
    #[serde(rename = "apiMethod")]
    pub api_method: Option<String>,   // pour api
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
async fn start_web_server(port: u16) -> Result<String, String> {
    // Met à jour les tâches dans le state partagé
    tokio::spawn(async move {
        start_server(port).await;
    });

    // Récupère l'IP locale
    let ip = local_ip().unwrap_or_else(|| "localhost".to_string());
    Ok(format!("http://{}:{}", ip, port))
}

#[tauri::command]
async fn sync_tasks_to_server(tasks: Vec<Task>) -> Result<(), String> {
    let mut stored = SERVER_STATE.tasks.lock().await;
    *stored = tasks.clone();
    let json = serde_json::to_string(&tasks).map_err(|e| e.to_string())?;
    let _ = SERVER_STATE.tx.send(json);
    Ok(())
}

fn local_ip() -> Option<String> {
    use std::net::UdpSocket;
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    Some(socket.local_addr().ok()?.ip().to_string())
}

#[tauri::command]
async fn stop_web_server() -> Result<(), String> {
    let _ = SERVER_STATE.shutdown.send(());
    Ok(())
}

#[tauri::command]
async fn get_settings() -> Result<AppSettings, String> {
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
    Ok(vec![])
}

#[tauri::command]
async fn save_task(task: Task) -> Result<(), String> {
    println!("save_task: {}", task.id);
    Ok(())
}

#[tauri::command]
async fn delete_task(id: String) -> Result<(), String> {
    println!("delete_task: {}", id);
    Ok(())
}

#[tauri::command]
async fn send_webhook(
    url: String,
    method: String,
    body: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Détecte Discord et construit le bon payload
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

        // Utilise serde_json pour construire le JSON proprement — évite les erreurs d'échappement
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
            if status.is_success() || status.as_u16() == 204 {
                Ok(format!("HTTP {}", status))
            } else {
                // Récupère le message d'erreur de la réponse pour aider au debug
                let err_body = r.text().await.unwrap_or_default();
                Err(format!("HTTP {} — {}", status, err_body))
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn export_tasks_json(tasks: Vec<Task>) -> Result<String, String> {
    serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
        get_settings,
        get_tasks,
        save_task,
        delete_task,
        send_webhook,
        export_tasks_json,
        start_web_server,      // serveur web
        sync_tasks_to_server,  // serveur web
        stop_web_server, // serveur web
    ])
    .run(tauri::generate_context!())
    .expect("error while running Koda");
}
