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
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Hasuka Dimsum - POS Kasir')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "ping") {
      return responseJson({ status: "success", message: "Hasuka POS API Online", timestamp: new Date().toISOString() });
    }

    if (action === "getInitialData") {
      const ingredients = sheetToJson(ss.getSheetByName("Ingredients"));
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
  const txSheet = ss.getSheetByName("Transactions");
  const itemsSheet = ss.getSheetByName("TransactionItems");
  const ingSheet = ss.getSheetByName("Ingredients");
  const recSheet = ss.getSheetByName("Recipes");
  const prodSheet = ss.getSheetByName("Products");

  const txId = new Date().getTime();
  const timestamp = new Date().toISOString();
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
  const opnameSheet = ss.getSheetByName("StockOpname");
  const ingSheet = ss.getSheetByName("Ingredients");

  const sessionId = "SOP-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss");
  const dateStr = new Date().toISOString();
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
  }
  
  return data;
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
  
  const rowData = [id, data.name, data.branchId || "all", data.role || "Kasir", data.status || "Aktif"];
  
  if (foundRow > -1) {
    sheet.getRange(foundRow, 1, 1, 5).setValues([rowData]);
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
  const sheet = ss.getSheetByName("ShiftReports");
  if (!sheet) throw new Error("Sheet ShiftReports tidak ditemukan");
  
  const id = "SR-" + new Date().getTime();
  const date = data.date || new Date().toISOString();
  
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
    // skip baris kosong
    if (!row[0] && row[0] !== 0) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    results.push(obj);
  }

  return results;
}

/**
 * Helper Return JSON Response dengan CORS Header
 */
function responseJson(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle Image Upload to Google Drive
 */
function handleUploadImage(data) {
  const folderName = "POS_Hasuka_Images";
  let folder;
  
  // Cek apakah folder sudah ada, jika tidak, buat baru
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    // Set folder sharing to anyone with the link can view
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  // Pisahkan header Base64 dari datanya
  const base64Data = data.base64.split(",")[1] || data.base64;
  
  // Buat blob dari data Base64
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mimeType, data.filename);
  
  // Buat file di Drive
  const file = folder.createFile(blob);
  
  // URL untuk viewing (uc?export=view)
  const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
  
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
    logSheet.appendRow([clientId, new Date().toISOString(), actionName]);
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
