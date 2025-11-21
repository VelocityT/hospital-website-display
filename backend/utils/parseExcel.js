import xlsx from "xlsx";

export const parseExcel = (fileBuffer, fieldMap = null) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json(sheet, { defval: null });

  if (!fieldMap) return rawData;

  return rawData.map((row) => {
    const mappedRow = {};
    for (const [excelKey, dbKey] of Object.entries(fieldMap)) {
      mappedRow[dbKey] = row[excelKey];
    }
    return mappedRow;
  });
};
