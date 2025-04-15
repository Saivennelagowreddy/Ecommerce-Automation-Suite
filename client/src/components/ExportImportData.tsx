import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type DataType = "inventory" | "clients" | "orders";

interface ExportImportDataProps {
  dataType: DataType;
  data: any[];
  onImport?: (data: any[]) => void;
}

export default function ExportImportData({ dataType, data, onImport }: ExportImportDataProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data to Export",
        description: `There are no ${dataType} to export.`,
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    let csvContent = "";
    
    // Get headers from the first item
    const headers = Object.keys(data[0]).filter(key => 
      // Filter out complex objects that don't make sense in CSV
      typeof data[0][key] !== 'object' || data[0][key] === null
    );
    
    // Add headers
    csvContent += headers.join(",") + "\\n";
    
    // Add rows
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        
        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes in strings and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        } else if (value instanceof Date) {
          return value.toISOString();
        } else {
          return String(value);
        }
      });
      
      csvContent += row.join(",") + "\\n";
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${data.length} ${dataType} have been exported to CSV.`,
      variant: "default",
    });
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await importFile.text();
      const rows = text.split('\\n');
      
      // Extract headers
      const headers = rows[0].split(',').map(header => header.trim());
      
      // Parse the data rows
      const importedData = rows.slice(1)
        .filter(row => row.trim() !== '') // Skip empty rows
        .map(row => {
          const values = parseCSVRow(row);
          const item: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            if (index < values.length) {
              item[header] = values[index];
            }
          });
          
          return item;
        });
      
      if (onImport && importedData.length > 0) {
        onImport(importedData);
        
        toast({
          title: "Import Successful",
          description: `${importedData.length} ${dataType} have been imported.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No valid data found in the imported file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to process the import file.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  // Helper function to parse CSV rows correctly handling quoted values
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        // Check for escaped quotes (double quotes)
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    
    return result;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{dataType} Data Management</CardTitle>
        <CardDescription>Export or import {dataType} data in CSV format</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="text-sm text-neutral-500">
              <p>Export your {dataType} data as a CSV file that can be opened in Excel or other spreadsheet software.</p>
              <p className="mt-2">The export will include {data?.length || 0} {dataType}.</p>
            </div>
            
            <Button onClick={handleExport} disabled={!data || data.length === 0}>
              <span className="material-icons mr-2 text-sm">download</span>
              Export {dataType.charAt(0).toUpperCase() + dataType.slice(1)} to CSV
            </Button>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="text-sm text-neutral-500">
              <p>Import {dataType} data from a CSV file. The file should have the same column headers as the exported file.</p>
              <p className="mt-2 text-yellow-600">
                <span className="material-icons text-sm align-text-bottom mr-1">warning</span>
                <span>Importing data can cause duplicates if the same records already exist.</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="importFile">Select CSV File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
            
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">upload</span>
                  Import {dataType.charAt(0).toUpperCase() + dataType.slice(1)} from CSV
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}