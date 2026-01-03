import { apiService } from './apiService';

/**
 * Cloudflare API Service
 * 
 * Handles all API interactions for the Cloudflare vulnerability module.
 * Base URL: http://10.23.123.40:6000
 * 
 * Endpoints:
 * - GET /api/cloudflare/vulnerabilities - Fetch vulnerabilities with filters
 * - POST /api/cloudflare/update - Update vulnerability status/notes
 * - GET /api/cloudflare/summary - Get summary statistics
 */

const CLOUDFLARE_BASE = '/api/cloudflare';

// Types for Cloudflare vulnerabilities
export interface CloudflareVulnerability {
  domain: string;
  vulnerability_name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Fixed' | 'Accepted Risk';
  first_observed: string;
  last_observed: string;
  aging_days: number;
  business_owner: string;
  notes: string;
}

export interface CloudflareSummary {
  total_vulnerabilities: number;
  fixed_vulnerabilities: number;
  severity_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface CloudflareFilters {
  domain?: string;
  severity?: string;
  status?: string;
  owner?: string;
  search?: string;
}

export interface VulnerabilityUpdate {
  Domain: string;
  'Vulnerability Name': string;
  Status?: string;
  Notes?: string;
}

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
    
    return apiService.get<CloudflareVulnerability[]>(endpoint);
  }

  /**
   * Get summary statistics
   * GET /api/cloudflare/summary
   */
  async getSummary(): Promise<CloudflareSummary> {
    return apiService.get<CloudflareSummary>(`${CLOUDFLARE_BASE}/summary`);
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
}

export const cloudflareService = new CloudflareService();
