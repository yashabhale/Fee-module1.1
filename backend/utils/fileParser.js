import XLSX from 'xlsx';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

export const parseExcelFile = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return { success: true, data };
  } catch (error) {
    logger.error(`Error parsing Excel file: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve({ success: true, data: results }))
      .on('error', (error) => {
        logger.error(`Error parsing CSV file: ${error.message}`);
        reject({ success: false, error: error.message });
      });
  });
};

export const validateBulkUploadData = (data, requiredFields) => {
  const errors = [];
  const validRecords = [];

  data.forEach((record, index) => {
    const recordErrors = [];

    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        recordErrors.push(`${field} is required`);
      }
    });

    if (recordErrors.length > 0) {
      errors.push({
        row: index + 2,
        errors: recordErrors
      });
    } else {
      validRecords.push({ ...record, _rowIndex: index + 2 });
    }
  });

  return {
    valid: validRecords,
    invalid: errors,
    totalRecords: data.length,
    validCount: validRecords.length,
    invalidCount: errors.length
  };
};

export const cleanUploadFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
  }
};
