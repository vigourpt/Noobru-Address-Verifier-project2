import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { verifyAddressBatch } from '../lib/openai';
import { sendToSlackChannel } from '../lib/slack';

const CSVVerifier: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const constructFullAddress = (row: any): string | null => {
    const addressParts = [
      row['Ship To - Address 1'],
      row['Ship To - Address 2'],
      row['Ship To - Address 3'],
      row['Ship To - City'],
      row['Ship To - State'],
      row['Ship To - Postal Code'],
      row['Ship To - Country']
    ].filter(Boolean);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      handleProcess(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleProcess = async (csvFile: File) => {
    setIsProcessing(true);
    setError(null);
    setStatus('Processing addresses...');
    
    try {
      const results = await new Promise<Papa.ParseResult<any>>((resolve) => {
        Papa.parse(csvFile, {
          header: true,
          complete: resolve,
          skipEmptyLines: true
        });
      });

      const processedRows = await Promise.all(results.data.map(async (row: any) => {
        const originalAddress = constructFullAddress(row);
        
        if (!originalAddress) {
          return {
            ...row,
            'Original Address': '',
            'Verified Address': '',
            'verified Ship To - Address 1': '',
            'verified Ship To - Address 2': '',
            'verified Ship To - Address 3': '',
            'verified Ship To - City': '',
            'verified Ship To - State': '',
            'verified Ship To - Zone': '',
            'verified Ship To - Postal Code': '',
            'verified Ship To - Country': ''
          };
        }

        const verifiedAddresses = await verifyAddressBatch([originalAddress]);
        const verifiedAddress = verifiedAddresses[0];
        
        return {
          // Original fields
          'Ship To - Name': row['Ship To - Name'] || '',
          'Ship To - Company': row['Ship To - Company'] || '',
          'Ship To - Address 1': row['Ship To - Address 1'] || '',
          'Ship To - Address 2': row['Ship To - Address 2'] || '',
          'Ship To - Address 3': row['Ship To - Address 3'] || '',
          'Ship To - City': row['Ship To - City'] || '',
          'Ship To - State': row['Ship To - State'] || '',
          'Ship To - Zone': row['Ship To - Zone'] || '',
          'Ship To - Postal Code': row['Ship To - Postal Code'] || '',
          'Ship To - Country': row['Ship To - Country'] || '',
          'Order - Number': row['Order - Number'] || '',
          'Customer Email': row['Customer Email'] || '',
          
          // Full addresses
          'Original Address': originalAddress,
          'Verified Address': verifiedAddress.fullAddress,
          
          // Verified fields
          'verified Ship To - Name': row['Ship To - Name'] || '',
          'verified Ship To - Company': row['Ship To - Company'] || '',
          'verified Ship To - Address 1': verifiedAddress.address1,
          'verified Ship To - Address 2': verifiedAddress.address2,
          'verified Ship To - Address 3': verifiedAddress.address3,
          'verified Ship To - City': verifiedAddress.city,
          'verified Ship To - State': verifiedAddress.state,
          'verified Ship To - Zone': verifiedAddress.zone || row['Ship To - Zone'] || '',
          'verified Ship To - Postal Code': verifiedAddress.postalCode,
          'verified Ship To - Country': verifiedAddress.country
        };
      }));

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedRows);

      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EDF2F7" } }
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Verified Addresses');

      const excelBuffer = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        compression: true
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Download file locally
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'verified_addresses.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setStatus('File downloaded successfully. Sending to Slack...');

      // Send to Slack channel
      try {
        await sendToSlackChannel(blob, 'verified_addresses.xlsx');
        setStatus(prev => `${prev}\nFile sent to Slack channel successfully`);
      } catch (error) {
        console.error('Failed to send to Slack:', error);
        setStatus(prev => `${prev}\nFailed to send to Slack: ${error.message}`);
      }

      setStatus(prev => `${prev}\nProcessing complete!`);
      
    } catch (err) {
      setError('Failed to process addresses. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drop your ShipStation CSV file here, or click to select
        </p>
        <p className="mt-1 text-sm text-gray-500">
          The file will be processed and saved as Excel format
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-sm whitespace-pre-line">
          {status}
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Processing addresses...</p>
        </div>
      )}
    </div>
  );
};

export default CSVVerifier;