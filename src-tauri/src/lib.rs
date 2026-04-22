use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Bienvenue dans GestionCouture, {} !", name)
}

// Correction : On retire la logique bcrypt ici car on utilise bcryptjs (JavaScript)
// On garde les fonctions pour ne pas casser le frontend
#[tauri::command]
fn hash_password(password: String) -> Result<String, String> {
    Ok(password) 
}

#[tauri::command]
fn verify_password(password: String, hash_value: String) -> bool {
    password == hash_value
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .rotation_strategy(RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            hash_password,
            verify_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
