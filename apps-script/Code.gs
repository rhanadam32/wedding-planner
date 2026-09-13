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

    if (isRencanaAction(body.action)) {
      return doPostRencana(body, ss);
    }

    return doPostRencana(body, ss);
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function isRencanaAction(action) {
  return action === 'getRencana' ||
    action === 'addRencana' ||
    action === 'updateStatusRencana' ||
    action === 'deleteRencana';
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
    action === 'deleteTamu';
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
// Header Sheet Rencana: id | id_user | TugasRencana | tgl_deadline | status
// ==========================================
function getRencanaSheet(ss) {
  let sheet = ss.getSheetByName('Rencana');
  if (!sheet) {
    sheet = ss.insertSheet('Rencana');
    sheet.appendRow(['id', 'id_user', 'TugasRencana', 'tgl_deadline', 'status']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'id_user', 'TugasRencana', 'tgl_deadline', 'status']);
  }
  return sheet;
}

function cleanHeaderKey(h) {
  return String(h || '').toLowerCase().replace(/[\s_]+/g, '');
}

function ensureRencanaHeaders(sheet) {
  const dataRange = sheet.getDataRange();
  const rows = dataRange.getValues();
  if (rows.length === 0) {
    sheet.appendRow(['id', 'id_user', 'TugasRencana', 'tgl_deadline', 'status']);
    return ['id', 'id_user', 'TugasRencana', 'tgl_deadline', 'status'];
  }
  const headers = rows[0].map(h => String(h).trim());
  const idUserIdx = headers.findIndex(h => {
    const c = cleanHeaderKey(h);
    return c === 'iduser' || c === 'userid' || c === 'user';
  });
  if (idUserIdx === -1) {
    // Sisipkan atau tambahkan kolom id_user jika belum ada di gsheet
    sheet.getRange(1, headers.length + 1).setValue('id_user');
    headers.push('id_user');
  }
  return headers;
}

function findMatchingUserIds(ss, inputUser) {
  const ids = [];
  if (inputUser !== undefined && inputUser !== null && String(inputUser).trim() !== '') {
    const raw = String(inputUser).trim();
    ids.push(raw);
    try {
      const sheetUsers = ss.getSheetByName('Users');
      if (sheetUsers) {
        const uRows = sheetUsers.getDataRange().getValues();
        if (uRows.length > 1) {
          const uHeaders = uRows[0].map(cleanHeaderKey);
          const uIdIdx = uHeaders.findIndex(h => h === 'iduser' || h === 'id');
          const uNameIdx = uHeaders.findIndex(h => h === 'username');
          for (let i = 1; i < uRows.length; i++) {
            const rId = uIdIdx !== -1 ? String(uRows[i][uIdIdx]).trim() : '';
            const rUser = uNameIdx !== -1 ? String(uRows[i][uNameIdx]).trim() : '';
            if (ids.includes(rId) || ids.includes(rUser)) {
              if (rId && !ids.includes(rId)) ids.push(rId);
              if (rUser && !ids.includes(rUser)) ids.push(rUser);
            }
          }
        }
      }
    } catch (e) {}
  }
  return ids;
}

function mapRencanaRows(headers, rows) {
  const cleanHeaders = headers.map(cleanHeaderKey);

  const getIdx = (patterns) => {
    return cleanHeaders.findIndex(c => patterns.includes(c));
  };

  const idCol = getIdx(['id', 'idrencana']);
  const idUserCol = getIdx(['iduser', 'userid', 'user']);
  const tugasCol = getIdx(['tugasrencana', 'tugas', 'rencana']);
  const tglCol = getIdx(['tgldeadline', 'deadline', 'target', 'tanggal']);
  const statusCol = getIdx(['status', 'keadaan']);

  return rows.slice(1).map((row, rowIdx) => {
    let rawId = idCol !== -1 ? row[idCol] : (row[0] || (rowIdx + 1));
    let rawUser = idUserCol !== -1 ? row[idUserCol] : '';
    let rawTugas = tugasCol !== -1 ? row[tugasCol] : (row[2] || '');
    let rawTgl = tglCol !== -1 ? row[tglCol] : (row[3] || '');
    let rawStatus = statusCol !== -1 ? row[statusCol] : (row[4] || 'pending');

    let formattedTgl = rawTgl;
    if (rawTgl instanceof Date) {
      formattedTgl = Utilities.formatDate(rawTgl, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }

    let normalizedStatus = String(rawStatus || '').toLowerCase().trim();
    if (normalizedStatus !== 'selesai') {
      normalizedStatus = 'pending';
    }

    return {
      id: rawId,
      id_user: rawUser,
      TugasRencana: String(rawTugas || '').trim(),
      tgl_deadline: String(formattedTgl || '').trim(),
      status: normalizedStatus
    };
  });
}

function doGetRencana(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getRencanaSheet(ss);
  const headers = ensureRencanaHeaders(sheet);

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return responseJSON({ status: 'success', data: [] });

  const idUserParam = (e && e.parameter && e.parameter.id_user !== undefined && e.parameter.id_user !== null)
    ? String(e.parameter.id_user).trim()
    : null;

  const data = mapRencanaRows(headers, rows);

  if (idUserParam) {
    const validIds = findMatchingUserIds(ss, idUserParam);
    const filtered = data.filter(item => {
      const itemUser = String(item.id_user || '').trim();
      return validIds.includes(itemUser) || itemUser === '';
    });
    return responseJSON({ status: 'success', data: filtered });
  }

  return responseJSON({ status: 'success', data: data });
}

function doPostRencana(body, ss) {
  const sheet = getRencanaSheet(ss);
  const action = body.action;

  if (action === 'getRencana') {
    const headers = ensureRencanaHeaders(sheet);
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return responseJSON({ status: 'success', data: [] });

    const targetIdUser = (body.id_user !== undefined && body.id_user !== null)
      ? String(body.id_user).trim()
      : null;

    const data = mapRencanaRows(headers, rows);

    if (targetIdUser) {
      const validIds = findMatchingUserIds(ss, targetIdUser);
      if (body.username) {
        const u = String(body.username).trim();
        if (u && !validIds.includes(u)) validIds.push(u);
      }
      const filtered = data.filter(item => {
        const itemUser = String(item.id_user || '').trim();
        return validIds.includes(itemUser) || itemUser === '';
      });
      return responseJSON({ status: 'success', data: filtered });
    }

    return responseJSON({ status: 'success', data: data });
  }

  if (action === 'addRencana') {
    const headers = ensureRencanaHeaders(sheet);
    const cleanHeaders = headers.map(cleanHeaderKey);

    const getCol = (patterns, fallback) => {
      const idx = cleanHeaders.findIndex(c => patterns.includes(c));
      return idx !== -1 ? idx : fallback;
    };

    const idCol = getCol(['id', 'idrencana'], 0);
    const idUserCol = getCol(['iduser', 'userid', 'user'], 1);
    const tugasCol = getCol(['tugasrencana', 'tugas', 'rencana'], 2);
    const tglCol = getCol(['tgldeadline', 'deadline', 'target', 'tanggal'], 3);
    const statusCol = getCol(['status', 'keadaan'], 4);

    const newId = new Date().getTime().toString();
    const idUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : '';
    const tugas = body.TugasRencana || '';
    const tgl = body.tgl_deadline || '';

    const newRow = new Array(headers.length).fill('');
    newRow[idCol] = newId;
    newRow[idUserCol] = idUser;
    newRow[tugasCol] = tugas;
    newRow[tglCol] = tgl;
    newRow[statusCol] = 'pending';

    sheet.appendRow(newRow);
    return responseJSON({
      status: 'success',
      message: 'Rencana berhasil ditambahkan',
      data: {
        id: newId,
        id_user: idUser,
        TugasRencana: tugas,
        tgl_deadline: tgl,
        status: 'pending'
      }
    });
  }

  if (action === 'updateStatusRencana') {
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(cleanHeaderKey);
    const idCol = headers.findIndex(h => h === 'id' || h === 'idrencana');
    const statusCol = headers.findIndex(h => h === 'status' || h === 'keadaan');
    const safeIdCol = idCol !== -1 ? idCol : 0;
    const safeStatusCol = statusCol !== -1 ? statusCol : 4;

    const targetId = String(body.id ?? '').trim();

    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][safeIdCol] ?? '').trim();
      if (rowId === targetId) {
        sheet.getRange(i + 1, safeStatusCol + 1).setValue(body.status);
        return responseJSON({ status: 'success', message: 'Status rencana berhasil diupdate' });
      }
    }
    return responseJSON({ status: 'error', message: 'Tugas rencana tidak ditemukan' });
  }

  if (action === 'deleteRencana') {
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(cleanHeaderKey);
    const idCol = headers.findIndex(h => h === 'id' || h === 'idrencana');
    const safeIdCol = idCol !== -1 ? idCol : 0;

    const targetId = String(body.id ?? '').trim();

    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][safeIdCol] ?? '').trim();
      if (rowId === targetId) {
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
// Header: id_transaksi | tanggal | Keterangan | Kategori | Kredit_Debit (| id_user)
// ==========================================
function rowsToTransaksi(rows) {
  const headers = rows[0].map(h => String(h).trim());
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

    const headers = rows[0].map(h => String(h).trim());
    const idUserCol = headers.findIndex(h => h.toLowerCase() === 'id_user');
    const targetIdUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : null;

    let list = rowsToTransaksi(rows);
    if (targetIdUser && idUserCol !== -1) {
      list = list.filter(item => String(item.id_user || '').trim() === targetIdUser);
    }

    return responseJSON({ status: 'success', data: list });
  }

  if (action === 'addTransaksi') {
    const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
    const idUserCol = headers.findIndex(h => h.toLowerCase() === 'id_user');

    const newId = new Date().getTime().toString();
    const tanggal = body.tanggal || '';
    const Keterangan = body.Keterangan || '';
    const Kategori = body.Kategori || '';
    const Kredit_Debit = body.Kredit_Debit !== undefined && body.Kredit_Debit !== null
      ? body.Kredit_Debit
      : '';
    const idUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : '';

    if (idUserCol !== -1) {
      const newRow = new Array(headers.length).fill('');
      const idCol = headers.findIndex(h => h.toLowerCase() === 'id_transaksi');
      const tglCol = headers.findIndex(h => h.toLowerCase() === 'tanggal');
      const ketCol = headers.findIndex(h => h.toLowerCase() === 'keterangan');
      const katCol = headers.findIndex(h => h.toLowerCase() === 'kategori');
      const kdCol = headers.findIndex(h => h.toLowerCase() === 'kredit_debit');

      newRow[idCol !== -1 ? idCol : 0] = newId;
      newRow[tglCol !== -1 ? tglCol : 1] = tanggal;
      newRow[ketCol !== -1 ? ketCol : 2] = Keterangan;
      newRow[katCol !== -1 ? katCol : 3] = Kategori;
      newRow[kdCol !== -1 ? kdCol : 4] = Kredit_Debit;
      newRow[idUserCol] = idUser;
      sheet.appendRow(newRow);
    } else {
      sheet.appendRow([newId, tanggal, Keterangan, Kategori, Kredit_Debit]);
    }

    return responseJSON({
      status: 'success',
      message: 'Transaksi berhasil ditambahkan',
      data: {
        id_transaksi: newId,
        id_user: idUser,
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
    const headers = data[0].map(h => String(h).trim());
    const idCol = headers.findIndex(h => h.toLowerCase() === 'id_transaksi') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'id_transaksi') : 0;
    const tglCol = headers.findIndex(h => h.toLowerCase() === 'tanggal') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'tanggal') : 1;
    const ketCol = headers.findIndex(h => h.toLowerCase() === 'keterangan') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'keterangan') : 2;
    const katCol = headers.findIndex(h => h.toLowerCase() === 'kategori') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'kategori') : 3;
    const kdCol = headers.findIndex(h => h.toLowerCase() === 'kredit_debit') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'kredit_debit') : 4;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol].toString() === body.id_transaksi.toString()) {
        const rowIndex = i + 1;
        if (body.tanggal !== undefined) sheet.getRange(rowIndex, tglCol + 1).setValue(body.tanggal);
        if (body.Keterangan !== undefined) sheet.getRange(rowIndex, ketCol + 1).setValue(body.Keterangan);
        if (body.Kategori !== undefined) sheet.getRange(rowIndex, katCol + 1).setValue(body.Kategori);
        if (body.Kredit_Debit !== undefined) sheet.getRange(rowIndex, kdCol + 1).setValue(body.Kredit_Debit);
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
    const headers = data[0].map(h => String(h).trim());
    const idCol = headers.findIndex(h => h.toLowerCase() === 'id_transaksi') !== -1 ? headers.findIndex(h => h.toLowerCase() === 'id_transaksi') : 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol].toString() === body.id_transaksi.toString()) {
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
  const headers = rows[0].map(h => String(h).trim());
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

    const headers = rows[0].map(h => String(h).trim());
    const idUserCol = headers.findIndex(h => h.toLowerCase() === 'id_user');
    const targetIdUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : null;

    let list = rowsToTamu(rows);
    if (targetIdUser && idUserCol !== -1) {
      list = list.filter(item => String(item.id_user || '').trim() === targetIdUser);
    }
    return responseJSON({ status: 'success', data: list });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const headers = sheetTamu.getDataRange().getValues()[0].map(h => String(h).trim());
    const idUserCol = headers.findIndex(h => h.toLowerCase() === 'id_user');

    if (action === 'addTamu') {
      const newId = new Date().getTime().toString();
      const nama_tamu = body.nama_tamu || '';
      const kategori = body.kategori || '';
      const kontak = body.kontak ? `'` + body.kontak.toString().replace(/^'/, '') : '';
      const konfirmasi = body.konfirmasi || 'Pending';
      const idUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : '';

      if (idUserCol !== -1) {
        const newRow = new Array(headers.length).fill('');
        const idCol = headers.findIndex(h => h.toLowerCase() === 'id');
        const namaCol = headers.findIndex(h => h.toLowerCase() === 'nama_tamu');
        const katCol = headers.findIndex(h => h.toLowerCase() === 'kategori');
        const kontakCol = headers.findIndex(h => h.toLowerCase() === 'kontak');
        const konfCol = headers.findIndex(h => h.toLowerCase() === 'konfirmasi');

        newRow[idCol !== -1 ? idCol : 0] = newId;
        newRow[namaCol !== -1 ? namaCol : 1] = nama_tamu;
        newRow[katCol !== -1 ? katCol : 2] = kategori;
        newRow[kontakCol !== -1 ? kontakCol : 3] = kontak;
        newRow[konfCol !== -1 ? konfCol : 4] = konfirmasi;
        newRow[idUserCol] = idUser;
        sheetTamu.appendRow(newRow);
      } else {
        sheetTamu.appendRow([newId, nama_tamu, kategori, kontak, konfirmasi]);
      }

      SpreadsheetApp.flush();
      return responseJSON({
        status: 'success',
        message: 'Tamu berhasil ditambahkan',
        data: {
          id: newId,
          id_user: idUser,
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
// Mengembalikan id_user dari Sheet Users
// ==========================================
function handleLogin(body, ss) {
  const sheetUsers = ss.getSheetByName('Users');
  if (!sheetUsers) {
    return responseJSON({ status: 'error', message: 'Sheet Users tidak ditemukan' });
  }

  const rows = sheetUsers.getDataRange().getValues();
  if (rows.length <= 1) {
    return responseJSON({ status: 'error', message: 'Data pengguna kosong' });
  }

  const headers = rows[0].map(h => String(h).trim());

  for (let i = 1; i < rows.length; i++) {
    const user = {};
    headers.forEach((h, idx) => user[h] = rows[i][idx]);

    const inputUsername = (body.username || '').toString().trim();
    const inputPassword = (body.password || '').toString().trim();

    if (user.username && user.username.toString().trim() === inputUsername &&
        user.password && user.password.toString().trim() === inputPassword) {

      // Cari id_user dari header 'id_user' atau 'id' atau fallback ke username
      let idUser = '';
      if (user.id_user !== undefined && user.id_user !== null && String(user.id_user).trim() !== '') {
        idUser = String(user.id_user).trim();
      } else if (user.id !== undefined && user.id !== null && String(user.id).trim() !== '') {
        idUser = String(user.id).trim();
      } else {
        idUser = user.username.toString().trim();
      }

      return responseJSON({
        status: 'success',
        token: Utilities.base64Encode(user.username + ':' + new Date().getTime()),
        user: {
          id_user: idUser,
          name: user.name || user.username,
          role: user.role || 'user',
          username: user.username
        }
      });
    }
  }
  return responseJSON({ status: 'error', message: 'Username atau Password salah!' });
}

// ==========================================
// 6. FUNGSI HELPER SHEET PENGANTIN / AKUN
// Header: id | id_user | calon_pengantin_pria | calon_pengantin_wanita | tanggal_pernikahan | Lokasi
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
    sheet.appendRow(['id', 'id_user', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'id_user', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi']);
  }
  return sheet;
}

function ensurePengantinHeaders(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length === 0) {
    sheet.appendRow(['id', 'id_user', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi']);
    return ['id', 'id_user', 'calon_pengantin_pria', 'calon_pengantin_wanita', 'tanggal_pernikahan', 'Lokasi'];
  }
  const headers = rows[0].map(h => String(h).trim());
  const idUserIdx = headers.findIndex(h => h.toLowerCase() === 'id_user');
  if (idUserIdx === -1) {
    sheet.getRange(1, headers.length + 1).setValue('id_user');
    headers.push('id_user');
  }
  return headers;
}

function rowsToPengantin(rows) {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => String(h).trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      if ((h.toLowerCase() === 'tanggal_pernikahan') && row[idx] instanceof Date) {
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

  const headers = ensurePengantinHeaders(sheet);
  const action = body.action;

  // A. Ambil profil pengantin berdasarkan id_user
  if (action === 'getPengantin' || action === 'getAkun') {
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return responseJSON({ status: 'success', data: null });

    const list = rowsToPengantin(rows);
    const targetIdUser = (body.id_user !== undefined && body.id_user !== null)
      ? String(body.id_user).trim()
      : '';

    if (targetIdUser) {
      const match = list.find(item => String(item.id_user || '').trim() === targetIdUser);
      return responseJSON({ status: 'success', data: match || null });
    }

    // Jika tanpa id_user (misal akun default), kembalikan baris pertama jika ada
    return responseJSON({ status: 'success', data: list.length > 0 ? list[0] : null });
  }

  // B. Simpan / update profil pengantin terpisah per id_user
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const rows = sheet.getDataRange().getValues();
    const curHeaders = rows[0].map(h => String(h).trim());

    const getColIndex = (name) => {
      const target = name.toLowerCase();
      return curHeaders.findIndex(h => h.toLowerCase() === target);
    };

    const idCol = getColIndex('id') !== -1 ? getColIndex('id') : 0;
    const idUserCol = getColIndex('id_user') !== -1 ? getColIndex('id_user') : 1;
    const priaCol = getColIndex('calon_pengantin_pria') !== -1 ? getColIndex('calon_pengantin_pria') : 2;
    const wanitaCol = getColIndex('calon_pengantin_wanita') !== -1 ? getColIndex('calon_pengantin_wanita') : 3;
    const tglCol = getColIndex('tanggal_pernikahan') !== -1 ? getColIndex('tanggal_pernikahan') : 4;
    const lokasiCol = getColIndex('Lokasi') !== -1 ? getColIndex('Lokasi') : 5;

    const targetIdUser = (body.id_user !== undefined && body.id_user !== null) ? String(body.id_user).trim() : '';
    const pria = body.calon_pengantin_pria !== undefined ? body.calon_pengantin_pria : '';
    const wanita = body.calon_pengantin_wanita !== undefined ? body.calon_pengantin_wanita : '';
    const tgl = body.tanggal_pernikahan !== undefined ? body.tanggal_pernikahan : '';
    const lokasi = body.Lokasi !== undefined ? body.Lokasi : (body.lokasi !== undefined ? body.lokasi : '');

    let targetRowIndex = -1;

    // 1. Cari berdasarkan id_user terlebih dahulu agar akun terpisah
    if (targetIdUser && idUserCol !== -1) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idUserCol] != null && String(rows[i][idUserCol]).trim() === targetIdUser) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    // 2. Jika belum ditemukan dan ada body.id, cari berdasarkan id
    if (targetRowIndex === -1 && body.id) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idCol] != null && String(rows[i][idCol]).trim() === String(body.id).trim()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    let finalId = body.id;

    if (targetRowIndex !== -1) {
      // Update data baris milik user yang bersangkutan
      finalId = rows[targetRowIndex - 1][idCol] || body.id || ('P-' + new Date().getTime());
      sheet.getRange(targetRowIndex, idCol + 1).setValue(finalId);
      if (idUserCol !== -1 && targetIdUser) {
        sheet.getRange(targetRowIndex, idUserCol + 1).setValue(targetIdUser);
      }
      sheet.getRange(targetRowIndex, priaCol + 1).setValue(pria);
      sheet.getRange(targetRowIndex, wanitaCol + 1).setValue(wanita);
      sheet.getRange(targetRowIndex, tglCol + 1).setValue(tgl);
      sheet.getRange(targetRowIndex, lokasiCol + 1).setValue(lokasi);
    } else {
      // Buat baris baru untuk akun user ini (tidak menimpa data akun lain)
      finalId = body.id || ('P-' + new Date().getTime());
      const maxCols = Math.max(curHeaders.length, 6);
      const newRow = new Array(maxCols).fill('');
      newRow[idCol] = finalId;
      if (idUserCol !== -1) newRow[idUserCol] = targetIdUser;
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
        id_user: targetIdUser,
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
