import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the sheet in the workbook
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export multiple sheets to Excel file
 * @param sheets Array of { name, data } objects
 * @param filename Name of the file (without extension)
 */
export const exportMultipleSheetsToExcel = <T extends Record<string, any>>(
  sheets: Array<{ name: string; data: T[] }>,
  filename: string
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Format currency for export
 */
export const formatCurrency = (amount: number, currency: string = 'RWF'): string => {
  return `${currency} ${amount.toLocaleString()}`;
};

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
