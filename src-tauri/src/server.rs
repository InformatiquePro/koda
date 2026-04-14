use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::Method,
    response::{Html, IntoResponse},
    routing::{get, post},
    Json, Router,
};
use once_cell::sync::Lazy;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use tower_http::cors::{Any, CorsLayer};

use crate::Task;

pub struct AppState {
    pub tasks: Mutex<Vec<Task>>,
    pub tx: broadcast::Sender<String>,
    pub shutdown: broadcast::Sender<()>,
}

pub static SERVER_STATE: Lazy<Arc<AppState>> = Lazy::new(|| {
    let (tx, _) = broadcast::channel(100);
    let (shutdown, _) = broadcast::channel(1);
    Arc::new(AppState {
        tasks: Mutex::new(vec![]),
             tx,
             shutdown,
    })
});

pub async fn start_server(port: u16) {
    let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods([Method::GET, Method::POST])
    .allow_headers(Any);

    let app = Router::new()
    .route("/", get(serve_ui))
    .route("/api/tasks", get(get_tasks))
    .route("/api/tasks", post(save_tasks))
    .route("/ws", get(ws_handler))
    .layer(cors)
    .with_state(SERVER_STATE.clone());

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    let mut shutdown_rx = SERVER_STATE.shutdown.subscribe();

    axum::serve(listener, app)
    .with_graceful_shutdown(async move {
        let _ = shutdown_rx.recv().await;
    })
    .await
    .unwrap();
}

async fn serve_ui() -> Html<String> {
    Html(include_str!("../assets/koda_web.html").to_string())
}

async fn get_tasks(State(state): State<Arc<AppState>>) -> Json<Vec<Task>> {
    let tasks = state.tasks.lock().await;
    Json(tasks.clone())
}

#[derive(Deserialize)]
struct SaveTasksBody {
    tasks: Vec<Task>,
}

async fn save_tasks(
    State(state): State<Arc<AppState>>,
                    Json(body): Json<SaveTasksBody>,
) -> impl IntoResponse {
    let mut tasks = state.tasks.lock().await;
    *tasks = body.tasks.clone();
    let _ = state.tx.send(serde_json::to_string(&body.tasks).unwrap_or_default());
    "OK"
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_ws(socket, state))
}

async fn handle_ws(mut socket: WebSocket, state: Arc<AppState>) {
    let mut rx = state.tx.subscribe();

    // Envoie l'état actuel au nouveau client
    {
        let tasks = state.tasks.lock().await;
        let json = serde_json::to_string(&*tasks).unwrap_or_default();
        let _ = socket.send(Message::Text(json.into())).await;
    }

    loop {
        tokio::select! {
            Ok(msg) = rx.recv() => {
                if socket.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
            Some(Ok(Message::Text(text))) = socket.recv() => {
                // Le client web envoie une mise à jour → diffuse à tous
                if let Ok(tasks) = serde_json::from_str::<Vec<Task>>(&text) {
                    let mut stored = state.tasks.lock().await;
                    *stored = tasks.clone();
                    let _ = state.tx.send(serde_json::to_string(&tasks).unwrap_or_default());
                }
            }
            else => break,
        }
    }
}
