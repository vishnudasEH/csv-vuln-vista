import Papa from 'papaparse';
import { Vulnerability } from '@/types/vulnerability';

export class CSVService {
  static async loadVulnerabilities(csvPath: string): Promise<Vulnerability[]> {
    try {
      const response = await fetch(csvPath);
      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transform: (value, field) => {
            // Convert days_overdue to number
            if (field === 'days_overdue') {
              return parseInt(value) || 0;
            }
            return value?.trim() || '';
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            
            const vulnerabilities = results.data as Vulnerability[];
            resolve(vulnerabilities.filter(v => v.name && v.host)); // Filter out invalid rows
          },
          error: (error) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to load CSV: ${error}`);
    }
  }

  static exportToCsv(vulnerabilities: Vulnerability[], filename: string = 'vulnerabilities.csv') {
    const csv = Papa.unparse(vulnerabilities);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static exportToExcel(vulnerabilities: Vulnerability[], filename: string = 'vulnerabilities.xlsx') {
    import('xlsx').then((XLSX) => {
      const worksheet = XLSX.utils.json_to_sheet(vulnerabilities);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vulnerabilities');
      XLSX.writeFile(workbook, filename);
    });
  }
}