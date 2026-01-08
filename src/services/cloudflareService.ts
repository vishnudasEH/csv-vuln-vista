import { apiService } from './apiService';
import { 
  CloudflareVulnerability, 
  CloudflareSummary, 
  CloudflareFilters,
  CloudflareRetestResult,
  CloudflareSeverity,
  CloudflareStatus 
} from '@/types/cloudflare';

/**
 * Cloudflare API Service
 * 
 * Handles all API interactions for the Cloudflare vulnerability module.
 * Base URL: http://10.23.123.40:6000
 * 
 * Backend returns Title Case fields, frontend uses snake_case.
 * This service handles the transformation.
 */

const CLOUDFLARE_BASE = '/api/cloudflare';

// Re-export types for convenience
export type { CloudflareVulnerability, CloudflareSummary, CloudflareFilters, CloudflareRetestResult };

export interface VulnerabilityUpdate {
  Domain: string;
  'Vulnerability Name': string;
  Status?: string;
  Notes?: string;
}

// Backend response interface (Title Case keys)
interface BackendVulnerability {
  'Domain': string;
  'Vulnerability Name': string;
  'Severity': string;
  'Status': string;
  'First Observed': string | number;
  'Last Observed': string | number;
  'Aging (Days)': number;
  'Business Owner': string | null;
  'Notes': string | null;
  'Description'?: string | null;
  'Curl Command'?: string | null;
}

interface BackendSummary {
  total_vulnerabilities: number;
  fixed_vulnerabilities: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info?: number;
    unknown?: number;
  };
}

// Transform backend response to frontend format
const transformVulnerability = (v: BackendVulnerability): CloudflareVulnerability => {
  // Normalize severity to proper case
  const normalizeSeverity = (sev: string): CloudflareSeverity => {
    const lower = (sev || 'unknown').toLowerCase();
    switch (lower) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  // Normalize status to proper case
  const normalizeStatus = (status: string): CloudflareStatus => {
    const lower = (status || 'open').toLowerCase();
    switch (lower) {
      case 'fixed': return 'Fixed';
      case 'open': return 'Open';
      case 'accepted risk': return 'Accepted Risk';
      case 'work in progress': return 'Work in Progress';
      default: return 'Open';
    }
  };

  return {
    domain: v['Domain'] || '',
    vulnerability_name: v['Vulnerability Name'] || '',
    severity: normalizeSeverity(v['Severity']),
    status: normalizeStatus(v['Status']),
    first_observed: v['First Observed'],
    last_observed: v['Last Observed'],
    aging_days: v['Aging (Days)'] || 0,
    business_owner: v['Business Owner'],
    notes: v['Notes'],
    description: v['Description'],
    curl_command: v['Curl Command'],
  };
};

// Transform summary response
const transformSummary = (s: BackendSummary): CloudflareSummary => ({
  total_vulnerabilities: s.total_vulnerabilities || 0,
  fixed_vulnerabilities: s.fixed_vulnerabilities || 0,
  severity_counts: {
    critical: s.by_severity?.critical || 0,
    high: s.by_severity?.high || 0,
    medium: s.by_severity?.medium || 0,
    low: s.by_severity?.low || 0,
  },
});

class CloudflareService {
  /**
   * Fetch vulnerabilities with optional filters
   * GET /api/cloudflare/vulnerabilities
   */
  async getVulnerabilities(filters?: CloudflareFilters): Promise<CloudflareVulnerability[]> {
    const params = new URLSearchParams();
    
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.owner) params.append('owner', filters.owner);
    
    const queryString = params.toString();
    const endpoint = `${CLOUDFLARE_BASE}/vulnerabilities${queryString ? `?${queryString}` : ''}`;
    
    const rawData = await apiService.get<BackendVulnerability[]>(endpoint);
    return rawData.map(transformVulnerability);
  }

  /**
   * Get summary statistics
   * GET /api/cloudflare/summary
   */
  async getSummary(): Promise<CloudflareSummary> {
    const rawData = await apiService.get<BackendSummary>(`${CLOUDFLARE_BASE}/summary`);
    return transformSummary(rawData);
  }

  /**
   * Update vulnerability status/notes
   * POST /api/cloudflare/update
   * 
   * @param updates - Array of updates to apply
   */
  async updateVulnerabilities(updates: VulnerabilityUpdate[]): Promise<{ status: string; message: string }> {
    return apiService.post<{ status: string; message: string }>(
      `${CLOUDFLARE_BASE}/update`,
      { updates }
    );
  }

  /**
   * Helper to update a single vulnerability
   */
  async updateSingleVulnerability(
    domain: string,
    vulnerabilityName: string,
    updates: { status?: string; notes?: string }
  ): Promise<{ status: string; message: string }> {
    const update: VulnerabilityUpdate = {
      Domain: domain,
      'Vulnerability Name': vulnerabilityName,
    };
    
    if (updates.status) update.Status = updates.status;
    if (updates.notes !== undefined) update.Notes = updates.notes;
    
    return this.updateVulnerabilities([update]);
  }

  /**
   * Retest a single vulnerability
   * POST /api/cloudflare/retest
   */
  async retestVulnerability(
    domain: string,
    vulnerabilityName: string
  ): Promise<CloudflareRetestResult> {
    try {
      const result = await apiService.post<{
        success: boolean;
        status: string;
        findingsCount: number;
      }>(`${CLOUDFLARE_BASE}/retest`, {
        domain,
        vulnerability_name: vulnerabilityName
      });
      
      return {
        domain,
        vulnerability_name: vulnerabilityName,
        success: true,
        status: result.status,
        findingsCount: result.findingsCount
      };
    } catch (error) {
      return {
        domain,
        vulnerability_name: vulnerabilityName,
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Bulk retest vulnerabilities
   */
  async bulkRetest(
    vulnerabilities: Array<{ domain: string; vulnerability_name: string }>
  ): Promise<CloudflareRetestResult[]> {
    const results: CloudflareRetestResult[] = [];
    
    for (const vuln of vulnerabilities) {
      const result = await this.retestVulnerability(vuln.domain, vuln.vulnerability_name);
      results.push(result);
    }
    
    return results;
  }
}

export const cloudflareService = new CloudflareService();
