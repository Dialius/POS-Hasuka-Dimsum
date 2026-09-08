use std::io::Write;
use std::net::TcpStream;

#[tauri::command]
fn print_receipt(ip: String, port: u16, content: String) -> Result<String, String> {
    let address = format!("{}:{}", ip, port);
    match TcpStream::connect(address) {
        Ok(mut stream) => {
            // ESC/POS init
            let _ = stream.write(&[0x1B, 0x40]);
            
            // Print content
            if let Err(e) = stream.write(content.as_bytes()) {
                return Err(format!("Failed to write to printer: {}", e));
            }
            
            // Cut paper
            let _ = stream.write(&[0x1D, 0x56, 0x00]);
            
            Ok("Printed successfully".to_string())
        }
        Err(e) => Err(format!("Failed to connect to printer: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .invoke_handler(tauri::generate_handler![print_receipt])
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
