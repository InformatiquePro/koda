// src-tauri/src/lib.rs  

use serde::{Deserialize, Serialize};

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
    pub attachments: Vec<String>,
    #[serde(rename = "customActions")]
    pub custom_actions: Vec<CustomAction>,
    #[serde(rename = "pomodoroDuration")]
    pub pomodoro_duration: Option<u32>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
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
}

#[tauri::command]
async fn get_settings() -> Result<AppSettings, String> {
    Ok(AppSettings {
        kiosk_mode: false,
       low_brightness_kiosk: true,
       weather_api_key: None,
       weather_city: Some("Vannes".to_string()),
       theme: "dark".to_string(),
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
    let res: Result<reqwest::Response, reqwest::Error> = match method.as_str() {
        "POST" => {
            client
            .post(&url)
            .header("Content-Type", "application/json")
            .body(body.unwrap_or_default())
            .send()
            .await
        }
        _ => client.get(&url).send().await,
    };
    match res {
        Ok(r) => Ok(format!("HTTP {}", r.status())),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn export_tasks_json(tasks: Vec<Task>) -> Result<String, String> {
    serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())
}

// ── Point d'entrée appelé par main.rs ────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_http::init())
    .invoke_handler(tauri::generate_handler![
        get_settings,
        get_tasks,
        save_task,
        delete_task,
        send_webhook,
        export_tasks_json,
    ])
    .run(tauri::generate_context!())
    .expect("error while running Koda");
}
