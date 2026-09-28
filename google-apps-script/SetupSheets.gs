/**
 * ===================================================================
 * HASUKA DIMSUM POS - SPREADSHEET INITIAL SETUP
 * Jalankan fungsi setupHasukaDatabase() SATU KALI pada spreadsheet baru.
 * ===================================================================
 */

function setupHasukaDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Deteksi antarmuka UI (hanya aktif jika dijalankan manual dari editor spreadsheet)
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    ui = null;
  }

  // 1. Deteksi Struktur Folder Google Drive
  let folderInfo = {
    hasRootFolder: false,
    hasDbFolder: false,
    spreadsheetInFolder: false,
    rootFolder: null,
    dbFolder: null
  };

  try {
    const rootName = "Hasuka-Dimsum";
    const roots = DriveApp.getFoldersByName(rootName);
    if (roots.hasNext()) {
      folderInfo.hasRootFolder = true;
      folderInfo.rootFolder = roots.next();
      
      const dbFolders = folderInfo.rootFolder.getFoldersByName("Database");
      if (dbFolders.hasNext()) {
        folderInfo.hasDbFolder = true;
        folderInfo.dbFolder = dbFolders.next();
      }
    }

    if (ss) {
      const file = DriveApp.getFileById(ss.getId());
      const parents = file.getParents();
      while (parents.hasNext()) {
        const parentId = parents.next().getId();
        if (folderInfo.dbFolder && parentId === folderInfo.dbFolder.getId()) {
          folderInfo.spreadsheetInFolder = true;
          break;
        }
      }
    }
  } catch (driveErr) {
    Logger.log("Info pengecekan Drive: " + driveErr.message);
  }

  // 2. Deteksi apakah spreadsheet sudah memiliki data operasional yang berjalan
  const existingData = [];
  const existingSheets = ss.getSheets();
  existingSheets.forEach(s => {
    const name = s.getName();
    if (name !== "INFO MASTER" && name !== "Sheet1") {
      const rowCount = s.getLastRow();
      if (rowCount > 1) {
        existingData.push({ name: name, count: rowCount - 1 });
      }
    }
  });

  const folderSummary = [
    "📁 Folder Utama 'Hasuka-Dimsum': " + (folderInfo.hasRootFolder ? "Ditemukan ✅" : "Belum Ada (Akan dibuat otomatis)"),
    "📁 Subfolder 'Database': " + (folderInfo.hasDbFolder ? "Ditemukan ✅" : "Belum Ada (Akan dibuat otomatis)"),
    "📄 Lokasi Spreadsheet: " + (folderInfo.spreadsheetInFolder ? "Sudah berada di dalam folder Database ✅" : "Akan dipindahkan ke folder Database")
  ].join("\n");

  // 3. Konfirmasi sebelum memulai setup (WAJIB konfirmasi, ada data lama maupun sheet baru)
  if (ui) {
    let title, message;
    if (existingData.length > 0) {
      const listStr = existingData.map(d => "• " + d.name + ": " + d.count + " baris data").join("\n");
      Logger.log("Data lama terdeteksi:\n" + listStr);
      title = "⚠️ Konfirmasi Setup Database & Folder Drive";
      message = "STATUS GOOGLE DRIVE:\n" +
        folderSummary + "\n\n" +
        "DATA OPERASIONAL TERDETEKSI:\n" +
        listStr + "\n\n" +
        "Apakah Anda ingin melanjutkan sinkronisasi skema & penataan folder?\n\n" +
        "• Klik YES (Ya): Sistem akan mengatur folder Drive, menyinkronkan Master & Cabang, dan MELINDUNGI SEMUA DATA LAMA Anda (tidak ada data dihapus).\n" +
        "• Klik NO (Tidak): Batalkan proses setup sekarang tanpa menyentuh data apapun.";
    } else {
      title = "🔄 Konfirmasi Setup Database Hasuka";
      message = "STATUS GOOGLE DRIVE:\n" +
        folderSummary + "\n\n" +
        "Sistem akan memeriksa dan menyinkronkan seluruh struktur tabel Master & Cabang, membuat folder Google Drive Hasuka, serta menerapkan desain rapi dan format standar (Rp, tanggal, zebra).\n\n" +
        "Lanjutkan proses setup sekarang?";
    }

    const prompt = ui.alert(title, message, ui.ButtonSet.YES_NO);
    if (prompt !== ui.Button.YES) {
      ui.alert("Dibatalkan", "Setup database dibatalkan. Tidak ada perubahan yang dilakukan pada data Anda.", ui.ButtonSet.OK);
      Logger.log("Setup dibatalkan oleh pengguna.");
      return;
    }
  }

  // 4. Tata atau buat folder di Google Drive (Hasuka-Dimsum -> Database, Gambar Produk, Logo Outlet)
  try {
    if (typeof organizeDriveFolders === "function") {
      organizeDriveFolders();
    }
  } catch (e) {
    Logger.log("Info organizeDriveFolders: " + e.message);
  }

  // Ubah nama spreadsheet jika diizinkan (wrap try-catch agar aman dari issue izin Drive)
  try {
    ss.rename("[MASTER] Database POS Hasuka Dimsum");
  } catch (e) {
    Logger.log("Info: Nama file tidak diubah (" + e.message + ")");
  }
  
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
      const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setValues([schema.headers]);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#8B4A1E");
      headerRange.setFontColor("#FFFFFF");
      try { sheet.setFrozenRows(1); } catch (e) {}

      // Masukkan konfigurasi standar sistem (hanya jika sheet baru dibuat)
      if (schema.defaultRows && schema.defaultRows.length > 0) {
        sheet.getRange(2, 1, schema.defaultRows.length, schema.defaultRows[0].length).setValues(schema.defaultRows);
      }
    } else if (sheet.getLastRow() < 1) {
      // Sheet sudah ada tapi masih kosong: buat header tanpa menghapus data
      const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setValues([schema.headers]);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#8B4A1E");
      headerRange.setFontColor("#FFFFFF");
      try { sheet.setFrozenRows(1); } catch (e) {}
    } else {
      // Sheet sudah ada dan punya data lama: PERTAHANKAN DATA LAMA!
      // Sinkronkan kolom header yang mungkin belum ada di ujung kanan
      try {
        const lastCol = Math.max(sheet.getLastColumn(), 1);
        const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        schema.headers.forEach(h => {
          if (!currentHeaders.includes(h)) {
            const nextCol = sheet.getLastColumn() + 1;
            sheet.getRange(1, nextCol).setValue(h).setFontWeight("bold").setBackground("#8B4A1E").setFontColor("#FFFFFF");
          }
        });
      } catch (e) {}
    }
  });

  // Tambahkan Sheet Info Master sebagai tab pertama
  let infoSheet = ss.getSheetByName("INFO MASTER");
  if (!infoSheet) {
    try {
      infoSheet = ss.insertSheet("INFO MASTER", 0);
      infoSheet.getRange("A1").setValue("DATABASE MASTER: PUSAT HASUKA DIMSUM").setFontSize(20).setFontWeight("bold").setFontColor("#8B4A1E");
      infoSheet.getRange("A2").setValue("File ini adalah Master Database utama untuk pengaturan Resep, Menu, Kasir, dan Konfigurasi Cabang.").setFontStyle("italic");
      infoSheet.getRange("A4").setValue("PENTING:").setFontWeight("bold").setFontColor("#B60000");
      infoSheet.getRange("A5").setValue("Jangan mengubah nama tab atau struktur header agar sistem berjalan normal.");
      infoSheet.autoResizeColumn(1);
    } catch (e) {}
  }

  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // 5. Sinkronisasi seluruh database cabang yang terdaftar di BranchConfig
  let totalBranchesSynced = 0;
  try {
    const configSheet = ss.getSheetByName("BranchConfig");
    if (configSheet && configSheet.getLastRow() > 1) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 1; i < configData.length; i++) {
        const spreadId = String(configData[i][1] || "").trim();
        if (spreadId) {
          try {
            const branchSs = SpreadsheetApp.openById(spreadId);
            if (branchSs) {
              setupBranchDatabase(branchSs, true);
              totalBranchesSynced++;
            }
          } catch (brErr) {
            Logger.log("Info sinkronisasi cabang (" + spreadId + "): " + brErr.message);
          }
        }
      }
    }
  } catch (errCfg) {
    Logger.log("Info pengecekan BranchConfig: " + errCfg.message);
  }

  // 6. Standarisasi desain, format angka/uang, dan sesuaikan lebar kolom SEMUA sheet (Master & Cabang)
  try {
    formatAllSheetsClean(ss, true);
  } catch (e) {
    Logger.log("Info formatAllSheetsClean: " + e.message);
  }

  Logger.log("Setup Database Hasuka Dimsum selesai! Seluruh tab produksi Master & " + totalBranchesSynced + " Cabang berhasil diperiksa/dibuat dan dirapikan.");
  if (ui) {
    ui.alert(
      "Setup Selesai! ✨",
      "Struktur database Hasuka Dimsum berhasil diperiksa dan disinkronkan.\n\n" +
      "• Database Master & " + totalBranchesSynced + " Database Cabang siap digunakan.\n" +
      "• Seluruh data operasional lama Anda aman dan terlindungi.\n" +
      "• Seluruh format angka (Rp), tanggal, warna header Hasuka (#8B4A1E), dan lebar kolom otomatis diseragamkan.",
      ui.ButtonSet.OK
    );
  }
}

function setupBranchDatabase(branchSs, skipPrompt) {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    ui = null;
  }

  // Deteksi data lama pada database cabang
  const existingData = [];
  const existingSheets = branchSs.getSheets();
  existingSheets.forEach(s => {
    const name = s.getName();
    if (name !== "INFO CABANG" && name !== "Sheet1") {
      const rowCount = s.getLastRow();
      if (rowCount > 1) {
        existingData.push({ name: name, count: rowCount - 1 });
      }
    }
  });

  if (ui && !skipPrompt) {
    let title, message;
    if (existingData.length > 0) {
      const listStr = existingData.map(d => "• " + d.name + ": " + d.count + " data").join("\n");
      title = "⚠️ Data Cabang Terdeteksi!";
      message = "Spreadsheet cabang ini SUDAH MEMILIKI DATA:\n\n" +
        listStr + "\n\n" +
        "Lanjutkan sinkronisasi dengan MELINDUNGI semua data lama?";
    } else {
      title = "🔄 Setup Database Cabang";
      message = "Inisialisasi tabel operasional cabang (Ingredients, Transactions, ShiftReports, PettyCash, dll) dan terapkan desain standar?\n\nLanjutkan?";
    }

    const prompt = ui.alert(title, message, ui.ButtonSet.YES_NO);
    if (prompt !== ui.Button.YES) {
      Logger.log("Setup cabang dibatalkan oleh pengguna.");
      return;
    }
  }

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
      const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setValues([schema.headers]);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#8B4A1E");
      headerRange.setFontColor("#FFFFFF");
      try { sheet.setFrozenRows(1); } catch (e) {}
    } else if (sheet.getLastRow() < 1) {
      const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setValues([schema.headers]);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#8B4A1E");
      headerRange.setFontColor("#FFFFFF");
      try { sheet.setFrozenRows(1); } catch (e) {}
    } else {
      // Pertahankan data lama! Tambahkan header yang kurang di kanan jika ada
      try {
        const lastCol = Math.max(sheet.getLastColumn(), 1);
        const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        schema.headers.forEach(h => {
          if (!currentHeaders.includes(h)) {
            const nextCol = sheet.getLastColumn() + 1;
            sheet.getRange(1, nextCol).setValue(h).setFontWeight("bold").setBackground("#8B4A1E").setFontColor("#FFFFFF");
          }
        });
      } catch (e) {}
    }
  });

  // Tambahkan Sheet Info Cabang sebagai tab pertama
  let infoSheet = branchSs.getSheetByName("INFO CABANG");
  if (!infoSheet) {
    try {
      infoSheet = branchSs.insertSheet("INFO CABANG", 0);
      const branchName = branchSs.getName().replace("[CABANG] Database Hasuka - ", "");
      infoSheet.getRange("A1").setValue("DATABASE CABANG: " + branchName.toUpperCase()).setFontSize(20).setFontWeight("bold").setFontColor("#8B4A1E");
      infoSheet.getRange("A2").setValue("File ini dibuat otomatis oleh sistem POS Kasir Hasuka Dimsum.").setFontStyle("italic");
      infoSheet.getRange("A4").setValue("PENTING:").setFontWeight("bold").setFontColor("#B60000");
      infoSheet.getRange("A5").setValue("Jangan mengubah nama tab atau header agar sinkronisasi aplikasi kasir berjalan lancar.");
      infoSheet.autoResizeColumn(1);
    } catch (e) {}
  }

  const defaultSheet = branchSs.getSheetByName("Sheet1");
  if (defaultSheet && branchSs.getSheets().length > 1) {
    try { branchSs.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Standarisasi desain, format angka/uang, dan sesuaikan lebar kolom semua sheet cabang
  try {
    formatSingleSpreadsheet(branchSs);
  } catch (e) {}
}

/**
 * ===================================================================
 * HELPER: FORMAT SATU SPREADSHEET (MASTER ATAU CABANG) MENJADI RAPI & STANDAR
 * ===================================================================
 */
function formatSingleSpreadsheet(ss) {
  if (!ss) return 0;
  const sheets = ss.getSheets();
  let formattedCount = 0;

  sheets.forEach(sheet => {
    const name = sheet.getName();

    // Sheet Info Master / Cabang: perapian visual kartu info
    if (name === "INFO MASTER" || name === "INFO CABANG") {
      sheet.setHiddenGridlines(false);
      try {
        sheet.setColumnWidth(1, 380);
        sheet.setRowHeight(1, 40);
        sheet.setRowHeight(2, 26);
        sheet.setRowHeight(4, 26);
        sheet.setRowHeight(5, 26);
      } catch (e) {}
      formattedCount++;
      return;
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) return;

    // 1. Tampilkan Gridlines (garis kisi-kisi bersih)
    sheet.setHiddenGridlines(false);

    // 2. Format Header (Baris 1)
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange
      .setBackground("#8B4A1E") // Brand Hasuka Terracotta
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setFontSize(10)
      .setFontFamily("Arial")
      .setVerticalAlignment("middle")
      .setHorizontalAlignment("center")
      .setWrap(false);
    sheet.setRowHeight(1, 36);
    try { sheet.setFrozenRows(1); } catch (e) {}

    // Ambil teks header untuk menentukan format tiap kolom
    const headers = headerRange.getValues()[0].map(h => String(h || "").trim().toLowerCase());

    // 3. Format Data Rows (Baris 2 s/d lastRow) jika ada data
    if (lastRow > 1) {
      const dataRowsCount = lastRow - 1;
      const dataRange = sheet.getRange(2, 1, dataRowsCount, lastCol);
      dataRange
        .setFontFamily("Arial")
        .setFontSize(10)
        .setVerticalAlignment("middle");

      // Set tinggi baris data yang nyaman dan lapang (28px)
      for (let r = 2; r <= lastRow; r++) {
        sheet.setRowHeight(r, 28);
      }

      // Zebra striping halus & readable
      const backgrounds = [];
      for (let r = 0; r < dataRowsCount; r++) {
        const rowBg = (r % 2 === 0) ? "#FFFFFF" : "#FAF7F2";
        const rowArr = [];
        for (let c = 0; c < lastCol; c++) {
          rowArr.push(rowBg);
        }
        backgrounds.push(rowArr);
      }
      dataRange.setBackgrounds(backgrounds);

      // Borders halus selaras tema
      try {
        dataRange.setBorder(true, true, true, true, true, true, "#E5DDD0", SpreadsheetApp.BorderStyle.SOLID);
      } catch (bErr) {}
    }

    // 4. Format & Align Spesifik Tiap Kolom berdasarkan tipe data
    headers.forEach((h, idx) => {
      const col = idx + 1;
      const colRange = sheet.getRange(2, col, Math.max(lastRow - 1, 1), 1);

      // A. Kolom Rupiah / Uang
      if (
        h.includes("price") || h.includes("cost") || h.includes("total") || 
        h.includes("subtotal") || h.includes("discount") || h.includes("tax") || 
        h.includes("received") || h.includes("change") || h.includes("omzet") || 
        h.includes("petty") || h.includes("amount") || h.includes("kas_") || 
        h.includes("selisih") || h.includes("target") || h.includes("saldo") ||
        h.includes("nominal")
      ) {
        colRange.setNumberFormat('"Rp" #,##0');
        colRange.setHorizontalAlignment("right");
      }
      // B. Kolom Kuantitas & Stok
      else if (h.includes("qty") || h.includes("stock") || h.includes("count") || h.includes("difference")) {
        colRange.setNumberFormat("#,##0.00");
        colRange.setHorizontalAlignment("right");
      }
      // C. Kolom Tanggal & Waktu
      else if (h.includes("date") || h.includes("time") || h.includes("timestamp") || h.includes("created")) {
        colRange.setNumberFormat("yyyy-mm-dd hh:mm:ss");
        colRange.setHorizontalAlignment("center");
      }
      // D. Kolom Kode / ID / Badge / Status
      else if (
        h === "id" || h.endsWith("_id") || h.endsWith("id") || h === "status" || 
        h === "unit" || h === "role" || h === "type" || h === "payment_method" || 
        h === "is_available" || h === "is_tracked" || h === "invoice_no" || h === "pin"
      ) {
        colRange.setHorizontalAlignment("center");
      }
      // E. Teks Biasa / Nama / Deskripsi
      else {
        colRange.setHorizontalAlignment("left");
      }

      // 5. Penyesuaian Lebar Kolom (Auto-fit + Padding Lega)
      try {
        sheet.autoResizeColumn(col);
        const naturalWidth = sheet.getColumnWidth(col);
        // Beri margin +35px agar tidak mepet / kepotong teksnya
        let finalWidth = Math.max(naturalWidth + 35, 95);
        // Batasi kolom yang mungkin berisi JSON/URL sangat panjang
        if (h.includes("json") || h.includes("url") || h.includes("img") || h.includes("desc") || h.includes("notes") || h.includes("alasan")) {
          finalWidth = Math.min(finalWidth, 320);
        }
        sheet.setColumnWidth(col, finalWidth);
      } catch (wErr) {}
    });

    formattedCount++;
  });

  return formattedCount;
}

/**
 * ===================================================================
 * STANDARISASI DESAIN, FORMAT & LEBAR KOLOM SEMUA SHEET (MASTER & CABANG)
 * ===================================================================
 */
function formatAllSheetsClean(targetSs, skipPrompt) {
  const isMasterCall = !targetSs;
  const ss = targetSs || SpreadsheetApp.getActiveSpreadsheet();
  let ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }

  // Tampilkan dialog konfirmasi jika dijalankan langsung oleh pengguna dari menu
  if (ui && isMasterCall && !skipPrompt) {
    const prompt = ui.alert(
      "🎨 Konfirmasi Format Desain Sheet",
      "Format desain rapi Hasuka Dimsum akan diterapkan ke:\n\n" +
      "1. Seluruh tab Master Spreadsheet aktif\n" +
      "2. Seluruh tab di SEMUA Spreadsheet Cabang yang terdaftar di tab BranchConfig\n\n" +
      "Fitur pemformatan:\n" +
      "• Warna header Hasuka Terracotta (#8B4A1E) & dibekukan\n" +
      "• Format nominal Rupiah (Rp) dan tanggal standar\n" +
      "• Lebar kolom otomatis disesuaikan secara lega (+35px margin)\n" +
      "• Zebra striping halus untuk kenyamanan membaca\n\n" +
      "Lanjutkan proses format?",
      ui.ButtonSet.YES_NO
    );
    if (prompt !== ui.Button.YES) {
      Logger.log("Format sheet dibatalkan oleh pengguna.");
      return;
    }
  }

  // 1. Format Spreadsheet Master
  const masterCount = formatSingleSpreadsheet(ss);
  let branchCount = 0;
  let totalBranches = 0;

  // 2. Format SEMUA Spreadsheet Cabang dari BranchConfig
  if (isMasterCall) {
    try {
      const configSheet = ss.getSheetByName("BranchConfig");
      if (configSheet && configSheet.getLastRow() > 1) {
        const configData = configSheet.getDataRange().getValues();
        for (let i = 1; i < configData.length; i++) {
          const spreadId = String(configData[i][1] || "").trim();
          if (spreadId) {
            try {
              const branchSs = SpreadsheetApp.openById(spreadId);
              if (branchSs) {
                branchCount += formatSingleSpreadsheet(branchSs);
                totalBranches++;
              }
            } catch (branchErr) {
              Logger.log("Gagal format cabang (" + spreadId + "): " + branchErr.message);
            }
          }
        }
      }
    } catch (e) {
      Logger.log("Error membaca BranchConfig: " + e.message);
    }
  }

  Logger.log("Berhasil memformat " + masterCount + " sheet master dan " + branchCount + " sheet di " + totalBranches + " database cabang.");
  
  if (ui && isMasterCall && !skipPrompt) {
    ui.alert(
      "Format Selesai! ✨",
      "Berhasil memformat dan mempercantik tampilan:\n\n" +
      "• " + masterCount + " tab pada Master Database\n" +
      "• " + branchCount + " tab pada " + totalBranches + " Database Cabang\n\n" +
      "Seluruh tabel kini memiliki warna header Hasuka (#8B4A1E), format Rupiah (Rp), tanggal, zebra striping, dan lebar kolom yang lega.",
      ui.ButtonSet.OK
    );
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
      .setFontWeight("bold").setBackground("#8B4A1E").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() < 1) {
    // Sheet ada tapi header kosong (terhapus manual)
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#8B4A1E").setFontColor("#FFFFFF");
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
