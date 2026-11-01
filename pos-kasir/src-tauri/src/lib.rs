use std::io::Write;
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;

#[tauri::command]
fn print_receipt(ip: String, port: u16, content: String) -> Result<String, String> {
    let address = format!("{}:{}", ip, port);
    let socket_addr: SocketAddr = address
        .parse()
        .map_err(|e| format!("Alamat printer tidak valid ({}): {}", address, e))?;

    // Batasi timeout koneksi maks 3 detik agar UI tidak membeku jika printer offline (BUG-016)
    match TcpStream::connect_timeout(&socket_addr, Duration::from_secs(3)) {
        Ok(mut stream) => {
            let _ = stream.set_write_timeout(Some(Duration::from_secs(3)));

            // ESC/POS init
            let _ = stream.write(&[0x1B, 0x40]);
            
            // Print content
            if let Err(e) = stream.write(content.as_bytes()) {
                return Err(format!("Gagal mengirim data ke printer: {}", e));
            }
            
            // Cut paper
            let _ = stream.write(&[0x1D, 0x56, 0x00]);
            
            Ok("Printed successfully".to_string())
        }
        Err(e) => Err(format!("Gagal terhubung ke printer thermal ({}:{}): {}", ip, port, e)),
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
