import Papa from 'papaparse';
import { Vulnerability } from '@/types/vulnerability';

const API_BASE_URL = 'http://localhost:5000/api';

export class CSVService {
  static async loadVulnerabilities(): Promise<Vulnerability[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/vulnerabilities`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Transform and validate data
      return data.map((vuln: any, index: number) => ({
        id: vuln.id || `${vuln.name}-${vuln.host}-${index}`, // Generate ID if not present
        name: vuln.name || '',
        description: vuln.description || '',
        host: vuln.host || '',
        port: vuln.port || '',
        severity: vuln.severity || 'Low',
        status: vuln.status || 'Open',
        assigned_to: vuln.assigned_to || '',
        comments: vuln.comments || '',
        timestamp: vuln.timestamp || '',
        days_overdue: parseInt(vuln.days_overdue) || 0,
      })).filter(v => v.name && v.host);
    } catch (error) {
      throw new Error(`Failed to load vulnerabilities: ${error}`);
    }
  }

  static async updateVulnerabilities(updates: Array<{name: string, host: string} & Partial<Vulnerability>>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('Update failed');
      }
    } catch (error) {
      throw new Error(`Failed to update vulnerabilities: ${error}`);
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