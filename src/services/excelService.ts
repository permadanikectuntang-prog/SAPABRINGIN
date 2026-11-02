/**
 * Excel Service for SIAP BRINGIN
 * Handles importing raw Excel files (.xlsx, .xls, .csv), mapping columns,
 * validating NIK & dates, detecting duplicates, and exporting data.
 */

import * as XLSX from 'xlsx';
import { ServiceConfig, ServiceRecord } from '../types';

export interface ImportSummary {
  fileName: string;
  sheetCount: number;
  totalRowsRead: number;
  successfullyImported: number;
  skippedDuplicates: number;
  invalidRows: number;
  importedRecords: ServiceRecord[];
  details: {
    serviceName: string;
    sheetName: string;
    imported: number;
    skipped: number;
    errors: string[];
  }[];
}

/**
 * Normalizes any Excel date value (serial number or string) into YYYY-MM-DD
 */
export function normalizeExcelDate(val: any): string {
  if (!val) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // If number, Excel serial date (days since 1899-12-30)
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  // Check if DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Check if YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes NIK strictly to a string preserving leading zeros
 */
export function normalizeNik(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // Strip scientific notation if any e.g. 3.32211e+15
  if (str.toLowerCase().includes('e+')) {
    try {
      const num = Number(val);
      if (!isNaN(num)) {
        str = BigInt(Math.floor(num)).toString();
      }
    } catch {
      // keep str
    }
  }
  // Strip any non-digit characters
  str = str.replace(/[^\d]/g, '');
  return str;
}

/**
 * Parses an uploaded Excel file and maps rows to ServiceRecords
 */
export async function parseExcelFile(
  file: File,
  services: ServiceConfig[],
  existingRecords: ServiceRecord[],
  userName: string = 'Petugas Impor'
): Promise<ImportSummary> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: false, cellText: false });
  
  const summary: ImportSummary = {
    fileName: file.name,
    sheetCount: workbook.SheetNames.length,
    totalRowsRead: 0,
    successfullyImported: 0,
    skippedDuplicates: 0,
    invalidRows: 0,
    importedRecords: [],
    details: [],
  };

  const existingNiks = new Set<string>();
  existingRecords.forEach(r => {
    if (r.nik && r.serviceId) {
      existingNiks.add(`${r.serviceId}:${r.nik}:${r.serviceDate}`);
    }
  });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Read raw 2D array of rows
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (!rawRows || rawRows.length === 0) continue;

    // Find matched service for this sheet
    const cleanSheetName = sheetName.trim().toUpperCase().replace(/[_-\s]+/g, ' ');
    const matchedService = services.find(s => {
      const sName = s.name.trim().toUpperCase().replace(/[_-\s]+/g, ' ');
      const sSheet = s.sheetName.trim().toUpperCase().replace(/[_-\s]+/g, ' ');
      return sSheet.includes(cleanSheetName) || cleanSheetName.includes(sName) || cleanSheetName.includes(sSheet);
    }) || services.find(s => cleanSheetName.includes('KK') && s.id === 'cetak-kk')
       || services.find(s => cleanSheetName.includes('KTP') && s.id === 'cetak-ktp-kia')
       || services.find(s => cleanSheetName.includes('PINDAH KELUAR') && s.id === 'pindah-keluar')
       || services.find(s => cleanSheetName.includes('PINDAH DATANG') && s.id === 'pindah-datang')
       || services.find(s => cleanSheetName.includes('SKCK') && s.id === 'skck')
       || services.find(s => cleanSheetName.includes('NTCR') && s.id === 'ntcr')
       || services.find(s => cleanSheetName.includes('SKTM') && s.id === 'sktm-bpjs')
       || services.find(s => cleanSheetName.includes('KERAMAIAN') && s.id === 'ijin-keramaian')
       || services.find(s => cleanSheetName.includes('LAHIR') && s.id === 'akta-kelahiran')
       || services.find(s => cleanSheetName.includes('MATI') && s.id === 'akta-kematian')
       || services.find(s => cleanSheetName.includes('WARIS') && s.id === 'ahli-waris')
       || services.find(s => cleanSheetName.includes('PROPOSAL') && s.id === 'proposal')
       || services[0]; // fallback to first service

    const sheetDetail = {
      serviceName: matchedService.name,
      sheetName,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Locate header row: Look for row containing "nama" or "pemohon" or "nik" or "tanggal"
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('nama') || rowStr.includes('pemohon') || rowStr.includes('nik') || rowStr.includes('nomor')) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      sheetDetail.errors.push(`Header kolom tidak ditemukan pada sheet "${sheetName}".`);
      summary.details.push(sheetDetail);
      continue;
    }

    const headers = rawRows[headerRowIdx].map(c => String(c).trim().toLowerCase());
    const dataRows = rawRows.slice(headerRowIdx + 1);

    summary.totalRowsRead += dataRows.length;

    // Build column index map
    const colMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      if (h.includes('nama') && !h.includes('ayah') && !h.includes('ibu') && !h.includes('calon')) colMap['nama'] = idx;
      if (h.includes('nik') && !h.includes('ayah') && !h.includes('ibu')) colMap['nik'] = idx;
      if (h.includes('tgl') || h.includes('tanggal') || h.includes('hari')) colMap['tanggal'] = idx;
      if (h.includes('no') || h.includes('nomor')) colMap['nomor'] = idx;
      if (h.includes('desa') || h.includes('alamat')) colMap['desa'] = idx;
      if (h.includes('rt')) colMap['rt'] = idx;
      if (h.includes('rw')) colMap['rw'] = idx;
      if (h.includes('umur') || h.includes('usia')) colMap['umur'] = idx;
      if (h.includes('pendidikan')) colMap['pendidikan'] = idx;
      if (h.includes('pekerjaan')) colMap['pekerjaan'] = idx;
      if (h.includes('jenis')) colMap['jenis'] = idx;
      if (h.includes('ket') || h.includes('keterangan') || h.includes('keperluan')) colMap['keterangan'] = idx;
    });

    for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
      const row = dataRows[rIdx];
      // Skip empty row
      if (!row || row.every(cell => String(cell).trim() === '')) continue;

      // Extract applicant name
      const nameCol = colMap['nama'] !== undefined ? colMap['nama'] : (colMap['pemohon'] !== undefined ? colMap['pemohon'] : 2);
      const rawName = row[nameCol] ? String(row[nameCol]).trim() : '';
      if (!rawName || rawName.toLowerCase().includes('total') || rawName.toLowerCase().includes('jumlah')) {
        continue; // skip summary/empty rows
      }

      // Extract NIK
      const nikCol = colMap['nik'] !== undefined ? colMap['nik'] : 3;
      const rawNik = row[nikCol];
      const nik = normalizeNik(rawNik);

      // Extract Date
      const dateCol = colMap['tanggal'] !== undefined ? colMap['tanggal'] : 1;
      const serviceDate = normalizeExcelDate(row[dateCol]);

      // Check duplicate
      const dupKey = `${matchedService.id}:${nik || rawName}:${serviceDate}`;
      if (existingNiks.has(dupKey)) {
        summary.skippedDuplicates++;
        sheetDetail.skipped++;
        continue;
      }
      existingNiks.add(dupKey);

      // Build data dictionary for this record matching service fields
      const recordData: Record<string, any> = {};
      matchedService.fields.forEach(field => {
        const fieldKey = field.id;
        const fieldLabelLower = field.label.toLowerCase();
        
        // Find matching column
        const matchingColIdx = headers.findIndex(h => 
          h.includes(fieldKey) || fieldLabelLower.includes(h) || (h && fieldLabelLower.startsWith(h.substring(0, 4)))
        );

        if (matchingColIdx !== -1 && row[matchingColIdx] !== undefined) {
          let cellVal = row[matchingColIdx];
          if (field.type === 'nik') {
            recordData[fieldKey] = normalizeNik(cellVal);
          } else if (field.type === 'date') {
            recordData[fieldKey] = normalizeExcelDate(cellVal);
          } else {
            recordData[fieldKey] = String(cellVal).trim();
          }
        }
      });

      // Ensure baseline fields
      recordData['nama_pemohon'] = rawName;
      if (nik) recordData['nik'] = nik;

      const regNo = `IMP-${matchedService.id.substring(0, 3).toUpperCase()}/${serviceDate.replace(/-/g, '')}/${String(sheetDetail.imported + 1).padStart(3, '0')}`;
      
      const newRecord: ServiceRecord = {
        id: `rec-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        serviceId: matchedService.id,
        registrationNumber: regNo,
        serviceDate,
        applicantName: rawName,
        nik: nik || '3322000000000000',
        data: recordData,
        notes: (colMap['keterangan'] !== undefined && row[colMap['keterangan']]) ? String(row[colMap['keterangan']]).trim() : 'Diimpor dari file Excel 2026',
        createdBy: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      summary.importedRecords.push(newRecord);
      summary.successfullyImported++;
      sheetDetail.imported++;
    }

    summary.details.push(sheetDetail);
  }

  return summary;
}

/**
 * Exports service records to Excel file (.xlsx)
 */
export function exportRecordsToExcel(
  service: ServiceConfig,
  records: ServiceRecord[],
  fileNamePrefix: string = 'LAPORAN_PELAYANAN'
) {
  const wb = XLSX.utils.book_new();

  // Prepare custom headers
  const headers = ['No', 'No. Registrasi', 'Tanggal Pelayanan', 'Nama Pemohon', 'NIK'];
  const customFields = service.fields.filter(f => 
    f.id !== 'nama_pemohon' && f.id !== 'nik' && f.id !== 'keterangan'
  );
  customFields.forEach(f => headers.push(f.label));
  headers.push('Keterangan', 'Petugas Input', 'Waktu Input');

  const rows: any[][] = [headers];

  records.forEach((r, idx) => {
    const row: any[] = [
      idx + 1,
      r.registrationNumber,
      r.serviceDate,
      r.applicantName,
      r.nik, // string format
    ];

    customFields.forEach(f => {
      const val = r.data && r.data[f.id] !== undefined ? r.data[f.id] : '';
      row.push(Array.isArray(val) ? val.join(', ') : val);
    });

    row.push(r.notes || (r.data && r.data.keterangan) || '');
    row.push(r.createdBy || 'Petugas');
    row.push(r.createdAt ? r.createdAt.substring(0, 10) : '');

    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));
  colWidths[0] = { wch: 6 }; // No
  colWidths[1] = { wch: 22 }; // No Reg
  colWidths[4] = { wch: 20 }; // NIK
  ws['!cols'] = colWidths;

  const safeSheetName = service.sheetName.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const finalFileName = `${fileNamePrefix}_${service.id.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}

/**
 * Exports multiple services to a single multi-sheet Excel file
 */
export function exportAllServicesToExcel(
  services: ServiceConfig[],
  records: ServiceRecord[],
  fileName: string = 'DATABASE_SIAP_BRINGIN_2026.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: RINGKASAN
  const summaryHeaders = ['No', 'ID Pelayanan', 'Nama Pelayanan', 'Nama Sheet', 'Status', 'Jumlah Berkas Dilayani'];
  const summaryRows: any[][] = [summaryHeaders];

  services.forEach((s, idx) => {
    const count = records.filter(r => r.serviceId === s.id).length;
    summaryRows.push([
      idx + 1,
      s.id,
      s.name,
      s.sheetName,
      s.isActive ? 'Aktif' : 'Nonaktif',
      count,
    ]);
  });
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 12 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'RINGKASAN_PELAYANAN');

  // Next Sheets: Each Service Sheet
  services.forEach(service => {
    const serviceRecords = records.filter(r => r.serviceId === service.id);
    const headers = ['No', 'No. Registrasi', 'Tanggal', 'Nama Pemohon', 'NIK'];
    const customFields = service.fields.filter(f => f.id !== 'nama_pemohon' && f.id !== 'nik' && f.id !== 'keterangan');
    customFields.forEach(f => headers.push(f.label));
    headers.push('Keterangan', 'Petugas');

    const rows: any[][] = [headers];
    serviceRecords.forEach((r, idx) => {
      const row: any[] = [
        idx + 1,
        r.registrationNumber,
        r.serviceDate,
        r.applicantName,
        r.nik,
      ];
      customFields.forEach(f => {
        const val = r.data && r.data[f.id] !== undefined ? r.data[f.id] : '';
        row.push(Array.isArray(val) ? val.join(', ') : val);
      });
      row.push(r.notes || (r.data && r.data.keterangan) || '');
      row.push(r.createdBy || 'Petugas');
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const safeName = service.name.substring(0, 30).replace(/[:\/\\?*\[\]]/g, '');
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  XLSX.writeFile(wb, fileName);
}

/**
 * Exports data to CSV string and initiates browser download
 */
export function exportToCsv(headers: string[], rows: (string | number)[][], fileName: string) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
