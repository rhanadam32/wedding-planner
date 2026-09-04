// ==========================================
// 1. ENTRY POINT WAJIB GOOGLE APPS SCRIPT
// ==========================================
function doGet(e) {
  try {
    return doGetRencana(e);
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (body.action === 'login') {
      return handleLogin(body, ss);
    }

    if (isTransaksiAction(body.action)) {
      return doPostTransaksi(body, ss);
    }

    if (isTamuAction(body.action)) {
      return doPostTamu(body, ss);
    }

    if (isPengantinAction(body.action)) {
      return doPostPengantin(body, ss);
    }

    return doPostRencana(body, ss);
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function isTransaksiAction(action) {
  return action === 'getTransaksi' ||
    action === 'addTransaksi' ||
    action === 'updateTransaksi' ||
    action === 'deleteTransaksi';
}

function isTamuAction(action){
  return action === 'getTamu' ||
  action === 'addTamu' ||
  action === 'updateTamu' ||
  action === 'deleteTamu'
}

function isPengantinAction(action) {
  return action === 'getPengantin' ||
    action === 'savePengantin' ||
    action === 'updatePengantin' ||
    action === 'getAkun' ||
    action === 'saveAkun';
}

// ==========================================
// 2. FUNGSI KHUSUS RENCANA (Helper)
// ==========================================
function doGetRencana(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Rencana');

  if (!sheet) return responseJSON({ status: 'error', message: 'Sheet Rencana tidak ditemukan' });

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return responseJSON({ status: 'success', data: [] });

  const headers = rows[0]; // ['id', 'TugasRencana', 'tgl_deadline', 'status']
  const data = rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, idx) => {
      if (h === 'tgl_deadline' && row[idx] instanceof Date) {
        obj[h] = Utilities.formatDate(row[idx], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[h] = row[idx];
      }
    });
    return obj;
  });

  return responseJSON({ status: 'success', data: data });
}

function doPostRencana(body, ss) {
  const sheet = ss.getSheetByName('Rencana');
  const action = body.action;

  if (action === 'addRencana') {
    const newId = new Date().getTime().toString();
    sheet.appendRow([newId, body.TugasRencana, body.tgl_deadline || '', 'pending']);
    return responseJSON({
      status: 'success',
      message: 'Rencana berhasil ditambahkan',
      data: { id: newId, TugasRencana: body.TugasRencana, tgl_deadline: body.tgl_deadline, status: 'pending' }
    });
  }

  if (action === 'updateStatusRencana') {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === body.id.toString()) {
        sheet.getRange(i + 1, 4).setValue(body.status);
        return responseJSON({ status: 'success', message: 'Status rencana berhasil diupdate' });
      }
    }
    return responseJSON({ status: 'error', message: 'Tugas rencana tidak ditemukan' });
  }

  if (action === 'deleteRencana') {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === body.id.toString()) {
        sheet.deleteRow(i + 1);
        return responseJSON({ status: 'success', message: 'Tugas rencana berhasil dihapus' });
      }
    }
    return responseJSON({ status: 'error', message: 'Tugas rencana tidak ditemukan' });
  }

  return responseJSON({ status: 'error', message: 'Action tidak dikenal di modul Rencana' });
}

// ==========================================
// 3. FUNGSI KHUSUS TRANSAKSI (Helper)
// Sheet: Transaksi
// Header: id_transaksi | tanggal | Keterangan | Kategori | Kredit_Debit
// ==========================================
function rowsToTransaksi(rows) {
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h === 'tanggal' && row[idx] instanceof Date) {
        obj[h] = Utilities.formatDate(row[idx], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[h] = row[idx];
      }
    });
    return obj;
  });
}

function doPostTransaksi(body, ss) {
  const sheet = ss.getSheetByName('Transaksi');
  if (!sheet) {
    return responseJSON({ status: 'error', message: 'Sheet Transaksi tidak ditemukan' });
  }

  const action = body.action;

  if (action === 'getTransaksi') {
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return responseJSON({ status: 'success', data: [] });
    return responseJSON({ status: 'success', data: rowsToTransaksi(rows) });
  }

  if (action === 'addTransaksi') {
    const newId = new Date().getTime().toString();
    const tanggal = body.tanggal || '';
    const Keterangan = body.Keterangan || '';
    const Kategori = body.Kategori || '';
    const Kredit_Debit = body.Kredit_Debit !== undefined && body.Kredit_Debit !== null
      ? body.Kredit_Debit
      : '';

    sheet.appendRow([newId, tanggal, Keterangan, Kategori, Kredit_Debit]);
    return responseJSON({
      status: 'success',
      message: 'Transaksi berhasil ditambahkan',
      data: {
        id_transaksi: newId,
        tanggal: tanggal,
        Keterangan: Keterangan,
        Kategori: Kategori,
        Kredit_Debit: Kredit_Debit
      }
    });
  }

  if (action === 'updateTransaksi') {
    if (!body.id_transaksi) {
      return responseJSON({ status: 'error', message: 'id_transaksi wajib diisi' });
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === body.id_transaksi.toString()) {
        const rowIndex = i + 1;
        if (body.tanggal !== undefined) sheet.getRange(rowIndex, 2).setValue(body.tanggal);
        if (body.Keterangan !== undefined) sheet.getRange(rowIndex, 3).setValue(body.Keterangan);
        if (body.Kategori !== undefined) sheet.getRange(rowIndex, 4).setValue(body.Kategori);
        if (body.Kredit_Debit !== undefined) sheet.getRange(rowIndex, 5).setValue(body.Kredit_Debit);
        return responseJSON({ status: 'success', message: 'Transaksi berhasil diupdate' });
      }
    }
    return responseJSON({ status: 'error', message: 'Transaksi tidak ditemukan' });
  }

  if (action === 'deleteTransaksi') {
    if (!body.id_transaksi) {
      return responseJSON({ status: 'error', message: 'id_transaksi wajib diisi' });
    }

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === body.id_transaksi.toString()) {
        sheet.deleteRow(i + 1);
        return responseJSON({ status: 'success', message: 'Transaksi berhasil dihapus' });
      }
    }
    return responseJSON({ status: 'error', message: 'Transaksi tidak ditemukan' });
  }

  return responseJSON({ status: 'error', message: 'Action tidak dikenal di modul Transaksi' });
}

// ==========================================
// 4. FUNGSI HELPER SHEET TAMU
// ==========================================

function rowsToTamu(rows) {
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}

function doPostTamu(body, ss){
  const sheetTamu = ss.getSheetByName('Tamu');
  if (!sheetTamu) {
    return responseJSON({ status: 'error', message: 'Sheet Tamu tidak ditemukan' });
  }

  const action = body.action;

  if (action === 'getTamu') {
    const rows = sheetTamu.getDataRange().getValues();
    if (rows.length <= 1) return responseJSON({ status: 'success', data: [] });
    return responseJSON({ status: 'success', data: rowsToTamu(rows) });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (action === 'addTamu') {
      const newId = new Date().getTime().toString();
      const nama_tamu = body.nama_tamu || '';
      const kategori = body.kategori || '';
      const kontak = body.kontak ? `'` + body.kontak.toString().replace(/^'/, '') : '';
      const konfirmasi = body.konfirmasi || 'Pending';

      sheetTamu.appendRow([newId, nama_tamu, kategori, kontak, konfirmasi]);
      SpreadsheetApp.flush();
      return responseJSON({
        status: 'success',
        message: 'Tamu berhasil ditambahkan',
        data: {
          id: newId,
          nama_tamu: nama_tamu,
          kategori: kategori,
          kontak: kontak.replace(/^'/, ''),
          konfirmasi: konfirmasi
        }
      });
    }

    if (action === 'updateTamu') {
      if (!body.id) {
        return responseJSON({ status: 'error', message: 'id tamu wajib diisi' });
      }

      const data = sheetTamu.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] != null && String(data[i][0]).trim() === String(body.id).trim()) {
          const rowIndex = i + 1;
          const updatedRow = [
            body.nama_tamu !== undefined ? body.nama_tamu : data[i][1],
            body.kategori !== undefined ? body.kategori : data[i][2],
            body.kontak !== undefined ? `'` + body.kontak.toString().replace(/^'/, '') : data[i][3],
            body.konfirmasi !== undefined ? body.konfirmasi : data[i][4]
          ];
          sheetTamu.getRange(rowIndex, 2, 1, 4).setValues([updatedRow]);
          SpreadsheetApp.flush();
          return responseJSON({ status: 'success', message: 'Data tamu berhasil diupdate' });
        }
      }
      return responseJSON({ status: 'error', message: 'Tamu tidak ditemukan' });
    }

    if (action === 'deleteTamu') {
      if (!body.id) {
        return responseJSON({ status: 'error', message: 'id tamu wajib diisi' });
      }

      const data = sheetTamu.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] != null && String(data[i][0]).trim() === String(body.id).trim()) {
          sheetTamu.deleteRow(i + 1);
          SpreadsheetApp.flush();
          return responseJSON({ status: 'success', message: 'Tamu berhasil dihapus' });
        }
      }
      return responseJSON({ status: 'error', message: 'Tamu tidak ditemukan' });
    }
  } catch (lockErr) {
    return responseJSON({ status: 'error', message: 'Server sibuk, silakan coba lagi: ' + lockErr.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }

  return responseJSON({ status: 'error', message: 'Action tidak dikenal di modul Tamu' });
}
// ==========================================
// 5. FUNGSI KHUSUS LOGIN
// ==========================================
function handleLogin(body, ss) {
  const sheetUsers = ss.getSheetByName('Users');
  const rows = sheetUsers.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const user = {};
    headers.forEach((h, idx) => user[h] = rows[i][idx]);

    if (user.username.toString() === (body.username || '').toString().trim() &&
        user.password.toString() === (body.password || '').toString().trim()) {
      return responseJSON({
        status: 'success',
        token: Utilities.base64Encode(user.username + ':' + new Date().getTime()),
        user: { name: user.name, role: user.role, username: user.username }
      });
    }
  }
  return responseJSON({ status: 'error', message: 'Username atau Password salah!' });
}

// ==========================================
// 6. FUNGSI HELPER SHEET PENGANTIN / AKUN
// Field: id, calon_pengantin_pria, calon_pengantin_wanita, tanggal_pernikahan, Lokasi
// ==========================================
function getPengantinSheet(ss) {
  let sheet = ss.getSheetByName('Pengantin');
  if (!sheet) {
    sheet = ss.getSheetByName('Akun');
  }
  if (!sheet) {
    sheet = ss.getSheetByName('Pernikahan');
  }
  if (!sheet) {
    sheet = ss.insertSheet('Pengantin');
    sheet.appendRow(['id', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi']);
  }
  return sheet;
}

function rowsToPengantin(rows) {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h).trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      if ((h === 'tanggal_pernikahan' || h.toLowerCase() === 'tanggal_pernikahan') && row[idx] instanceof Date) {
        obj[h] = Utilities.formatDate(row[idx], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[h] = row[idx];
      }
    });
    return obj;
  });
}

function doPostPengantin(body, ss) {
  const sheet = getPengantinSheet(ss);
  if (!sheet) {
    return responseJSON({ status: 'error', message: 'Sheet Pengantin/Akun tidak ditemukan' });
  }

  const action = body.action;

  if (action === 'getPengantin' || action === 'getAkun') {
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return responseJSON({ status: 'success', data: null });
    const list = rowsToPengantin(rows);
    return responseJSON({ status: 'success', data: list.length > 0 ? list[0] : null });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0].map(h => String(h).trim());

    const getColIndex = (name) => {
      const target = name.toLowerCase();
      const idx = headers.findIndex(h => h.toLowerCase() === target);
      return idx !== -1 ? idx : -1;
    };

    const idCol = getColIndex('id') !== -1 ? getColIndex('id') : 0;
    const priaCol = getColIndex('calon_pengantin_pria') !== -1 ? getColIndex('calon_pengantin_pria') : 1;
    const wanitaCol = getColIndex('calon_pengantin_wanita') !== -1 ? getColIndex('calon_pengantin_wanita') : 2;
    const tglCol = getColIndex('tanggal_pernikahan') !== -1 ? getColIndex('tanggal_pernikahan') : 3;
    const lokasiCol = getColIndex('Lokasi') !== -1 ? getColIndex('Lokasi') : 4;

    const pria = body.calon_pengantin_pria !== undefined ? body.calon_pengantin_pria : '';
    const wanita = body.calon_pengantin_wanita !== undefined ? body.calon_pengantin_wanita : '';
    const tgl = body.tanggal_pernikahan !== undefined ? body.tanggal_pernikahan : '';
    const lokasi = body.Lokasi !== undefined ? body.Lokasi : (body.lokasi !== undefined ? body.lokasi : '');

    let targetRowIndex = -1;
    if (body.id) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idCol] != null && String(rows[i][idCol]).trim() === String(body.id).trim()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    // Jika tidak ditemukan ID yang cocok tapi sudah ada baris data, update baris data pertama
    if (targetRowIndex === -1 && rows.length > 1) {
      targetRowIndex = 2;
    }

    let finalId = body.id;

    if (targetRowIndex !== -1) {
      finalId = rows[targetRowIndex - 1][idCol] || body.id || '1';
      sheet.getRange(targetRowIndex, idCol + 1).setValue(finalId);
      sheet.getRange(targetRowIndex, priaCol + 1).setValue(pria);
      sheet.getRange(targetRowIndex, wanitaCol + 1).setValue(wanita);
      sheet.getRange(targetRowIndex, tglCol + 1).setValue(tgl);
      sheet.getRange(targetRowIndex, lokasiCol + 1).setValue(lokasi);
    } else {
      finalId = body.id || '1';
      const maxCols = Math.max(headers.length, 5);
      const newRow = [];
      for (let c = 0; c < maxCols; c++) {
        newRow.push('');
      }
      newRow[idCol] = finalId;
      newRow[priaCol] = pria;
      newRow[wanitaCol] = wanita;
      newRow[tglCol] = tgl;
      newRow[lokasiCol] = lokasi;
      sheet.appendRow(newRow);
    }

    SpreadsheetApp.flush();
    return responseJSON({
      status: 'success',
      message: 'Data pernikahan berhasil disimpan',
      data: {
        id: finalId,
        calon_pengantin_pria: pria,
        calon_pengantin_wanita: wanita,
        tanggal_pernikahan: tgl,
        Lokasi: lokasi
      }
    });
  } catch (lockErr) {
    return responseJSON({ status: 'error', message: 'Server sibuk, silakan coba lagi: ' + lockErr.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
