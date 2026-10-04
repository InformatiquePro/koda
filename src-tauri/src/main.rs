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
    #[serde(rename = "scheduledFor")]
    pub scheduled_for: Option<String>,
    #[serde(rename = "scheduledEnd")]
    pub scheduled_end: Option<String>,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<String>,
    #[serde(rename = "calendarEventId")]
    pub calendar_event_id: Option<String>,
    #[serde(rename = "calendarSource")]
    pub calendar_source: Option<String>,
    #[serde(rename = "calendarLocation")]
    pub calendar_location: Option<String>,
    #[serde(rename = "calendarAllDay")]
    pub calendar_all_day: Option<bool>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start: String,
    pub end: Option<String>,
    pub all_day: bool,
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
    #[serde(rename = "agendaEnabled", default)]
    pub agenda_enabled: bool,
    #[serde(rename = "calendarUrl")]
    pub calendar_url: Option<String>,
    #[serde(rename = "calendarUsername")]
    pub calendar_username: Option<String>,
    #[serde(rename = "calendarPassword")]
    pub calendar_password: Option<String>,
    #[serde(rename = "calendarLastSyncAt")]
    pub calendar_last_sync_at: Option<String>,
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
            agenda_enabled: false,
            calendar_url: None,
            calendar_username: None,
            calendar_password: None,
            calendar_last_sync_at: None,
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
async fn replace_tasks(app: tauri::AppHandle, tasks: Vec<Task>) -> Result<(), String> {
    let _guard = DATA_LOCK.lock().await;
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

fn decode_xml_text(value: &str) -> String {
    value
        .replace("<![CDATA[", "")
        .replace("]]>", "")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&#13;", "\r")
        .replace("&#10;", "\n")
        .replace("&#xD;", "\r")
        .replace("&#xA;", "\n")
        .replace("&amp;", "&")
}

fn extract_calendar_data(xml: &str) -> Vec<String> {
    let mut result = Vec::new();
    let mut cursor = 0;

    while let Some(relative_start) = xml[cursor..].find("calendar-data") {
        let name_end = cursor + relative_start + "calendar-data".len();
        let Some(open_start) = xml[..name_end].rfind('<') else {
            cursor = name_end;
            continue;
        };
        if xml.as_bytes().get(open_start + 1) == Some(&b'/') {
            cursor = name_end;
            continue;
        }
        let Some(open_end_rel) = xml[name_end..].find('>') else { break };
        let content_start = name_end + open_end_rel + 1;
        let Some(close_start_rel) = xml[content_start..].find("</") else { break };
        let close_start = content_start + close_start_rel;
        let Some(close_end_rel) = xml[close_start..].find('>') else { break };
        let closing_tag = &xml[close_start..close_start + close_end_rel + 1];
        if closing_tag.contains("calendar-data") {
            result.push(decode_xml_text(&xml[content_start..close_start]));
        }
        cursor = close_start + close_end_rel + 1;
    }

    result
}

fn unfold_ical_lines(content: &str) -> Vec<String> {
    let normalized = content.replace("\r\n", "\n").replace('\r', "\n");
    let mut lines: Vec<String> = Vec::new();
    for line in normalized.lines() {
        if (line.starts_with(' ') || line.starts_with('\t')) && !lines.is_empty() {
            if let Some(previous) = lines.last_mut() {
                previous.push_str(line.trim_start_matches([' ', '\t']));
            }
        } else {
            lines.push(line.to_string());
        }
    }
    lines
}

fn decode_ical_text(value: &str) -> String {
    value
        .replace("\\n", "\n")
        .replace("\\N", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
}

fn normalize_calendar_datetime(value: &str) -> Option<(String, bool)> {
    let value = value.trim();
    if value.len() == 8 && value.chars().all(|character| character.is_ascii_digit()) {
        let date = chrono::NaiveDate::parse_from_str(value, "%Y%m%d").ok()?;
        return Some((date.format("%Y-%m-%d").to_string(), true));
    }
    if let Ok(date) = chrono::DateTime::parse_from_rfc3339(value) {
        return Some((date.to_rfc3339(), false));
    }
    if let Ok(date) = chrono::DateTime::parse_from_str(value, "%Y%m%dT%H%M%S%z") {
        return Some((date.to_rfc3339(), false));
    }
    if let Some(without_z) = value.strip_suffix('Z') {
        let date = chrono::NaiveDateTime::parse_from_str(without_z, "%Y%m%dT%H%M%S").ok()?;
        return Some((format!("{}Z", date.format("%Y-%m-%dT%H:%M:%S")), false));
    }
    let date = chrono::NaiveDateTime::parse_from_str(value, "%Y%m%dT%H%M%S").ok()?;
    Some((date.format("%Y-%m-%dT%H:%M:%S").to_string(), false))
}

fn parse_ical_events(content: &str, first_day: &str, last_day: &str) -> Vec<CalendarEvent> {
    #[derive(Default)]
    struct RawEvent {
        uid: String,
        recurrence_id: String,
        summary: String,
        description: String,
        location: String,
        start: String,
        end: String,
        start_is_date: bool,
        status: String,
    }

    let mut events = Vec::new();
    let mut current: Option<RawEvent> = None;

    for line in unfold_ical_lines(content) {
        if line == "BEGIN:VEVENT" {
            current = Some(RawEvent::default());
            continue;
        }
        if line == "END:VEVENT" {
            if let Some(raw) = current.take() {
                if raw.status.eq_ignore_ascii_case("CANCELLED") || raw.start.is_empty() {
                    continue;
                }
                let Some((start, all_day)) = normalize_calendar_datetime(&raw.start) else { continue };
                let day = &start[..10.min(start.len())];
                if day < first_day || day >= last_day {
                    continue;
                }
                let end = normalize_calendar_datetime(&raw.end).map(|item| item.0);
                let event_id = if raw.uid.is_empty() {
                    format!("{}::{}", raw.summary, start)
                } else if raw.recurrence_id.is_empty() {
                    raw.uid
                } else {
                    format!("{}::{}", raw.uid, raw.recurrence_id)
                };
                events.push(CalendarEvent {
                    id: event_id,
                    title: if raw.summary.trim().is_empty() {
                        "Événement sans titre".to_string()
                    } else {
                        decode_ical_text(raw.summary.trim())
                    },
                    description: (!raw.description.trim().is_empty())
                        .then(|| decode_ical_text(raw.description.trim())),
                    location: (!raw.location.trim().is_empty())
                        .then(|| decode_ical_text(raw.location.trim())),
                    start,
                    end,
                    all_day: all_day || raw.start_is_date,
                });
            }
            continue;
        }

        let Some(raw) = current.as_mut() else { continue };
        let Some((property, value)) = line.split_once(':') else { continue };
        let name = property.split(';').next().unwrap_or(property).to_ascii_uppercase();
        match name.as_str() {
            "UID" => raw.uid = value.to_string(),
            "RECURRENCE-ID" => raw.recurrence_id = value.to_string(),
            "SUMMARY" => raw.summary = value.to_string(),
            "DESCRIPTION" => raw.description = value.to_string(),
            "LOCATION" => raw.location = value.to_string(),
            "DTSTART" => {
                raw.start = value.to_string();
                raw.start_is_date = property.to_ascii_uppercase().contains("VALUE=DATE");
            }
            "DTEND" => raw.end = value.to_string(),
            "STATUS" => raw.status = value.to_string(),
            _ => {}
        }
    }

    events.sort_by(|left, right| left.start.cmp(&right.start).then(left.title.cmp(&right.title)));
    events
}

#[tauri::command]
fn parse_ical_content(content: String) -> Result<Vec<CalendarEvent>, String> {
    if content.len() > 25 * 1024 * 1024 {
        return Err("Le fichier iCalendar dépasse la limite de 25 Mo".to_string());
    }
    if !content.contains("BEGIN:VCALENDAR") {
        return Err("Le fichier sélectionné n’est pas un agenda iCalendar valide".to_string());
    }
    Ok(parse_ical_events(&content, "0000-01-01", "9999-12-31"))
}

async fn calendar_request(
    client: &reqwest::Client,
    url: &str,
    username: Option<&str>,
    password: Option<&str>,
    method: reqwest::Method,
    body: Option<String>,
) -> Result<reqwest::Response, String> {
    let mut request = client.request(method, url);
    if let Some(username) = username.filter(|value| !value.is_empty()) {
        request = request.basic_auth(username, password);
    }
    if let Some(body) = body {
        request = request
            .header("Depth", "1")
            .header("Content-Type", "application/xml; charset=utf-8")
            .body(body);
    }
    request.send().await.map_err(|error| error.to_string())
}

#[tauri::command]
async fn sync_calendar(
    url: String,
    username: Option<String>,
    password: Option<String>,
    range_start: String,
    range_end: String,
) -> Result<Vec<CalendarEvent>, String> {
    let parsed_url = reqwest::Url::parse(url.trim()).map_err(|_| "URL d’agenda invalide".to_string())?;
    if !matches!(parsed_url.scheme(), "http" | "https") {
        return Err("Seules les URL HTTP et HTTPS sont autorisées".to_string());
    }

    let start = chrono::DateTime::parse_from_rfc3339(&range_start)
        .map_err(|_| "Date de début de synchronisation invalide".to_string())?;
    let end = chrono::DateTime::parse_from_rfc3339(&range_end)
        .map_err(|_| "Date de fin de synchronisation invalide".to_string())?;
    let first_day = start.format("%Y-%m-%d").to_string();
    let last_day = end.format("%Y-%m-%d").to_string();
    let caldav_start = start.with_timezone(&chrono::Utc).format("%Y%m%dT%H%M%SZ");
    let caldav_end = end.with_timezone(&chrono::Utc).format("%Y%m%dT%H%M%SZ");

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|error| error.to_string())?;
    let username = username.as_deref();
    let password = password.as_deref();

    let report_body = format!(
        r#"<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><d:getetag/><c:calendar-data><c:expand start="{caldav_start}" end="{caldav_end}"/></c:calendar-data></d:prop>
  <c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="{caldav_start}" end="{caldav_end}"/></c:comp-filter></c:comp-filter></c:filter>
</c:calendar-query>"#
    );
    let report_method = reqwest::Method::from_bytes(b"REPORT").map_err(|error| error.to_string())?;
    let mut response = calendar_request(
        &client,
        parsed_url.as_str(),
        username,
        password,
        report_method,
        Some(report_body),
    ).await?;

    if matches!(response.status().as_u16(), 400 | 404 | 405 | 501) {
        response = calendar_request(
            &client,
            parsed_url.as_str(),
            username,
            password,
            reqwest::Method::GET,
            None,
        ).await?;
    }

    let status = response.status();
    let mut content = response.text().await.map_err(|error| error.to_string())?;
    if !status.is_success() && status.as_u16() != 207 {
        content.truncate(500);
        return Err(format!("Agenda HTTP {} — {}", status, content));
    }

    let calendars = if content.contains("BEGIN:VCALENDAR") && !content.contains("calendar-data") {
        vec![content.clone()]
    } else {
        extract_calendar_data(&content)
    };
    if calendars.is_empty() {
        if status.as_u16() == 207 || content.contains("multistatus") {
            return Ok(Vec::new());
        }
        return Err("Le serveur n’a renvoyé aucune donnée iCalendar. Vérifie l’URL de la collection CalDAV.".to_string());
    }

    let mut events = Vec::new();
    for calendar in calendars {
        events.extend(parse_ical_events(&calendar, &first_day, &last_day));
    }
    events.sort_by(|left, right| left.start.cmp(&right.start).then(left.id.cmp(&right.id)));
    events.dedup_by(|left, right| left.id == right.id);
    Ok(events)
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
        replace_tasks,
        send_webhook,
        sync_calendar,
        parse_ical_content,
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
    use super::{execute_webhook, extract_calendar_data, parse_ical_content, parse_ical_events};

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

    #[test]
    fn extracts_and_parses_caldav_calendar_data() {
        let xml = r#"<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:response><d:propstat><d:prop><c:calendar-data>BEGIN:VCALENDAR&#13;
BEGIN:VEVENT&#13;
UID:meeting-42&#13;
DTSTART:20260927T130000Z&#13;
DTEND:20260927T140000Z&#13;
SUMMARY:Réunion équipe&#13;
LOCATION:Bureau 2&#13;
END:VEVENT&#13;
END:VCALENDAR</c:calendar-data></d:prop></d:propstat></d:response>
        </d:multistatus>"#;
        let calendars = extract_calendar_data(xml);
        assert_eq!(calendars.len(), 1);
        let events = parse_ical_events(&calendars[0], "2026-09-01", "2026-10-01");
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].title, "Réunion équipe");
        assert_eq!(events[0].location.as_deref(), Some("Bureau 2"));
        assert_eq!(events[0].start, "2026-09-27T13:00:00Z");
    }

    #[test]
    fn parses_all_day_and_folded_ical_events() {
        let calendar = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:day-1\r\nDTSTART;VALUE=DATE:20260928\r\nSUMMARY:Très longue réunion qui est\r\n pliée\r\nEND:VEVENT\r\nEND:VCALENDAR";
        let events = parse_ical_events(calendar, "2026-09-01", "2026-10-01");
        assert_eq!(events.len(), 1);
        assert!(events[0].all_day);
        assert_eq!(events[0].start, "2026-09-28");
        assert_eq!(events[0].title, "Très longue réunion qui estpliée");
    }

    #[test]
    fn rejects_a_local_file_that_is_not_icalendar() {
        let result = parse_ical_content("ceci n’est pas un agenda".to_string());
        assert!(result.is_err());
    }
}
