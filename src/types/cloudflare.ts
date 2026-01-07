/**
 * Cloudflare Module Types
 * 
 * Type definitions for the Cloudflare vulnerability management module.
 */

export type CloudflareSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';
export type CloudflareStatus = 'Open' | 'Fixed' | 'Accepted Risk' | 'Work in Progress';

export interface CloudflareVulnerability {
  domain: string;
  vulnerability_name: string;
  severity: CloudflareSeverity;
  status: CloudflareStatus;
  first_observed: string | number;
  last_observed: string | number;
  aging_days: number;
  business_owner: string | null;
  notes: string | null;
  description?: string | null;
  curl_command?: string | null;
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

export interface CloudflareRetestResult {
  domain: string;
  vulnerability_name: string;
  success: boolean;
  status?: string;
  findingsCount?: number;
  error?: string;
}

export interface CloudflareWeeklyTrend {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  total: number;
  open: number;
  fixed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CloudflareMonthlyTrend {
  month: string;
  monthStart: Date;
  total: number;
  open: number;
  fixed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
