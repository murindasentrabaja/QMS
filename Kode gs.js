const SPREADSHEET_ID = "13WSgEYINn18oBjNJ4ur4ZAVdmjJrZE9F1xhNu5-QhUw";

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ISO Audit Management System - Luxury Suite')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

// 1. Mengambil daftar Username dari sheet Login untuk Dropdown
function getLoginUsers() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Login');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  let users = [];
  
  // Mulai dari i = 1 untuk melewati baris Header
  for (let i = 1; i < data.length; i++) {
    const user = String(data[i][0]).trim();
    if (user !== "") {
      users.push(user);
    }
  }
  return users;
}

// 2. Verifikasi Login
function checkLogin(username, password) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Login');
  if (!sheet) return { success: false, message: 'Sheet Login tidak ditemukan' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const userInSheet = String(data[i][0]).trim();
    const passInSheet = String(data[i][1]).trim();
    if (userInSheet === String(username).trim() && passInSheet === String(password).trim()) {
      return { success: true, user: userInSheet };
    }
  }
  return { success: false, message: 'Username atau Password salah!' };
}

// 3. Ambil Seluruh Data dari 8 Sheet Relasional
function fetchSystemData() {
  const ss = getSpreadsheet();
  const sheets = [
    'Master Audit', 'Checklist_ISO', 'Auditee', 'Auditor',
    'Hasil_Audit', 'Temuan', 'Corrective Action', 'Lampiran'
  ];
  
  let result = {};
  sheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const values = sheet.getDataRange().getValues();
      if (values.length > 1) {
        const headers = values[0];
        const rows = values.slice(1).map((row, index) => {
          let obj = { _rowIndex: index + 2 };
          headers.forEach((h, colIdx) => {
            let val = row[colIdx];
            if (val instanceof Date) {
              val = val.toISOString().split('T')[0];
            }
            obj[h] = val;
          });
          return obj;
        });
        result[name] = rows;
      } else {
        result[name] = [];
      }
    } else {
      result[name] = [];
    }
  });
  return result;
}

// 4. Tambah Data Baru
function saveRecord(sheetName, dataObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  
  const headers = sheet.getDataRange().getValues()[0];
  let newRow = headers.map(h => dataObj[h] !== undefined ? dataObj[h] : '');
  sheet.appendRow(newRow);
  return { success: true };
}

// 5. Update Data
function updateRecord(sheetName, rowIndex, dataObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  
  const headers = sheet.getDataRange().getValues()[0];
  let updatedRow = headers.map(h => dataObj[h] !== undefined ? dataObj[h] : '');
  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  return { success: true };
}

// 6. Hapus Data
function deleteRecord(sheetName, rowIndex) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  
  sheet.deleteRow(rowIndex);
  return { success: true };
}