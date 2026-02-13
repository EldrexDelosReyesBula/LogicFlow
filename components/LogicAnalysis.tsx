
import React from 'react';
import { clsx } from 'clsx';
import { AnalysisResult, AppSettings } from '../types';
import { motion } from 'framer-motion';
import { Info, ArrowRightLeft, ShieldCheck, AlertTriangle, CheckCircle2, Zap, Download, FileSpreadsheet, FileText, ArrowDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MotionDiv = motion.div as any;

interface LogicAnalysisProps {
  analysis: AnalysisResult;
  settings?: AppSettings;
}

const LogicAnalysis: React.FC<LogicAnalysisProps> = ({ analysis, settings }) => {
  const { classification, implicationForms, mainConnective, rightAway, complexity, simplificationSteps } = analysis;

  const getBadgeColor = (c: string) => {
    if (c === 'Tautology') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-none';
    if (c === 'Contradiction') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-none';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-none';
  };

  const getIcon = (c: string) => {
    if (c === 'Tautology') return <ShieldCheck className="w-6 h-6" />;
    if (c === 'Contradiction') return <AlertTriangle className="w-6 h-6" />;
    return <Info className="w-6 h-6" />;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const columns = analysis.columns.map(c => c.label);
    const rows = analysis.rows.map(r => analysis.columns.map(c => r.values[c.expression] ? 'T' : 'F')); // Academic T/F preferred for PDF

    doc.setFontSize(20);
    doc.text("LogicFlow Analysis", 14, 20);
    doc.setFontSize(12);
    doc.text(`Expression: ${analysis.ast.expression}`, 14, 30);
    doc.text(`Classification: ${analysis.classification}`, 14, 38);

    (doc as any).autoTable({
        startY: 45,
        head: [columns],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [103, 80, 164], textColor: 255 }
    });
    doc.save(`logicflow_${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const data = analysis.rows.map(r => {
        const rowData: Record<string, number> = {};
        analysis.columns.forEach(c => {
            rowData[c.label] = r.values[c.expression] ? 1 : 0;
        });
        return rowData;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Truth Table");
    XLSX.writeFile(wb, `logicflow_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-6 pb-20 max-w-2xl mx-auto w-full flex flex-col gap-6">
      
      {/* Classification Card */}
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
            "p-6 rounded-[2rem] flex items-start gap-5 shadow-sm",
            getBadgeColor(classification)
        )}
      >
        <div className="mt-1 p-2 bg-white/20 rounded-full">{getIcon(classification)}</div>
        <div>
            <h3 className="font-display font-extrabold text-2xl mb-2">{classification}</h3>
            <p className="text-base opacity-90 leading-relaxed font-medium">
                {classification === 'Tautology' && "Always true. Valid in every interpretation."}
                {classification === 'Contradiction' && "Always false. A logical absurdity."}
                {classification === 'Contingency' && `Depends on the input values.`}
            </p>
        </div>
      </MotionDiv>

      {/* Complexity Metrics */}
      <div className="grid grid-cols-3 gap-3">
           <div className="bg-surface-200 dark:bg-dark-containerHigh p-5 rounded-3xl text-center">
               <div className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">Operators</div>
               <div className="text-2xl font-mono font-bold text-surface-900 dark:text-white">{complexity.operators}</div>
           </div>
           <div className="bg-surface-200 dark:bg-dark-containerHigh p-5 rounded-3xl text-center">
               <div className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">Depth</div>
               <div className="text-2xl font-mono font-bold text-surface-900 dark:text-white">{complexity.depth}</div>
           </div>
           <div className="bg-surface-200 dark:bg-dark-containerHigh p-5 rounded-3xl text-center">
               <div className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-2">Rows</div>
               <div className="text-2xl font-mono font-bold text-surface-900 dark:text-white">{complexity.totalRows}</div>
           </div>
      </div>

      {/* Simplification Steps (New in V5) */}
      {simplificationSteps && simplificationSteps.length > 0 && (
           <MotionDiv 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-surface-100 dark:bg-dark-containerHigh p-6 rounded-[2rem] border border-surface-200 dark:border-white/5"
           >
               <h4 className="text-sm font-bold text-surface-500 mb-4 ml-2 uppercase tracking-widest flex items-center gap-2">
                   <Zap className="w-4 h-4" /> Algebraic Simplification
               </h4>
               <div className="space-y-4">
                   {simplificationSteps.map((step, idx) => (
                       <div key={idx} className="flex items-start gap-4">
                           <div className="flex flex-col items-center">
                               <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                               {idx !== simplificationSteps.length - 1 && <div className="w-px h-8 bg-surface-300 dark:bg-surface-700 mt-1" />}
                           </div>
                           <div className="flex-1 bg-white dark:bg-dark-container p-4 rounded-2xl shadow-sm">
                               <div className="font-mono text-lg font-medium text-surface-900 dark:text-white mb-1">
                                   {step.expression}
                               </div>
                               <div className="text-xs font-bold text-primary-600 dark:text-primary-300 uppercase tracking-wider">
                                   {step.rule}
                               </div>
                           </div>
                       </div>
                   ))}
                   <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-surface-500">Simplified Form</span>
                   </div>
               </div>
           </MotionDiv>
      )}

      {/* RightAway (RW) Result */}
      {rightAway?.isApplicable && (
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-100 dark:bg-primary-900/30 p-6 rounded-[2rem] relative overflow-hidden"
          >
              <div className="absolute -top-4 -right-4 p-3 opacity-10 rotate-12">
                  <Zap className="w-32 h-32 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary-200 dark:bg-primary-800 p-1.5 rounded-full">
                      <Zap className="w-4 h-4 text-primary-800 dark:text-primary-200" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-200">Simplified</span>
              </div>
              <div className="text-2xl font-extrabold text-primary-900 dark:text-primary-100 mb-2">
                  Equivalent to {rightAway.resultValue !== undefined ? (rightAway.resultValue ? 'TRUE' : 'FALSE') : rightAway.variable}
              </div>
              <p className="text-primary-800 dark:text-primary-200/80 font-medium">
                  {rightAway.explanation}
              </p>
          </MotionDiv>
      )}

      {/* Implication Forms */}
      {mainConnective === 'IMPLIES' && implicationForms && (
        <MotionDiv 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <h4 className="text-sm font-bold text-surface-500 mb-4 ml-2 uppercase tracking-widest">Conditional Forms</h4>
            
            <div className="grid gap-3">
                <div className="bg-white dark:bg-dark-containerHigh p-5 rounded-3xl border border-surface-200 dark:border-white/5 shadow-sm">
                    <span className="text-xs font-bold text-surface-400 block mb-1">CONVERSE (Q → P)</span>
                    <div className="font-mono text-lg text-surface-900 dark:text-surface-100">{implicationForms.converse}</div>
                </div>
                <div className="bg-white dark:bg-dark-containerHigh p-5 rounded-3xl border border-surface-200 dark:border-white/5 shadow-sm">
                    <span className="text-xs font-bold text-surface-400 block mb-1">INVERSE (¬P → ¬Q)</span>
                    <div className="font-mono text-lg text-surface-900 dark:text-surface-100">{implicationForms.inverse}</div>
                </div>
                <div className="bg-white dark:bg-dark-containerHigh p-5 rounded-3xl border-2 border-primary-100 dark:border-primary-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <CheckCircle2 className="w-16 h-16" />
                    </div>
                    <span className="text-xs font-bold text-primary-600 block mb-1">CONTRAPOSITIVE (¬Q → ¬P)</span>
                    <div className="font-mono text-lg font-bold text-surface-900 dark:text-white">{implicationForms.contrapositive}</div>
                </div>
            </div>
        </MotionDiv>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
           <button 
                onClick={handleExportPDF}
                className="py-4 bg-surface-200 dark:bg-dark-containerHigh rounded-2xl font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors flex items-center justify-center gap-2"
           >
               <FileText className="w-5 h-5" /> Export PDF
           </button>
           <button 
                onClick={handleExportExcel}
                className="py-4 bg-surface-200 dark:bg-dark-containerHigh rounded-2xl font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-700 transition-colors flex items-center justify-center gap-2"
           >
               <FileSpreadsheet className="w-5 h-5" /> Export Excel
           </button>
      </div>

    </div>
  );
};

export default LogicAnalysis;
