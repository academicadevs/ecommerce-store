import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions [{key: 'field', header: 'Display Name'}]
 * @returns {string} CSV string
 */
export function exportToCSV(data, columns) {
  const headers = columns.map(col => col.header);
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      // Format dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      // Format numbers with currency if specified
      if (col.format === 'currency' && typeof value === 'number') {
        return value.toFixed(2);
      }
      return value ?? '';
    })
  );

  return stringify([headers, ...rows]);
}

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions [{key: 'field', header: 'Display Name', width?, format?}]
 * @param {Object} options - Additional options {title, sheetName}
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function exportToExcel(data, columns, options = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Academica Reports';
  workbook.created = new Date();

  const sheetName = options.sheetName || 'Report';
  const worksheet = workbook.addWorksheet(sheetName);

  // Add title row if provided
  let startRow = 1;
  if (options.title) {
    worksheet.mergeCells(1, 1, 1, columns.length);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = options.title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    startRow = 3;
  }

  // Add date range if provided
  if (options.dateRange) {
    worksheet.mergeCells(startRow, 1, startRow, columns.length);
    const dateCell = worksheet.getCell(startRow, 1);
    dateCell.value = `Date Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}`;
    dateCell.font = { italic: true, size: 11 };
    dateCell.alignment = { horizontal: 'center' };
    startRow += 2;
  }

  // Set up columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15
  }));

  // Style header row
  const headerRow = worksheet.getRow(startRow);
  headerRow.values = columns.map(col => col.header);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C5282' } // Blue background
  };
  headerRow.alignment = { horizontal: 'center' };

  // Add data rows
  data.forEach((row, index) => {
    const dataRow = worksheet.getRow(startRow + 1 + index);
    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      let value = row[col.key];

      // Format based on column type
      if (col.format === 'currency' && typeof value === 'number') {
        cell.value = value;
        cell.numFmt = '$#,##0.00';
      } else if (col.format === 'date' && value) {
        cell.value = new Date(value);
        cell.numFmt = 'mm/dd/yyyy';
      } else if (col.format === 'percent' && typeof value === 'number') {
        cell.value = value / 100;
        cell.numFmt = '0.0%';
      } else {
        cell.value = value ?? '';
      }
    });

    // Alternate row colors
    if (index % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF7FAFC' } // Light gray
      };
    }
  });

  // Add borders to all cells
  const lastRow = startRow + data.length;
  for (let row = startRow; row <= lastRow; row++) {
    for (let col = 1; col <= columns.length; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
  }

  // Auto-fit columns (with max width)
  worksheet.columns.forEach(column => {
    let maxLength = column.header ? column.header.length : 10;
    column.eachCell({ includeEmpty: false }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  return await workbook.xlsx.writeBuffer();
}

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @param {Object} options - Additional options {title, dateRange, summary}
 * @returns {Promise<Buffer>} PDF file buffer
 */
export function exportToPDF(data, columns, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'LETTER',
        layout: data.length > 0 && columns.length > 5 ? 'landscape' : 'portrait'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(options.title || 'Report', { align: 'center' });
      doc.moveDown(0.5);

      // Date range
      if (options.dateRange) {
        doc.fontSize(10).font('Helvetica')
          .text(`Date Range: ${options.dateRange.startDate} to ${options.dateRange.endDate}`, { align: 'center' });
        doc.moveDown(0.5);
      }

      // Generated timestamp
      doc.fontSize(8).fillColor('#666')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.fillColor('#000');
      doc.moveDown(1);

      // Summary section if provided
      if (options.summary) {
        doc.fontSize(12).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.3);

        const summaryItems = Object.entries(options.summary);
        summaryItems.forEach(([key, value]) => {
          doc.fontSize(10).font('Helvetica')
            .text(`${key}: `, { continued: true })
            .font('Helvetica-Bold')
            .text(formatValue(value, key));
        });
        doc.moveDown(1);
      }

      // Table
      if (data.length > 0) {
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = pageWidth / columns.length;
        const startX = doc.page.margins.left;
        let currentY = doc.y;

        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        columns.forEach((col, i) => {
          doc.text(col.header, startX + (i * colWidth), currentY, {
            width: colWidth - 5,
            align: 'left'
          });
        });

        currentY += 20;
        doc.moveTo(startX, currentY).lineTo(startX + pageWidth, currentY).stroke();
        currentY += 5;

        // Table rows
        doc.font('Helvetica').fontSize(8);
        data.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = doc.page.margins.top;
          }

          const rowStartY = currentY;
          let maxRowHeight = 15;

          columns.forEach((col, colIndex) => {
            let value = row[col.key];

            // Format value
            if (col.format === 'currency' && typeof value === 'number') {
              value = `$${value.toFixed(2)}`;
            } else if (col.format === 'date' && value) {
              value = new Date(value).toLocaleDateString();
            } else if (col.format === 'percent' && typeof value === 'number') {
              value = `${value.toFixed(1)}%`;
            }

            const textHeight = doc.heightOfString(String(value ?? ''), {
              width: colWidth - 5
            });
            maxRowHeight = Math.max(maxRowHeight, textHeight + 5);

            doc.text(String(value ?? ''), startX + (colIndex * colWidth), rowStartY, {
              width: colWidth - 5,
              align: 'left'
            });
          });

          currentY = rowStartY + maxRowHeight;

          // Alternate row shading
          if (rowIndex % 2 === 1) {
            doc.rect(startX, rowStartY - 2, pageWidth, maxRowHeight)
              .fillColor('#f7fafc')
              .fill()
              .fillColor('#000');
          }
        });
      } else {
        doc.fontSize(10).text('No data available for the selected date range.', { align: 'center' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatValue(value, key) {
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('total') || key.toLowerCase().includes('aov')) {
      return `$${value.toFixed(2)}`;
    }
    if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  }
  return String(value);
}

export default {
  exportToCSV,
  exportToExcel,
  exportToPDF
};
