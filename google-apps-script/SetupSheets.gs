/**
 * ===================================================================
 * HASUKA DIMSUM POS - SPREADSHEET INITIAL SETUP
 * Jalankan fungsi setupHasukaDatabase() SATU KALI pada spreadsheet baru.
 * ===================================================================
 */

function setupHasukaDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.rename("[MASTER] Database POS Hasuka Dimsum");
  
  // Definisikan skema tiap sheet master untuk live production
  const schemas = [
    {
      name: "Ingredients",
      headers: ["id", "name", "unit", "current_stock", "min_stock_threshold", "is_tracked", "outlets"]
    },
    {
      name: "Recipes",
      headers: ["id", "product_id", "ingredient_id", "qty_per_unit"]
    },
    {
      name: "Products",
      headers: ["id", "name", "cat", "price", "cost", "stock_mode", "stock", "minStock", "promo", "promoText", "originalPrice", "img", "outlets"]
    },
    {
      name: "Transactions",
      headers: ["id", "invoice_no", "timestamp", "cashier", "shift_id", "subtotal", "promo_discount", "manual_discount", "tax", "total", "payment_method", "cash_received", "change_amount", "status"]
    },
    {
      name: "TransactionItems",
      headers: ["id", "transaction_id", "product_id", "product_name", "qty", "unit_price", "subtotal"]
    },
    {
      name: "StockOpname",
      headers: ["id", "session_id", "date", "ingredient_id", "system_stock", "physical_count", "difference", "notes", "recorded_by"]
    },
    {
      name: "Categories",
      headers: ["id", "name"],
      defaultRows: [
        [1, "Kukus"],
        [2, "Goreng"],
        [3, "Minuman"],
        [4, "Snack"],
        [5, "Paket"]
      ]
    },
    {
      name: "Settings",
      headers: ["key", "value", "description"],
      defaultRows: [
        ["tax_enabled", "false", "Aktifkan PB1 / Pajak Restoran 10%"],
        ["tax_rate", "0.10", "Persentase tarif pajak (10%)"],
        ["service_rate", "0", "Persentase biaya layanan / service charge (0%)"],
        ["store_name", "Hasuka Dimsum", "Nama Gerai"],
        ["store_address", "", "Alamat Gerai"],
        ["store_phone", "", "Kontak Gerai"],
        ["receipt_footer", "Terima kasih atas kunjungan Anda!", "Pesan di bagian bawah struk"],
        ["shift_tolerance", "50000", "Batas toleransi selisih kas tutup shift (Rp)"]
      ]
    },
    {
      name: "Outlets",
      headers: ["id", "name", "address", "phone", "target"]
    },
    {
      name: "Cashiers",
      headers: ["id", "name", "branchId", "role", "status", "shiftStart", "shiftEnd", "pin"]
    },
    {
      name: "StockIn",
      headers: ["id", "date", "source", "items_json", "recorded_by", "branch_id"]
    },
    {
      name: "ShiftReports",
      headers: ["id", "date", "cashier", "outlet", "start_time", "end_time", "total_transactions", "omzet", "petty_cash", "kas_awal", "kas_sistem", "kas_fisik", "selisih", "alasan"]
    },
    {
      name: "BranchConfig",
      headers: ["branchId", "spreadsheet_id", "notes"]
    },
    {
      name: "Promos",
      headers: ["id", "name", "type", "value", "scope", "products", "bundleProducts", "freeItem", "startDate", "endDate", "status", "desc", "outlets"]
    },
    {
      name: "PettyCash",
      headers: ["id", "date", "shift_id", "type", "amount", "description", "recorded_by", "branch_id", "receipt_url"]
    },
    {
      name: "SyncLogs",
      headers: ["client_generated_id", "timestamp", "action"]
    }
  ];

  schemas.forEach(schema => {
    let sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    } else {
      sheet.clear();
    }

    const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
    headerRange.setValues([schema.headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#991B1B");
    headerRange.setFontColor("#FFFFFF");

    sheet.setFrozenRows(1);

    // Masukkan konfigurasi standar sistem (hanya untuk Settings & Categories)
    if (schema.defaultRows && schema.defaultRows.length > 0) {
      sheet.getRange(2, 1, schema.defaultRows.length, schema.defaultRows[0].length).setValues(schema.defaultRows);
    }
  });

  // Tambahkan Sheet Info Master sebagai tab pertama
  let infoSheet = ss.getSheetByName("INFO MASTER");
  if (!infoSheet) {
    infoSheet = ss.insertSheet("INFO MASTER", 0);
  }
  
  infoSheet.getRange("A1").setValue("DATABASE MASTER: PUSAT HASUKA DIMSUM").setFontSize(20).setFontWeight("bold").setFontColor("#991B1B");
  infoSheet.getRange("A2").setValue("File ini adalah Master Database utama untuk pengaturan Resep, Menu, Kasir, dan Konfigurasi Cabang.").setFontStyle("italic");
  infoSheet.getRange("A4").setValue("PENTING:").setFontWeight("bold").setFontColor("#B60000");
  infoSheet.getRange("A5").setValue("Jangan mengubah nama tab atau struktur header agar sistem berjalan normal.");
  infoSheet.autoResizeColumn(1);

  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("Setup Database Master Hasuka Dimsum selesai! Semua tab produksi berhasil dibuat.");
}

function setupBranchDatabase(branchSs) {
  const schemas = [
    {
      name: "Ingredients",
      headers: ["id", "name", "unit", "current_stock", "min_stock_threshold", "is_tracked", "outlets"]
    },
    {
      name: "Transactions",
      headers: ["id", "invoice_no", "timestamp", "cashier", "shift_id", "subtotal", "promo_discount", "manual_discount", "tax", "total", "payment_method", "cash_received", "change_amount", "status"]
    },
    {
      name: "TransactionItems",
      headers: ["id", "transaction_id", "product_id", "product_name", "qty", "unit_price", "subtotal"]
    },
    {
      name: "StockIn",
      headers: ["id", "date", "source", "items_json", "recorded_by", "branch_id"]
    },
    {
      name: "StockOpname",
      headers: ["id", "session_id", "date", "ingredient_id", "system_stock", "physical_count", "difference", "notes", "recorded_by"]
    },
    {
      name: "ShiftReports",
      headers: ["id", "date", "cashier", "outlet", "start_time", "end_time", "total_transactions", "omzet", "petty_cash", "kas_awal", "kas_sistem", "kas_fisik", "selisih", "alasan"]
    },
    {
      name: "SyncLogs",
      headers: ["client_generated_id", "timestamp", "action"]
    },
    {
      name: "PettyCash",
      headers: ["id", "date", "shift_id", "type", "amount", "description", "recorded_by", "branch_id", "receipt_url"]
    }
  ];

  schemas.forEach(schema => {
    let sheet = branchSs.getSheetByName(schema.name);
    if (!sheet) {
      sheet = branchSs.insertSheet(schema.name);
    } else {
      sheet.clear();
    }

    const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
    headerRange.setValues([schema.headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#991B1B");
    headerRange.setFontColor("#FFFFFF");

    sheet.setFrozenRows(1);
  });

  // Tambahkan Sheet Info Cabang sebagai tab pertama
  let infoSheet = branchSs.getSheetByName("INFO CABANG");
  if (!infoSheet) {
    infoSheet = branchSs.insertSheet("INFO CABANG", 0);
  }
  const branchName = branchSs.getName().replace("[CABANG] Database Hasuka - ", "");
  
  infoSheet.getRange("A1").setValue("DATABASE CABANG: " + branchName.toUpperCase()).setFontSize(20).setFontWeight("bold").setFontColor("#8B4A1E");
  infoSheet.getRange("A2").setValue("File ini dibuat otomatis oleh sistem POS Kasir Hasuka Dimsum.").setFontStyle("italic");
  infoSheet.getRange("A4").setValue("PENTING:").setFontWeight("bold").setFontColor("#B60000");
  infoSheet.getRange("A5").setValue("Jangan mengubah nama tab atau header agar sinkronisasi aplikasi kasir berjalan lancar.");
  infoSheet.autoResizeColumn(1);

  const defaultSheet = branchSs.getSheetByName("Sheet1");
  if (defaultSheet && branchSs.getSheets().length > 1) {
    branchSs.deleteSheet(defaultSheet);
  }
}

/**
 * ===================================================================
 * AUTO-REPAIR: pastikan sheet & header ada sebelum query (anti-crash).
 * Dipakai Code.gs: jika tab hilang, dibuat otomatis dengan header benar.
 * ===================================================================
 */
function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#991B1B").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() < 1) {
    // Sheet ada tapi header kosong (terhapus manual)
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#991B1B").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * ===================================================================
 * FUNGSI MIGRASI OTOMATIS
 * Gunakan fungsi ini jika Anda ingin memindahkan semua data dari 
 * file Spreadsheet lama ke file Spreadsheet baru secara otomatis.
 * ===================================================================
 */
function autoMigrateData() {
  // GANTI TEKS DI BAWAH INI DENGAN ID SPREADSHEET LAMA ANDA
  // (ID adalah huruf acak panjang di URL Spreadsheet lama Anda)
  const OLD_SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_LAMA_ANDA";
  
  if (OLD_SPREADSHEET_ID === "GANTI_DENGAN_ID_SPREADSHEET_LAMA_ANDA") {
    throw new Error("Silakan ganti OLD_SPREADSHEET_ID dengan ID Spreadsheet lama Anda terlebih dahulu!");
  }

  const newSs = SpreadsheetApp.getActiveSpreadsheet();
  const oldSs = SpreadsheetApp.openById(OLD_SPREADSHEET_ID);

  const sheetsToMigrate = ["Products", "Ingredients", "Recipes", "Cashiers", "Outlets", "Settings", "Promos", "BranchConfig"];

  sheetsToMigrate.forEach(sheetName => {
    const oldSheet = oldSs.getSheetByName(sheetName);
    const newSheet = newSs.getSheetByName(sheetName);
    
    if (oldSheet && newSheet) {
      const lastRow = oldSheet.getLastRow();
      const lastCol = oldSheet.getLastColumn();
      
      // Jika ada data (lebih dari baris ke-1/header)
      if (lastRow > 1) {
        // Ambil data tanpa header
        const data = oldSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        
        // Hapus data lama di file baru jika ada
        const newLastRow = newSheet.getLastRow();
        if (newLastRow > 1) {
          newSheet.getRange(2, 1, newLastRow - 1, newSheet.getLastColumn()).clearContent();
        }
        
        // Paste data ke file baru
        newSheet.getRange(2, 1, data.length, data[0].length).setValues(data);
        Logger.log("Berhasil memindahkan data: " + sheetName);
      }
    }
  });

  Logger.log("Selesai! Semua data dari file lama berhasil dipindahkan ke file baru.");
}
