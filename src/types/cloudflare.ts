/**
 * Cloudflare Module Types
 * 
 * Type definitions for the Cloudflare vulnerability management module.
 */

export type CloudflareSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type CloudflareStatus = 'Open' | 'Fixed' | 'Accepted Risk';

export interface CloudflareVulnerability {
  domain: string;
  vulnerability_name: string;
  severity: CloudflareSeverity;
  status: CloudflareStatus;
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
