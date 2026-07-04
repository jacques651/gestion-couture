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
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            greet,
            hash_password,
            verify_password
        ])
        .setup(|app| {
            // ============================================================
            // 1. DÉMARRAGE AUTOMATIQUE DU BACKEND (sidecar)
            //    En production, le backend Express est lancé automatiquement.
            //    Le frontend attend ensuite /health tout seul : aucune
            //    manipulation de l'utilisateur n'est nécessaire.
            // ============================================================
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_shell::ShellExt;
                match app.shell().sidecar("backend") {
                    Ok(cmd) => match cmd.spawn() {
                        Ok(_) => log::info!("✅ Backend sidecar démarré"),
                        Err(e) => log::error!("❌ Échec du démarrage du backend: {e}"),
                    },
                    Err(e) => log::error!("❌ Sidecar backend introuvable: {e}"),
                }
            }

            // ============================================================
            // 2. DÉMARRAGE AUTOMATIQUE AVEC WINDOWS
            //    L'application (et donc son backend) se lance au démarrage
            //    de la session Windows. Activé uniquement en production.
            // ============================================================
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_autostart::ManagerExt;
                let autostart = app.autolaunch();
                match autostart.is_enabled() {
                    Ok(true) => log::info!("✅ Démarrage automatique Windows déjà actif"),
                    _ => match autostart.enable() {
                        Ok(_) => log::info!("✅ Démarrage automatique Windows activé"),
                        Err(e) => log::warn!("⚠️ Impossible d'activer l'autostart: {e}"),
                    },
                }
            }

            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
