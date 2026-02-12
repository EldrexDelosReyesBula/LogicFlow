import { TruthTableRow, TableColumn, Classification } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatValue = (val: boolean, type: '0/1' | 'F/T'): string => {
  if (type === 'F/T') return val ? 'T' : 'F';
  return val ? '1' : '0';
};

const getTableData = (rows: TruthTableRow[], columns: TableColumn[], valType: '0/1' | 'F/T') => {
  const header = columns.map(c => c.label);
  const data = rows.map(r => columns.map(c => formatValue(r.values[c.expression], valType)));
  return { header, data };
};

export const exportToCSV = (rows: TruthTableRow[], columns: TableColumn[], valType: '0/1' | 'F/T') => {
  const { header, data } = getTableData(rows, columns, valType);
  const csvContent = [
    header.join(','),
    ...data.map(row => row.join(','))
  ].join('\n');
  
  navigator.clipboard.writeText(csvContent);
};

export const exportToMarkdown = (rows: TruthTableRow[], columns: TableColumn[], valType: '0/1' | 'F/T') => {
  const { header, data } = getTableData(rows, columns, valType);
  const separator = header.map(() => '---');
  const mdContent = [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...data.map(row => `| ${row.join(' | ')} |`)
  ].join('\n');

  navigator.clipboard.writeText(mdContent);
};

export const exportToLaTeX = (rows: TruthTableRow[], columns: TableColumn[], valType: '0/1' | 'F/T') => {
  const { header, data } = getTableData(rows, columns, valType);
  const cols = 'c'.repeat(header.length);
  const latexContent = [
    `\\begin{tabular}{|${cols.split('').join('|')}|}`,
    '\\hline',
    header.join(' & ') + ' \\\\',
    '\\hline',
    ...data.map(row => row.join(' & ') + ' \\\\'),
    '\\hline',
    '\\end{tabular}'
  ].join('\n');

  navigator.clipboard.writeText(latexContent);
};

export const exportToExcel = (rows: TruthTableRow[], columns: TableColumn[], valType: '0/1' | 'F/T') => {
  const { header, data } = getTableData(rows, columns, valType);
  const wsData = [header, ...data];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Truth Table");
  XLSX.writeFile(wb, "logicflow-export.xlsx");
};

export const exportToPDF = (rows: TruthTableRow[], columns: TableColumn[], expression: string, classification: Classification, valType: '0/1' | 'F/T') => {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Primary color
  doc.text("LogicFlow Analysis Report", 14, 20);
  
  // Metadata
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Expression: ${expression}`, 14, 30);
  doc.text(`Classification: ${classification}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 46);

  // Table
  const { header, data } = getTableData(rows, columns, valType);
  
  autoTable(doc, {
    startY: 55,
    head: [header],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  doc.save("logicflow-report.pdf");
};
