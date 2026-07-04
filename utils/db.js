import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

export const readData = async (filename) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
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
