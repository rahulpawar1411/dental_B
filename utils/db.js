import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const DATA_DIR = isVercel ? os.tmpdir() : path.join(__dirname, '..', 'data');

export const readData = async (filename) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If running on Vercel and file does not exist in tmp, copy original file from project root
    if (isVercel) {
      const originalPath = path.join(__dirname, '..', 'data', `${filename}.json`);
      try {
        const originalData = await fs.readFile(originalPath, 'utf-8');
        await fs.writeFile(filePath, originalData, 'utf-8');
        return JSON.parse(originalData);
      } catch (copyErr) {
        console.error(`Error copying data file to temp directory:`, copyErr);
      }
    }
    console.error(`Error reading database file ${filename}:`, error);
    return [];
  }
};

export const writeData = async (filename, data) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing to database file ${filename}:`, error);
    return false;
  }
};
