import * as XLSX from "xlsx";

export const exportToExcel = (cleanedData, filename = "file.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(cleanedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
};
