import Papa from 'papaparse';
import { Vulnerability } from '@/types/vulnerability';
import { apiService } from './apiService';

export class CSVService {
  static async loadVulnerabilities(): Promise<Vulnerability[]> {
    try {
      // Use apiService which automatically adds JWT token
      const data = await apiService.get<any[]>('/vulnerabilities');
      
      // Transform and validate data
      return data.map((vuln: any, index: number) => ({
        id: vuln.id || `${vuln.name}-${vuln.host}-${index}`, // Generate ID if not present
        name: vuln.name || '',
        description: vuln.description || '',
        host: vuln.host || '',
        owner: vuln.owner || '',
        port: vuln.port || '',
        severity: vuln.severity || 'Low',
        status: vuln.status || 'Open',
        assigned_to: vuln.assigned_to || '',
        comments: vuln.comments || '',
        timestamp: vuln.timestamp || '',
        days_overdue: Number(vuln.days_overdue) || 0,
      })).filter(v => v.name && v.host);
    } catch (error) {
      throw new Error(`Failed to load vulnerabilities: ${error}`);
    }
  }

  static async updateVulnerabilities(updates: Array<{name: string, host: string} & Partial<Vulnerability>>): Promise<void> {
    try {
      // Use apiService which automatically adds JWT token
      const result = await apiService.post<{ success: boolean }>('/update', { updates });
      
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

  static async retestVulnerability(name: string, host: string): Promise<{
    success: boolean;
    status: string;
    findingsCount: number;
    updatedRows: number;
    template?: string;
    debug?: any;
  }> {
    try {
      // Use apiService which automatically adds JWT token
      return await apiService.post('/retest', { name, host });
    } catch (error) {
      throw new Error(`Failed to retest vulnerability: ${error}`);
    }
  }

  static async bulkRetest(vulnerabilities: Array<{name: string, host: string}>): Promise<Array<{
    name: string;
    host: string;
    success: boolean;
    status?: string;
    findingsCount?: number;
    error?: string;
  }>> {
    const results = [];
    for (const vuln of vulnerabilities) {
      try {
        const result = await this.retestVulnerability(vuln.name, vuln.host);
        results.push({
          name: vuln.name,
          host: vuln.host,
          success: true,
          status: result.status,
          findingsCount: result.findingsCount
        });
      } catch (error) {
        results.push({
          name: vuln.name,
          host: vuln.host,
          success: false,
          error: String(error)
        });
      }
    }
    return results;
  }
}
