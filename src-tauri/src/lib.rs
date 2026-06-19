// MIKI Tauri backend — intentionally thin.
//
// All file I/O is handled from the frontend via `tauri-plugin-fs` (read/write/mkdir).
// There are zero `#[tauri::command]` IPC handlers here — none are needed.
// If a feature requires Rust (e.g. native compression, OS keychain), add a command
// in this file and register it with `.invoke_handler(tauri::generate_handler![...])`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
