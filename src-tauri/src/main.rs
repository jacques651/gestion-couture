#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {

    tauri::Builder::default()

        // FILESYSTEM
        .plugin(
            tauri_plugin_fs::init()
        )

        // DIALOG
        .plugin(
            tauri_plugin_dialog::init()
        )

        // LOG
        .plugin(
            tauri_plugin_log::Builder::default()
                .build()
        )

        // OPENER
        .plugin(
            tauri_plugin_opener::init()
        )

        // SHELL
        .plugin(
            tauri_plugin_shell::init()
        )

        // RUN
        .run(
            tauri::generate_context!()
        )

        .expect(
            "error while running tauri application"
        );
}