/**
 * ===================================================================
 * HASUKA DIMSUM POS - GOOGLE APPS SCRIPT WEB API
 * Endpoint REST API untuk menghubungkan Web POS Kasir React dengan Google Sheets.
 * ===================================================================
 */

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  // Jika URL dibuka langsung tanpa parameter action, sajikan web app kasir React!
  if (!action) {
    const faviconUrl = 'https://raw.githubusercontent.com/Dialius/POS-Hasuka-Dimsum/main/Hasuka-logo.png';
    try {
      const html = HtmlService.createHtmlOutputFromFile('Index');
      const scriptUrl = ScriptApp.getService().getUrl();
      html.append(`<script>window.__GAS_URL__ = "${scriptUrl}";</script>`);
      
      return html
        .setTitle('Hasuka Dimsum - POS Kasir')
        .setFaviconUrl(faviconUrl)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    } catch (err) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:40px;text-align:center;max-width:550px;margin:auto;">' +
        '<h2 style="color:#8B4A1E;margin-bottom:8px;">Hasuka Dimsum POS - Apps Script API</h2>' +
        '<div style="display:inline-block;padding:4px 12px;background:#EAF3DE;color:#3B6E1C;border-radius:12px;font-weight:bold;font-size:13px;margin-bottom:16px;">● Online &amp; Siap Digunakan</div>' +
        '<p style="color:#555;font-size:14px;line-height:1.6;">Endpoint API Google Apps Script ini berhasil aktif dan terhubung ke Spreadsheet Hasuka POS.</p>' +
        '<p style="color:#888;font-size:12px;margin-top:20px;border-top:1px solid #eee;padding-top:16px;">Tip: Untuk memuat tampilan visual kasir langsung di halaman ini, tambahkan file HTML bernama <code>Index</code> di editor Apps Script.</p>' +
        '</div>'
      ).setTitle('Hasuka Dimsum POS - API Ready')
       .setFaviconUrl(faviconUrl);
    }
  }

  if (action === "ping") {
    return responseJson({ status: "success", message: "Hasuka POS API Online & Siap", timestamp: formatReadableTimestamp() });
  }

function getBranchSpreadsheet(ss, branchId) {
  if (!branchId || branchId === 'all') return ss;
  const configSheet = ss.getSheetByName("BranchConfig");
  if (!configSheet) return ss;

  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(branchId)) {
      const spreadId = data[i][1];
      if (spreadId) {
        try {
          return SpreadsheetApp.openById(spreadId);
        } catch(e) {
          return ss;
        }
      }
    }
  }
  return ss;
}

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const branchId = e && e.parameter && e.parameter.branchId;
  const branchSs = getBranchSpreadsheet(ss, branchId);

  try {

    if (action === "getInitialData") {
      const ingredients = sheetToJson(branchSs.getSheetByName("Ingredients"));
      const recipes = sheetToJson(ss.getSheetByName("Recipes"));
      const products = sheetToJson(ss.getSheetByName("Products"));
      const categories = sheetToJson(ss.getSheetByName("Categories"));
      const settings = sheetToJson(ss.getSheetByName("Settings"));
      
      let outlets = sheetToJson(ss.getSheetByName("Outlets"));
      if (!outlets || outlets.length === 0) outlets = [];
      let cashiers = sheetToJson(ss.getSheetByName("Cashiers"));
      if (!cashiers || cashiers.length === 0) cashiers = [];

      return responseJson({
        status: "success",
        data: {
          ingredients: ingredients.map(i => ({
            ...i,
            id: Number(i.id),
            current_stock: Number(i.current_stock),
            min_stock_threshold: Number(i.min_stock_threshold),
            is_tracked: String(i.is_tracked).toUpperCase() === "TRUE"
          })),
          recipes: recipes.map(r => ({
            ...r,
            id: Number(r.id),
            product_id: Number(r.product_id),
            ingredient_id: Number(r.ingredient_id),
            qty_per_unit: Number(r.qty_per_unit)
          })),
          products: products.map(p => ({
            ...p,
            id: Number(p.id),
            price: Number(p.price),
            cost: Number(p.cost || 0),
            stock: Number(p.stock || 0),
            minStock: Number(p.minStock || 0),
            promo: String(p.promo).toUpperCase() === "TRUE",
            originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined
          })),
          categories: categories.map(c => ({ id: Number(c.id), name: c.name })),
          settings: settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {}),
          outlets: outlets,
          cashiers: cashiers
        }
      });
    }

    return responseJson({ status: "error", message: "Action tidak dikenal" }, 400);
  } catch (err) {
    return responseJson({ status: "error", message: err.toString() }, 500);
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let payload;

  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return responseJson({ status: "error", message: "Format JSON tidak valid" }, 400);
  }

  const action = payload.action;

  // Gunakan LockService agar pengurangan stok multi-transaksi tidak saling menimpa (concurrency-safe)
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Tunggu antrian maks 15 detik
  } catch (err) {
    return responseJson({ status: "error", message: "Server sedang sibuk, silakan coba lagi." }, 503);
  }

  try {
    if (action === "syncPush") {
      const result = handleSyncPush(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", synced_ids: result.synced_ids });
    }

    if (action === "createTransaction") {
      const result = handleCreateTransaction(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveRecipe") {
      const result = handleSaveRecipe(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveStockOpname") {
      const result = handleStockOpname(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveOutlet") {
      const result = handleSaveOutlet(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "deleteOutlet") {
      const result = handleDeleteOutlet(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveCashier") {
      const result = handleSaveCashier(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "deleteCashier") {
      const result = handleDeleteCashier(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveShiftReport") {
      const result = handleSaveShiftReport(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveProduct") {
      const result = handleSaveProduct(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "saveStockIn") {
      const result = handleSaveStockIn(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "getOwnerDashboardData") {
      const result = handleGetOwnerDashboardData(ss);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    if (action === "uploadImage") {
      const result = handleUploadImage(payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", url: result.url });
    }

    if (action === "saveIngredient") {
      const result = handleSaveIngredient(ss, payload.data);
      lock.releaseLock();
      return responseJson({ status: "success", data: result });
    }

    lock.releaseLock();
    return responseJson({ status: "error", message: "Action POST tidak dikenal" }, 400);
  } catch (err) {
    lock.releaseLock();
    return responseJson({ status: "error", message: err.toString() }, 500);
  }
}

/**
 * Handle Transaksi Baru & Potong Stok Resep (Logic Kritis PRD-08 v0.2)
 */
function handleCreateTransaction(ss, data) {
  const branchSs = getBranchSpreadsheet(ss, data.branch_id);
  
  const txSheet = branchSs.getSheetByName("Transactions");
  const itemsSheet = branchSs.getSheetByName("TransactionItems");
  const ingSheet = branchSs.getSheetByName("Ingredients");
  const recSheet = ss.getSheetByName("Recipes");
  const prodSheet = ss.getSheetByName("Products");

  const txId = new Date().getTime();
  const timestamp = formatReadableTimestamp(data.timestamp);
  const invoiceNo = data.invoice_no || "INV-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");

  // 1. Catat ke sheet Transactions
  txSheet.appendRow([
    txId,
    invoiceNo,
    timestamp,
    data.cashier || "Kasir",
    data.shift_id || 1,
    data.subtotal || 0,
    data.promo_discount || 0,
    data.manual_discount || 0,
    data.tax || 0,
    data.total || 0,
    data.payment_method || "CASH",
    data.cash_received || 0,
    data.change_amount || 0,
    "PAID"
  ]);

  // 2. Ambil data Ingredients, Recipes, dan Products saat ini
  const ingData = ingSheet.getDataRange().getValues();
  const recData = recSheet.getDataRange().getValues();
  const prodData = prodSheet.getDataRange().getValues();

  // Index baris Ingredients berdasarkan ingredient_id
  // ingData[0] = header ["id", "name", "unit", "current_stock", "min_stock_threshold", "is_tracked"]
  const ingMap = {};
  for (let i = 1; i < ingData.length; i++) {
    const id = Number(ingData[i][0]);
    ingMap[id] = {
      rowIndex: i + 1, // 1-indexed di sheet
      currentStock: Number(ingData[i][3]),
      isTracked: String(ingData[i][5]).toUpperCase() === "TRUE"
    };
  }

  // Index Recipes berdasarkan product_id
  // recData[0] = header ["id", "product_id", "ingredient_id", "qty_per_unit"]
  const recMap = {};
  for (let r = 1; r < recData.length; r++) {
    const pId = Number(recData[r][1]);
    const iId = Number(recData[r][2]);
    const qtyPerUnit = Number(recData[r][3]);
    if (!recMap[pId]) recMap[pId] = [];
    recMap[pId].push({ ingredient_id: iId, qty_per_unit: qtyPerUnit });
  }

  // Index direct products
  const prodMap = {};
  for (let p = 1; p < prodData.length; p++) {
    const pId = Number(prodData[p][0]);
    prodMap[pId] = {
      rowIndex: p + 1,
      stockMode: prodData[p][5],
      stock: Number(prodData[p][6])
    };
  }

  // 3. Simpan items dan potong stok
  const items = data.items || [];
  const deductedStockLog = [];

  items.forEach((item, index) => {
    itemsSheet.appendRow([
      txId + "-" + (index + 1),
      txId,
      item.product_id,
      item.product_name,
      item.qty,
      item.unit_price,
      item.subtotal
    ]);

    const pId = Number(item.product_id);
    const qtySold = Number(item.qty);

    // Cek apakah produk direct-stock
    if (prodMap[pId] && prodMap[pId].stockMode === "direct") {
      const newStock = Math.max(0, prodMap[pId].stock - qtySold);
      prodSheet.getRange(prodMap[pId].rowIndex, 7).setValue(newStock);
      prodMap[pId].stock = newStock;
      deductedStockLog.push({ product_id: pId, mode: "direct", new_stock: newStock });
    } else {
      // Potong stok bahan baku berdasarkan resep
      const itemRecipes = recMap[pId] || [];
      itemRecipes.forEach(recipe => {
        const ing = ingMap[recipe.ingredient_id];
        if (ing && ing.isTracked) {
          const deduction = recipe.qty_per_unit * qtySold;
          const newStock = ing.currentStock - deduction;
          ingSheet.getRange(ing.rowIndex, 4).setValue(newStock);
          ing.currentStock = newStock;
          deductedStockLog.push({
            ingredient_id: recipe.ingredient_id,
            deduction: deduction,
            new_stock: newStock
          });
        }
      });
    }
  });

  return {
    invoice_no: invoiceNo,
    transaction_id: txId,
    timestamp: timestamp,
    deductions: deductedStockLog
  };
}

/**
 * Handle Simpan/Update Resep Produk (Fitur Kelola Resep Owner)
 */
function handleSaveRecipe(ss, data) {
  const recSheet = ss.getSheetByName("Recipes");
  const productId = Number(data.product_id);
  const newRecipes = data.recipes || []; // array of { ingredient_id, qty_per_unit }

  const values = recSheet.getDataRange().getValues();
  // Hapus semua resep lama untuk product_id ini (hapus dari bawah ke atas)
  for (let i = values.length - 1; i >= 1; i--) {
    if (Number(values[i][1]) === productId) {
      recSheet.deleteRow(i + 1);
    }
  }

  // Tambahkan resep baru
  const lastRow = recSheet.getLastRow();
  let nextId = lastRow > 1 ? Number(recSheet.getRange(lastRow, 1).getValue()) + 1 : 1;

  newRecipes.forEach(r => {
    recSheet.appendRow([
      nextId++,
      productId,
      Number(r.ingredient_id),
      Number(r.qty_per_unit)
    ]);
  });

  return { product_id: productId, count: newRecipes.length };
}

/**
 * Handle Simpan Stok Opname
 */
function handleStockOpname(ss, data) {
  const branchSs = getBranchSpreadsheet(ss, data.branch_id || data.outlet_id);
  const opnameSheet = branchSs.getSheetByName("StockOpname");
  const ingSheet = branchSs.getSheetByName("Ingredients");

  const sessionId = "SOP-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
  const dateStr = formatReadableTimestamp(data.date);
  const items = data.items || [];

  const ingData = ingSheet.getDataRange().getValues();
  const ingRowMap = {};
  for (let i = 1; i < ingData.length; i++) {
    ingRowMap[Number(ingData[i][0])] = i + 1;
  }

  items.forEach((item, idx) => {
    const ingId = Number(item.ingredient_id);
    const physical = Number(item.physical_count);
    const system = Number(item.system_stock);
    const diff = physical - system;

    opnameSheet.appendRow([
      sessionId + "-" + (idx + 1),
      sessionId,
      dateStr,
      ingId,
      system,
      physical,
      diff,
      item.notes || "",
      data.recorded_by || "Owner"
    ]);

    // Update stok bahan di Ingredients ke angka fisik
    if (ingRowMap[ingId]) {
      ingSheet.getRange(ingRowMap[ingId], 4).setValue(physical);
    }
  });

  return { session_id: sessionId, updated_count: items.length };
}

/**
 * Handle Simpan Outlet (Cabang)
 */
function handleSaveOutlet(ss, data) {
  const sheet = ss.getSheetByName("Outlets");
  if (!sheet) throw new Error("Sheet Outlets tidak ditemukan");
  
  const id = data.id;
  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowData = [id, data.name, data.address || "", data.phone || ""];
  
  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, 4).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
    
    // Otomatisasi pembuatan database cabang
    try {
      const newSs = SpreadsheetApp.create("[CABANG] Database Hasuka - " + data.name.toUpperCase());
      if (typeof setupBranchDatabase === 'function') {
        setupBranchDatabase(newSs);
      }
      
      // Pindahkan file cabang baru ke folder yang sama dengan Master Spreadsheet
      try {
        const masterFile = DriveApp.getFileById(ss.getId());
        const parents = masterFile.getParents();
        if (parents.hasNext()) {
          const parentFolder = parents.next();
          const newFile = DriveApp.getFileById(newSs.getId());
          newFile.moveTo(parentFolder);
        }
      } catch (moveErr) {
        console.error("Gagal memindahkan file ke folder master:", moveErr);
      }
      
      const configSheet = ss.getSheetByName("BranchConfig");
      if (configSheet) {
        configSheet.appendRow([id, newSs.getId(), "Otomatis dibuat"]);
      }
    } catch(err) {
      console.error("Gagal membuat database cabang otomatis:", err);
    }
  }
  
  // Sinkronisasi folder semua cabang lama agar satu tempat dengan Master
  syncBranchFolders(ss);
  
  return data;
}

/**
 * Sinkronisasi folder semua cabang ke folder Master Spreadsheet
 */
function syncBranchFolders(ss) {
  try {
    const masterFile = DriveApp.getFileById(ss.getId());
    const parents = masterFile.getParents();
    if (!parents.hasNext()) return;
    const parentFolder = parents.next();
    
    const configSheet = ss.getSheetByName("BranchConfig");
    if (!configSheet) return;
    
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const spreadId = data[i][1];
      if (spreadId) {
        try {
          const branchFile = DriveApp.getFileById(spreadId);
          const branchParents = branchFile.getParents();
          let needsMove = true;
          if (branchParents.hasNext()) {
            if (branchParents.next().getId() === parentFolder.getId()) {
              needsMove = false;
            }
          }
          if (needsMove) {
            branchFile.moveTo(parentFolder);
          }
        } catch(e) {
          // Abaikan jika file tidak ditemukan atau tidak ada akses
        }
      }
    }
  } catch (err) {
    console.error("Gagal sinkronisasi folder cabang:", err);
  }
}

/**
 * Handle Hapus Outlet
 */
function handleDeleteOutlet(ss, data) {
  const sheet = ss.getSheetByName("Outlets");
  if (!sheet) throw new Error("Sheet Outlets tidak ditemukan");
  
  const id = data.id;
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  
  throw new Error("Outlet tidak ditemukan");
}

/**
 * Handle Simpan Cashier (Kasir)
 */
function handleSaveCashier(ss, data) {
  const sheet = ss.getSheetByName("Cashiers");
  if (!sheet) throw new Error("Sheet Cashiers tidak ditemukan");
  
  const id = data.id;
  const values = sheet.getDataRange().getValues();
  let foundRow = -1;
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowData = [id, data.name, data.branchId || "all", data.role || "Kasir", data.status || "Aktif", data.shiftStart || "", data.shiftEnd || "", data.pin || ""];
  
  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return data;
}

/**
 * Handle Hapus Cashier
 */
function handleDeleteCashier(ss, data) {
  const sheet = ss.getSheetByName("Cashiers");
  if (!sheet) throw new Error("Sheet Cashiers tidak ditemukan");
  
  const id = data.id;
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }
  
  throw new Error("Cashier tidak ditemukan");
}

/**
 * Handle Simpan Laporan Shift
 */
function handleSaveShiftReport(ss, data) {
  const branchSs = getBranchSpreadsheet(ss, data.branch_id || data.outlet);
  const sheet = branchSs.getSheetByName("ShiftReports");
  if (!sheet) throw new Error("Sheet ShiftReports tidak ditemukan");
  
  const id = "SR-" + new Date().getTime();
  const date = formatReadableTimestamp(data.date);
  
  const rowData = [
    id,
    date,
    data.cashier || "",
    data.outlet || "",
    data.start_time || "",
    data.end_time || "",
    data.total_transactions || 0,
    data.omzet || 0,
    data.petty_cash || 0,
    data.kas_awal || 0,
    data.kas_sistem || 0,
    data.kas_fisik || 0,
    data.selisih || 0,
    data.alasan || ""
  ];
  
  sheet.appendRow(rowData);
  
  return { id: id, status: "saved" };
}

/**
 * Handle Simpan Produk
 */
function handleSaveProduct(ss, data) {
  const sheet = ss.getSheetByName("Products");
  if (!sheet) throw new Error("Sheet Products tidak ditemukan");
  
  const id = data.id || new Date().getTime();
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    id,
    data.name,
    data.cat,
    data.price,
    data.cost,
    data.stock_mode,
    data.stock,
    data.minStock,
    data.promo,
    data.promoText || "",
    data.originalPrice || 0,
    data.img || "",
    Array.isArray(data.outlets) ? data.outlets.join(",") : (data.outlets || "all")
  ];
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { id: id, status: "saved" };
}

/**
 * Handle Simpan Bahan Baku (Ingredient)
 */
function handleSaveIngredient(ss, data) {
  const sheet = ss.getSheetByName("Ingredients");
  if (!sheet) throw new Error("Sheet Ingredients tidak ditemukan");
  
  const id = data.id || new Date().getTime();
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    id,
    data.name,
    data.unit,
    data.current_stock || 0,
    data.min_stock_threshold || 10,
    data.is_tracked,
    Array.isArray(data.outlets) ? data.outlets.join(",") : (data.outlets || "all")
  ];
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { id: id, status: "saved" };
}

/**
 * Helper Konversi Sheet ke Array of Objects
 */
function sheetToJson(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // skip baris jika ID dan nama kosong
    if (!row[0] && row[0] !== 0 && !row[1]) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    
    // Jika user isi manual di Sheet tapi lupa isi ID, beri ID otomatis dari baris
    if (!obj.id) {
      obj.id = "auto_" + i;
    }

    results.push(obj);
  }

  return results;
}

/**
 * Handle Faktur Pembelian / Stok Masuk
 */
function handleSaveStockIn(ss, data) {
  const branchSs = getBranchSpreadsheet(ss, data.branch_id || data.outlet_id);
  
  let stockInSheet = branchSs.getSheetByName("StockIn");
  if (!stockInSheet) {
    stockInSheet = branchSs.insertSheet("StockIn");
    stockInSheet.appendRow(["id", "date", "source", "items_json", "recorded_by"]);
  }

  const ingSheet = branchSs.getSheetByName("Ingredients");
  const prodSheet = ss.getSheetByName("Products");

  const id = "STI-" + new Date().getTime();
  const dateStr = formatReadableTimestamp(data.date || new Date());
  const items = data.items || [];

  stockInSheet.appendRow([
    id,
    dateStr,
    data.source || "",
    JSON.stringify(items),
    data.recorded_by || ""
  ]);

  const ingData = ingSheet.getDataRange().getValues();
  const ingRowMap = {};
  for (let i = 1; i < ingData.length; i++) {
    ingRowMap[Number(ingData[i][0])] = i + 1;
  }

  const prodData = prodSheet.getDataRange().getValues();
  const prodRowMap = {};
  for (let p = 1; p < prodData.length; p++) {
    prodRowMap[Number(prodData[p][0])] = p + 1;
  }

  items.forEach(item => {
    if (item.type === 'ingredient') {
      const rowIndex = ingRowMap[Number(item.id)];
      if (rowIndex) {
        const currentStock = Number(ingSheet.getRange(rowIndex, 4).getValue());
        ingSheet.getRange(rowIndex, 4).setValue(currentStock + Number(item.qty));
      }
    } else if (item.type === 'product') {
      const rowIndex = prodRowMap[Number(item.id)];
      if (rowIndex) {
        const currentStock = Number(prodSheet.getRange(rowIndex, 7).getValue());
        prodSheet.getRange(rowIndex, 7).setValue(currentStock + Number(item.qty));
      }
    }
  });

  return { id: id, status: "saved" };
}

/**
 * Helper Return JSON Response dengan CORS Header
 */
function responseJson(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menu otomatis saat Spreadsheet Hasuka dibuka oleh Owner/Admin
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("Hasuka POS")
      .addItem("Rapikan Format Tanggal & Jam (WIB)", "formatExistingTimestamps")
      .addToUi();
  } catch (e) {}
}

/**
 * Helper: Format Timestamp agar mudah dibaca manusia (WIB / GMT+7)
 * Contoh output: "2026-09-09 13:25:30" (Bukan 2026-09-09T06:25:30.000Z)
 */
function formatReadableTimestamp(dateInput) {
  let d;
  if (!dateInput) {
    d = new Date();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === "number") {
    d = new Date(dateInput);
  } else {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
  }
  return Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd HH:mm:ss");
}

/**
 * Utility: Ubah semua timestamp lama yang berformat ISO (2026-09-09T06:00:00.000Z)
 * di sheet Transactions, ShiftReports, StockOpname, dan SyncLogs menjadi "yyyy-MM-dd HH:mm:ss"
 */
function formatExistingTimestamps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsConfig = [
    { name: "Transactions", col: 3 }, // Kolom C (timestamp)
    { name: "ShiftReports", col: 2 }, // Kolom B (date)
    { name: "StockOpname", col: 3 },  // Kolom C (date)
    { name: "SyncLogs", col: 2 }      // Kolom B (timestamp)
  ];

  let totalUpdated = 0;

  sheetsConfig.forEach(cfg => {
    const sheet = ss.getSheetByName(cfg.name);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    const range = sheet.getRange(2, cfg.col, lastRow - 1, 1);
    const values = range.getValues();
    let updated = false;

    for (let i = 0; i < values.length; i++) {
      const val = values[i][0];
      if (val) {
        if (typeof val === "string" && (val.includes("T") || val.includes("Z"))) {
          values[i][0] = formatReadableTimestamp(val);
          updated = true;
          totalUpdated++;
        } else if (val instanceof Date) {
          values[i][0] = formatReadableTimestamp(val);
          updated = true;
          totalUpdated++;
        }
      }
    }
    if (updated) {
      range.setValues(values);
    }
  });

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Berhasil merapikan format tanggal & jam (" + totalUpdated + " baris diperbarui).",
      "Hasuka POS"
    );
  } catch (e) {}
}

/**
 * Setup Folder Structure di Google Drive
 */
function organizeDriveFolders() {
  const rootName = "Hasuka-Dimsum";
  let rootFolder;
  const roots = DriveApp.getFoldersByName(rootName);
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder(rootName);
  }
  
  const getOrCreateFolder = (parent, name) => {
    const folders = parent.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return parent.createFolder(name);
  };
  
  const getOrCreateImgFolder = (parent) => {
    // Cek apakah ada folder dengan nama lama (Gambar Menu)
    const oldFolders = parent.getFoldersByName("Gambar Menu");
    if (oldFolders.hasNext()) {
      const folder = oldFolders.next();
      folder.setName("Gambar Produk"); // Rename folder lama menjadi baru
      return folder;
    }
    const newFolders = parent.getFoldersByName("Gambar Produk");
    if (newFolders.hasNext()) return newFolders.next();
    return parent.createFolder("Gambar Produk");
  };
  
  const dbFolder = getOrCreateFolder(rootFolder, "Database");
  const imgFolder = getOrCreateImgFolder(rootFolder);
  imgFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Pindahkan Spreadsheet ini ke folder Database jika belum ada di sana
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    const file = DriveApp.getFileById(ss.getId());
    const parents = file.getParents();
    let inDb = false;
    while (parents.hasNext()) {
      if (parents.next().getId() === dbFolder.getId()) {
        inDb = true;
        break;
      }
    }
    if (!inDb) {
      try {
        file.moveTo(dbFolder);
      } catch (e) {
        // Fallback jika API lama
        try {
          dbFolder.addFile(file);
          const oldParents = file.getParents();
          while (oldParents.hasNext()) {
            const parent = oldParents.next();
            if (parent.getId() !== dbFolder.getId()) parent.removeFile(file);
          }
        } catch (err) {}
      }
    }
  }
  
  return { rootFolder, dbFolder, imgFolder };
}

/**
 * Handle Image Upload to Google Drive
 */
function handleUploadImage(data) {
  const folders = organizeDriveFolders();
  const folder = folders.imgFolder;

  // Pisahkan header Base64 dari datanya
  const base64Data = data.base64.split(",")[1] || data.base64;
  
  // Buat blob dari data Base64
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mimeType, data.filename);
  
  // Buat file di Drive
  const file = folder.createFile(blob);
  
  // Gunakan Google Drive Thumbnail API agar gambar bisa ditampilkan di tag <img> tanpa error 403
  const url = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  
  return { url: url };
}

/**
 * Cek apakah client_generated_id sudah pernah diproses (Idempotency)
 */
function isSyncProcessed(ss, clientId) {
  if (!clientId) return false;
  let logSheet = ss.getSheetByName("SyncLogs");
  if (!logSheet) {
    logSheet = ss.insertSheet("SyncLogs");
    logSheet.appendRow(["client_generated_id", "timestamp", "action"]);
    return false;
  }
  
  // Untuk skala kecil/sedang, getValues cukup cepat.
  // Jika terlalu besar bisa dibatasi ke last 1000 rows.
  const data = logSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(clientId)) return true;
  }
  return false;
}

function recordSyncProcessed(ss, clientId, actionName) {
  if (!clientId) return;
  let logSheet = ss.getSheetByName("SyncLogs");
  if (logSheet) {
    logSheet.appendRow([clientId, formatReadableTimestamp(), actionName]);
  }
}

/**
 * Handle Batch Push dari Outbox (Offline Sync)
 */
function handleSyncPush(ss, data) {
  const batch = data.batch || [];
  const synced_ids = [];
  
  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    const clientId = item.client_generated_id;
    const action = item.action;
    const payloadData = item.data;
    
    // Cek idempotency
    if (isSyncProcessed(ss, clientId)) {
      synced_ids.push(clientId); // Sudah pernah diproses, mark success saja
      continue;
    }
    
    try {
      // Routing ke handler yang sesuai
      if (action === "createTransaction") {
        handleCreateTransaction(ss, payloadData);
      } else if (action === "saveRecipe") {
        handleSaveRecipe(ss, payloadData);
      } else if (action === "saveStockOpname") {
        handleStockOpname(ss, payloadData);
      } else if (action === "saveOutlet") {
        handleSaveOutlet(ss, payloadData);
      } else if (action === "deleteOutlet") {
        handleDeleteOutlet(ss, payloadData);
      } else if (action === "saveCashier") {
        handleSaveCashier(ss, payloadData);
      } else if (action === "deleteCashier") {
        handleDeleteCashier(ss, payloadData);
      } else if (action === "saveShiftReport") {
        handleSaveShiftReport(ss, payloadData);
      } else if (action === "saveProduct") {
        handleSaveProduct(ss, payloadData);
      } else if (action === "saveIngredient") {
        handleSaveIngredient(ss, payloadData);
      }
      
      // Jika berhasil diproses, catat ke log
      recordSyncProcessed(ss, clientId, action);
      synced_ids.push(clientId);
    } catch (err) {
      console.error("Gagal proses item outbox " + clientId + ": " + err);
      // Jangan push ke synced_ids, biarkan di-retry client nanti
    }
  }
  
  return { synced_ids: synced_ids };
}

/**
 * Handle Owner Dashboard Data Aggregation
 */
function handleGetOwnerDashboardData(ss) {
  let allTransactions = [];
  let allShiftReports = [];
  let allIngredients = [];

  const configSheet = ss.getSheetByName("BranchConfig");
  let branchSpreadsheets = [];
  
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const branchId = data[i][0];
      const spreadId = data[i][1];
      if (spreadId) {
        try {
          branchSpreadsheets.push({ branchId: branchId, spread: SpreadsheetApp.openById(spreadId) });
        } catch(e) {
          // Abaikan jika tidak bisa dibuka
        }
      }
    }
  }

  // Jika tidak ada branch config, fallback ke ss
  if (branchSpreadsheets.length === 0) {
    branchSpreadsheets.push({ branchId: 'pusat', spread: ss });
  }

  branchSpreadsheets.forEach(branch => {
    const spread = branch.spread;
    
    // Transactions
    const txSheet = spread.getSheetByName("Transactions");
    if (txSheet) {
      const txData = sheetToJson(txSheet);
      txData.forEach(tx => {
        tx.branchId = branch.branchId;
        allTransactions.push(tx);
      });
    }

    // ShiftReports
    const shiftSheet = spread.getSheetByName("ShiftReports");
    if (shiftSheet) {
      const shiftData = sheetToJson(shiftSheet);
      shiftData.forEach(shift => {
        shift.branchId = branch.branchId;
        allShiftReports.push(shift);
      });
    }

    // Ingredients
    const ingSheet = spread.getSheetByName("Ingredients");
    if (ingSheet) {
      const ingData = sheetToJson(ingSheet);
      ingData.forEach(ing => {
        ing.branchId = branch.branchId;
        allIngredients.push(ing);
      });
    }
  });

  return {
    transactions: allTransactions,
    shiftReports: allShiftReports,
    ingredients: allIngredients
  };
}

/**
 * ===================================================================
 * RPC ENDPOINTS UNTUK GOOGLE.SCRIPT.RUN
 * Digunakan oleh frontend React untuk bypass HTTP 404 / CORS / Multi-akun
 * ===================================================================
 */

function rpcGetInitialData(branchId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const branchSs = getBranchSpreadsheet(ss, branchId);
  
  const ingredients = sheetToJson(branchSs.getSheetByName('Ingredients')) || [];
  const recipes = sheetToJson(ss.getSheetByName('Recipes')) || [];
  const products = sheetToJson(ss.getSheetByName('Products')) || [];
  const categories = sheetToJson(ss.getSheetByName('Categories')) || [];
  const settings = sheetToJson(ss.getSheetByName('Settings')) || [];
  const outlets = sheetToJson(ss.getSheetByName('Outlets')) || [];
  const cashiers = sheetToJson(ss.getSheetByName('Cashiers')) || [];
  
  return {
    status: 'success',
    data: {
      ingredients: ingredients.map(i => ({
        ...i,
        id: Number(i.id),
        current_stock: Number(i.current_stock),
        min_stock_threshold: Number(i.min_stock_threshold),
        is_tracked: String(i.is_tracked).toUpperCase() === 'TRUE'
      })),
      recipes: recipes.map(r => ({
        ...r,
        id: Number(r.id),
        product_id: Number(r.product_id),
        ingredient_id: Number(r.ingredient_id),
        qty_per_unit: Number(r.qty_per_unit)
      })),
      products: products.map(p => ({
        ...p,
        id: Number(p.id),
        price: Number(p.price),
        cost: Number(p.cost || 0),
        stock: Number(p.stock || 0),
        minStock: Number(p.minStock || 0),
        promo: String(p.promo).toUpperCase() === 'TRUE',
        originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined
      })),
      categories: categories.map(c => ({ id: Number(c.id), name: c.name })),
      settings: settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {}),
      outlets: outlets,
      cashiers: cashiers
    }
  };
}

function rpcPostAction(action, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    throw new Error('Server sedang sibuk, silakan coba lagi.');
  }

  try {
    if (action === 'syncPush') return { status: 'success', synced_ids: handleSyncPush(ss, data).synced_ids };
    if (action === 'createTransaction') return { status: 'success', data: handleCreateTransaction(ss, data) };
    if (action === 'saveRecipe') return { status: 'success', data: handleSaveRecipe(ss, data) };
    if (action === 'saveStockOpname') return { status: 'success', data: handleStockOpname(ss, data) };
    if (action === 'saveOutlet') return { status: 'success', data: handleSaveOutlet(ss, data) };
    if (action === 'deleteOutlet') return { status: 'success', data: handleDeleteOutlet(ss, data) };
    if (action === 'saveCashier') return { status: 'success', data: handleSaveCashier(ss, data) };
    if (action === 'deleteCashier') return { status: 'success', data: handleDeleteCashier(ss, data) };
    if (action === 'saveShiftReport') return { status: 'success', data: handleSaveShiftReport(ss, data) };
    if (action === 'saveProduct') return { status: 'success', data: handleSaveProduct(ss, data) };
    if (action === 'saveIngredient') return { status: 'success', data: handleSaveIngredient(ss, data) };
    if (action === 'saveStockIn') return { status: 'success', data: handleSaveStockIn(ss, data) };
    if (action === 'getOwnerDashboardData') return { status: 'success', data: handleGetOwnerDashboardData(ss) };
    if (action === 'uploadImage') {
      const res = handleUploadImage(data);
      return { status: 'success', url: res.url };
    }
    
    throw new Error('Action tidak dikenal: ' + action);
  } catch (err) {
    throw new Error(err.toString());
  } finally {
    lock.releaseLock();
  }
}

