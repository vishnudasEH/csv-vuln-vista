import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { CloudflareVulnerability } from '@/services/cloudflareService';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface CloudflareExportDialogProps {
  vulnerabilities: CloudflareVulnerability[];
  selectedVulnerabilities?: CloudflareVulnerability[];
  title?: string;
}

export const CloudflareExportDialog = ({ 
  vulnerabilities, 
  selectedVulnerabilities,
  title = 'cloudflare-vulnerabilities' 
}: CloudflareExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'filtered'>('filtered');
  const [includeFields, setIncludeFields] = useState({
    domain: true,
    vulnerability_name: true,
    severity: true,
    status: true,
    first_observed: true,
    last_observed: true,
    aging_days: true,
    business_owner: true,
    notes: true,
  });

  const fieldLabels: Record<string, string> = {
    domain: 'Domain',
    vulnerability_name: 'Vulnerability Name',
    severity: 'Severity',
    status: 'Status',
    first_observed: 'First Observed',
    last_observed: 'Last Observed',
    aging_days: 'Aging (Days)',
    business_owner: 'Business Owner',
    notes: 'Notes',
  };

  const getExportData = () => {
    let data = vulnerabilities;
    if (exportScope === 'selected' && selectedVulnerabilities && selectedVulnerabilities.length > 0) {
      data = selectedVulnerabilities;
    }
    return data;
  };

  const handleExport = () => {
    const fieldsToExport = Object.entries(includeFields)
      .filter(([, include]) => include)
      .map(([field]) => field);

    const dataToExport = getExportData();
    
    const filteredData = dataToExport.map(vuln => {
      const filtered: Record<string, any> = {};
      fieldsToExport.forEach(field => {
        filtered[fieldLabels[field]] = vuln[field as keyof CloudflareVulnerability];
      });
      return filtered;
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

    if (exportFormat === 'csv') {
      exportToCsv(filteredData, `${filename}.csv`);
    } else {
      exportToExcel(filteredData, `${filename}.xlsx`);
    }

    setOpen(false);
  };

  const exportToCsv = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToExcel = (data: Record<string, any>[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vulnerabilities');
    XLSX.writeFile(workbook, filename);
  };

  const toggleField = (field: string) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const selectAll = () => {
    setIncludeFields(prev => {
      const allSelected = Object.values(prev).every(v => v);
      return Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: !allSelected
      }), {} as typeof prev);
    });
  };

  const selectedCount = Object.values(includeFields).filter(Boolean).length;
  const exportDataCount = exportScope === 'selected' && selectedVulnerabilities 
    ? selectedVulnerabilities.length 
    : vulnerabilities.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Cloudflare Vulnerabilities</DialogTitle>
          <DialogDescription>
            Customize your export format and fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scope Selection */}
          {selectedVulnerabilities && selectedVulnerabilities.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Scope</label>
              <Select value={exportScope} onValueChange={(value) => setExportScope(value as 'all' | 'selected' | 'filtered')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">Filtered Data ({vulnerabilities.length} items)</SelectItem>
                  <SelectItem value="selected">Selected Only ({selectedVulnerabilities.length} items)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'excel')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV File</span>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Excel File</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include Fields</label>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedCount === Object.keys(includeFields).length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fieldLabels).map(([field, label]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={includeFields[field as keyof typeof includeFields]}
                    onCheckedChange={() => toggleField(field)}
                  />
                  <label
                    htmlFor={field}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedCount} fields selected</Badge>
              <Badge variant="outline">{exportDataCount} records</Badge>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedCount === 0 || exportDataCount === 0}
              className="min-w-[100px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
