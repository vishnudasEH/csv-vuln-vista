import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { CSVService } from '@/services/csvService';
import { Vulnerability } from '@/types/vulnerability';
import { format } from 'date-fns';

interface ExportDialogProps {
  vulnerabilities: Vulnerability[];
  title?: string;
}

export const ExportDialog = ({ vulnerabilities, title = 'vulnerabilities' }: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [includeFields, setIncludeFields] = useState({
    name: true,
    description: true,
    host: true,
    port: true,
    severity: true,
    status: true,
    assigned_to: true,
    comments: true,
    timestamp: true,
    days_overdue: true
  });

  const fieldLabels = {
    name: 'Vulnerability Name',
    description: 'Description',
    host: 'Host',
    port: 'Port',
    severity: 'Severity',
    status: 'Status',
    assigned_to: 'Assigned To',
    comments: 'Comments',
    timestamp: 'Timestamp',
    days_overdue: 'Days Overdue'
  };

  const handleExport = () => {
    const fieldsToExport = Object.entries(includeFields)
      .filter(([, include]) => include)
      .map(([field]) => field);

    const filteredData = vulnerabilities.map(vuln => {
      const filtered: any = {};
      fieldsToExport.forEach(field => {
        filtered[field] = vuln[field as keyof Vulnerability];
      });
      return filtered;
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

    if (exportFormat === 'csv') {
      CSVService.exportToCsv(filteredData, `${filename}.csv`);
    } else {
      CSVService.exportToExcel(filteredData, `${filename}.xlsx`);
    }

    setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export ({vulnerabilities.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Vulnerabilities</DialogTitle>
          <DialogDescription>
            Customize your export format and fields. Exporting {vulnerabilities.length} vulnerabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedCount} fields selected</Badge>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedCount === 0}
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