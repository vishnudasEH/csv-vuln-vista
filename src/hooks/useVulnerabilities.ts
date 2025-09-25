import { useState, useEffect, useMemo } from 'react';
import { Vulnerability, FilterOptions, HostGroup } from '@/types/vulnerability';
import { CSVService } from '@/services/csvService';
import { isWithinInterval, parseISO } from 'date-fns';

export const useVulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    severity: [],
    status: [],
    assigned_to: [],
    host: [],
    dateRange: {},
    searchTerm: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CSVService.loadVulnerabilities();
      setVulnerabilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vulnerabilities');
      console.error('Error loading vulnerabilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter((vuln) => {
      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(vuln.severity)) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(vuln.status)) {
        return false;
      }

      // Assigned to filter
      if (filters.assigned_to.length > 0 && !filters.assigned_to.includes(vuln.assigned_to)) {
        return false;
      }

      // Host filter
      if (filters.host.length > 0 && !filters.host.includes(vuln.host)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        try {
          const vulnDate = parseISO(vuln.timestamp);
          if (filters.dateRange.start && filters.dateRange.end) {
            if (!isWithinInterval(vulnDate, {
              start: filters.dateRange.start,
              end: filters.dateRange.end,
            })) {
              return false;
            }
          } else if (filters.dateRange.start && vulnDate < filters.dateRange.start) {
            return false;
          } else if (filters.dateRange.end && vulnDate > filters.dateRange.end) {
            return false;
          }
        } catch {
          // Skip invalid dates
          return false;
        }
      }

      // Search term filter (searches across all text fields)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchableFields = [
          vuln.name,
          vuln.description,
          vuln.host,
          vuln.port,
          vuln.severity,
          vuln.status,
          vuln.assigned_to,
          vuln.comments,
        ];
        
        if (!searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm)
        )) {
          return false;
        }
      }

      return true;
    });
  }, [vulnerabilities, filters]);

  const hostGroups = useMemo((): HostGroup[] => {
    const grouped = filteredVulnerabilities.reduce((acc, vuln) => {
      if (!acc[vuln.host]) {
        acc[vuln.host] = [];
      }
      acc[vuln.host].push(vuln);
      return acc;
    }, {} as Record<string, Vulnerability[]>);

    return Object.entries(grouped).map(([host, vulns]) => {
      const severityCounts = vulns.reduce((counts, vuln) => {
        const severity = vuln.severity.toLowerCase();
        if (severity === 'critical') counts.criticalCount++;
        else if (severity === 'high') counts.highCount++;
        else if (severity === 'medium') counts.mediumCount++;
        else if (severity === 'low') counts.lowCount++;
        return counts;
      }, { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 });

      return {
        host,
        vulnerabilities: vulns,
        count: vulns.length,
        ...severityCounts,
      };
    }).sort((a, b) => {
      // Sort by criticality: Critical > High > Medium > Low, then by count
      const aPriority = a.criticalCount * 1000 + a.highCount * 100 + a.mediumCount * 10 + a.lowCount;
      const bPriority = b.criticalCount * 1000 + b.highCount * 100 + b.mediumCount * 10 + b.lowCount;
      return bPriority - aPriority;
    });
  }, [filteredVulnerabilities]);

  const updateVulnerabilities = async (updates: Array<{id: string} & Partial<Vulnerability>>) => {
    try {
      await CSVService.updateVulnerabilities(updates);
      // Reload data after successful update
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vulnerabilities');
      throw err;
    }
  };

  return {
    vulnerabilities,
    filteredVulnerabilities,
    hostGroups,
    filters,
    setFilters,
    loading,
    error,
    updateVulnerabilities,
    refresh: loadData,
  };
};