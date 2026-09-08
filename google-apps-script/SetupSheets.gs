/**
 * ===================================================================
 * HASUKA DIMSUM POS - SPREADSHEET INITIAL SETUP
 * Jalankan fungsi setupHasukaDatabase() SATU KALI pada spreadsheet baru.
 * ===================================================================
 */

function setupHasukaDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Definisikan skema tiap sheet sesuai PRD-08 v0.2
  const schemas = [
    {
      name: "Ingredients",
      headers: ["id", "name", "unit", "current_stock", "min_stock_threshold", "is_tracked", "outlets"],
      sampleData: [
        [1, "Dimsum Ayam (mentah)", "pcs", 180, 50, true, "all"],
        [2, "Dimsum Udang (mentah)", "pcs", 95, 30, true, "all"],
        [3, "Dimsum Nori (mentah)", "pcs", 60, 20, true, "all"],
        [4, "Wadah Foil 4-in-1", "pcs", 45, 20, true, "all"],
        [5, "Wadah Foil 6-in-1", "pcs", 38, 15, true, "all"],
        [6, "Sumpit Bambu", "pasang", 120, 30, true, "all"],
        [7, "Saus Mentai", "porsi", 200, 50, false, "all"],     // is_tracked = false (tidak dipotong)
        [8, "Chili Oil", "porsi", 150, 40, false, "all"],       // is_tracked = false (tidak dipotong)
        [9, "Keju Mozzarella", "gram", 850, 200, true, "all"],
        [10, "Paper Bag Hasuka", "pcs", 75, 25, true, "all"],
        [11, "Teh Liang Botol", "botol", 24, 10, true, "all"]
      ]
    },
    {
      name: "Recipes",
      headers: ["id", "product_id", "ingredient_id", "qty_per_unit"],
      sampleData: [
        // Dimsum Mentai 6pcs (product_id: 1)
        [1, 1, 1, 6],   // 6 pcs Dimsum Ayam
        [2, 1, 5, 1],   // 1 pcs Wadah Foil 6
        [3, 1, 6, 1],   // 1 pasang Sumpit
        [4, 1, 7, 1],   // 1 porsi Saus Mentai (untracked)
        [5, 1, 8, 1],   // 1 porsi Chili Oil (untracked)
        [6, 1, 10, 1],  // 1 pcs Paper Bag
        // Dimsum Original 4pcs (product_id: 2)
        [7, 2, 1, 4],   // 4 pcs Dimsum Ayam
        [8, 2, 4, 1],   // 1 pcs Wadah Foil 4
        [9, 2, 6, 1],   // 1 pasang Sumpit
        [10, 2, 8, 1],  // 1 porsi Chili Oil (untracked)
        // Dimsum Mozzarella 4pcs (product_id: 3)
        [11, 3, 1, 4],   // 4 pcs Dimsum Ayam
        [12, 3, 9, 30],  // 30 gram Mozzarella
        [13, 3, 4, 1],   // 1 pcs Wadah Foil 4
        [14, 3, 6, 1],   // 1 pasang Sumpit
        // Dimsum Nori 4pcs (product_id: 4)
        [15, 4, 3, 4],   // 4 pcs Dimsum Nori
        [16, 4, 4, 1],   // 1 pcs Wadah Foil 4
        [17, 4, 6, 1],   // 1 pasang Sumpit
        // Dimsum Udang 4pcs (product_id: 5)
        [18, 5, 2, 4],   // 4 pcs Dimsum Udang
        [19, 5, 4, 1],   // 1 pcs Wadah Foil 4
        [20, 5, 6, 1]    // 1 pasang Sumpit
      ]
    },
    {
      name: "Products",
      headers: ["id", "name", "cat", "price", "cost", "stock_mode", "stock", "minStock", "promo", "promoText", "originalPrice", "img", "outlets"],
      sampleData: [
        [1, "Siao May Ayam Udang (Isi 3)", "kukus", 24000, 18000, "recipe", 0, 0, false, "", 0, "https://images.unsplash.com/photo-1563245372-f21724e3856d", "all"],
        [2, "Hakau Udang Garing (Isi 3)", "kukus", 21000, 15000, "recipe", 0, 0, true, "25%", 28000, "https://images.unsplash.com/photo-1496116218417-1a781b1c416c", "all"],
        [3, "Bakpao Durian Pasir Emas", "kukus", 26000, 19000, "recipe", 0, 0, false, "", 0, "https://images.unsplash.com/photo-1577906096429-f73c2c312435", "all"],
        [4, "Lumpia Kulit Tahu Goreng", "goreng", 23000, 16000, "recipe", 0, 0, false, "", 0, "https://images.unsplash.com/photo-1563245372-f21724e3856d", "all"],
        [5, "Ceker Ayam Saus Szechuan", "goreng", 19500, 14000, "recipe", 0, 0, false, "", 0, "https://images.unsplash.com/photo-1563245372-f21724e3856d", "all"],
        [6, "Tahu Crispy Isi Udang", "goreng", 17000, 12000, "recipe", 0, 0, false, "", 0, "https://images.unsplash.com/photo-1563245372-f21724e3856d", "all"],
        [7, "Teh Liang Dingin Manis", "minuman", 8000, 4000, "simple", 20, 5, false, "", 0, "https://images.unsplash.com/photo-1556679343-c7306c1976bc", "all"],
        [8, "Es Jeruk Peras Segar", "minuman", 10000, 5000, "simple", 15, 5, false, "", 0, "https://images.unsplash.com/photo-1613478223719-2ab802602423", "all"],
        [9, "Kopi Susu Aren", "minuman", 14000, 7000, "simple", 12, 5, false, "", 0, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735", "all"],
        [10, "Onde-Onde Kacang Hijau", "snack", 7000, 3500, "simple", 30, 10, false, "", 0, "https://images.unsplash.com/photo-1563245372-f21724e3856d", "all"]
      ]
    },
    {
      name: "Transactions",
      headers: ["id", "invoice_no", "timestamp", "cashier", "shift_id", "subtotal", "promo_discount", "manual_discount", "tax", "total", "payment_method", "cash_received", "change_amount", "status"],
      sampleData: []
    },
    {
      name: "TransactionItems",
      headers: ["id", "transaction_id", "product_id", "product_name", "qty", "unit_price", "subtotal"],
      sampleData: []
    },
    {
      name: "StockOpname",
      headers: ["id", "session_id", "date", "ingredient_id", "system_stock", "physical_count", "difference", "notes", "recorded_by"],
      sampleData: []
    },
    {
      name: "Categories",
      headers: ["id", "name"],
      sampleData: [
        [1, "Semua Menu"],
        [2, "Mentai Series"],
        [3, "Original"],
        [4, "Special"],
        [5, "Minuman"]
      ]
    },
    {
      name: "Settings",
      headers: ["key", "value", "description"],
      sampleData: [
        ["tax_enabled", "false", "Aktifkan PB1 / Pajak Restoran 10%"],
        ["tax_rate", "0.10", "Persentase tarif pajak"],
        ["store_name", "Hasuka Dimsum", "Nama Gerai"],
        ["store_address", "Jl. Kuliner No. 12, Jakarta", "Alamat Gerai"],
        ["store_phone", "0812-3456-7890", "Kontak Gerai"],
        ["receipt_footer", "Terima kasih atas kunjungan Anda!", "Pesan di struk"]
      ]
    },
    {
      name: "Outlets",
      headers: ["id", "name", "address", "phone"],
      sampleData: [
        ["paskal", "Hasuka Dimsum — Paskal", "Paskal Hyper Square Blok C-12, Bandung", "(022) 8821992"],
        ["braga", "Hasuka Dimsum — Braga", "Jl. Braga No. 55, Bandung", "(022) 4234567"],
        ["dago", "Hasuka Dimsum — Dago", "Jl. Ir. H. Juanda No. 20, Bandung", "(022) 2509876"]
      ]
    },
    {
      name: "Cashiers",
      headers: ["id", "name", "branchId", "role", "status"],
      sampleData: [
        ["c1", "Sri Wahyuni", "paskal", "Kasir Shift Siang", "Aktif"],
        ["c2", "Budi Santoso", "braga", "Kasir Shift Siang", "Aktif"],
        ["c3", "Ahmad Dani", "dago", "Kasir Shift Siang", "Aktif"]
      ]
    },
    {
      name: "ShiftReports",
      headers: ["id", "date", "cashier", "outlet", "start_time", "end_time", "total_transactions", "omzet", "petty_cash", "kas_awal", "kas_sistem", "kas_fisik", "selisih", "alasan"],
      sampleData: []
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

    if (schema.sampleData && schema.sampleData.length > 0) {
      sheet.getRange(2, 1, schema.sampleData.length, schema.sampleData[0].length).setValues(schema.sampleData);
    }

    for (let c = 1; c <= schema.headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  });

  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("Setup Database Hasuka Dimsum selesai! Semua tab berhasil dibuat.");
}
