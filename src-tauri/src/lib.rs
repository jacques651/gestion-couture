use tauri_plugin_log::{
    RotationStrategy,
    Target,
    TargetKind,
};

#[tauri::command]
fn greet(name: &str) -> String {

    format!(
        "Bienvenue dans GestionCouture, {} !",
        name
    )
}

// =======================================
// PASSWORD HASH
// =======================================
#[tauri::command]
fn hash_password(
    password: String
) -> Result<String, String> {

    Ok(password)
}

// =======================================
// PASSWORD VERIFY
// =======================================
#[tauri::command]
fn verify_password(

    password: String,

    hash_value: String

) -> bool {

    password == hash_value
}

// =======================================
// APP
// =======================================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()

        // =======================================
        // LOG PLUGIN
        // =======================================
        .plugin(

            tauri_plugin_log::Builder::new()

                .level(
                    log::LevelFilter::Info
                )

                .targets([

                    Target::new(
                        TargetKind::Stdout
                    ),

                    Target::new(
                        TargetKind::LogDir {
                            file_name: None
                        }
                    ),

                    Target::new(
                        TargetKind::Webview
                    ),
                ])

                .rotation_strategy(
                    RotationStrategy::KeepAll
                )

                .build(),
        )

        // =======================================
        // SQL
        // =======================================
        .plugin(
            tauri_plugin_sql::Builder::default()
                .build()
        )

        // =======================================
        // FILE SYSTEM
        // =======================================
        .plugin(
            tauri_plugin_fs::init()
        )

        // =======================================
        // DIALOG
        // =======================================
        .plugin(
            tauri_plugin_dialog::init()
        )

        // =======================================
        // OPENER
        // =======================================
        .plugin(
            tauri_plugin_opener::init()
        )

        // =======================================
        // SHELL
        // =======================================
        .plugin(
            tauri_plugin_shell::init()
        )

        // =======================================
        // COMMANDS
        // =======================================
        .invoke_handler(

            tauri::generate_handler![

                greet,

                hash_password,

                verify_password
            ]
        )

        // =======================================
        // RUN
        // =======================================
        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}