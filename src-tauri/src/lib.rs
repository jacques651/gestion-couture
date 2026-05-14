use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Bienvenue dans GestionCouture, {} !", name)
}

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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            hash_password,
            verify_password
        ])
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            {
                use std::process::Command;
                use std::path::PathBuf;
                
                std::thread::spawn(|| {
                    // Petite pause avant de démarrer le backend
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    
                    // Récupérer le chemin de l'exécutable
                    let exe_path = std::env::current_exe().expect("Failed to get exe path");
                    let exe_dir = exe_path.parent().expect("Failed to get exe dir");
                    let backend_path = exe_dir.join("backend.exe");
                    
                    println!("🔧 Démarrage backend depuis: {:?}", backend_path);
                    
                    // Démarrer le backend
                    let _ = Command::new(backend_path)
                        .spawn();
                    
                    println!("✅ Backend démarré");
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}