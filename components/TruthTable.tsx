
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { TruthTableRow, TableColumn, AppSettings } from '../types';
import { Check } from 'lucide-react';

const MotionDiv = motion.div as any;

interface TruthTableProps {
  rows: TruthTableRow[];
  columns: TableColumn[];
  settings: AppSettings;
  onRowSelect?: (row: TruthTableRow) => void;
  onRowChange?: (row: TruthTableRow, changedCol: TableColumn) => void;
}

const TruthTable: React.FC<TruthTableProps> = ({ rows, columns, settings, onRowSelect, onRowChange }) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [focusedColId, setFocusedColId] = useState<string | null>(null);
  
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureText = (text: string, isHeader: boolean) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * 10;
    context.font = isHeader 
        ? 'bold 15px "Plus Jakarta Sans", sans-serif' 
        : '15px "JetBrains Mono", monospace';
    return context.measureText(text).width;
  };

  useEffect(() => {
    const newWidths: Record<string, number> = {};
    columns.forEach(col => {
        const headerWidth = measureText(col.label, true) + 48; 
        const cellWidth = measureText(settings.logic.truthValues === 'F/T' ? 'F' : '0', false) + 48;
        newWidths[col.id] = Math.max(headerWidth, cellWidth, col.isInput ? 64 : 100);
    });
    setColWidths(newWidths);
  }, [columns, settings.table.dense, settings.logic.truthValues]);

  const displayValue = (val: boolean) => {
      if (settings.logic.truthValues === 'F/T') return val ? 'T' : 'F';
      return val ? '1' : '0';
  };

  const startResize = (e: React.PointerEvent, colId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth = colWidths[colId] || 64;
      resizingRef.current = { id: colId, startX: e.clientX, startWidth: currentWidth };
      document.addEventListener('pointermove', handleResizeMove);
      document.addEventListener('pointerup', stopResize);
  };

  const handleResizeMove = (e: PointerEvent) => {
      if (!resizingRef.current) return;
      const { id, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      setColWidths(prev => ({ ...prev, [id]: Math.max(50, startWidth + diff) }));
  };

  const stopResize = () => {
      resizingRef.current = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', stopResize);
  };

  const handleTouchStart = (row: TruthTableRow) => {
    longPressTimer.current = setTimeout(() => {
        handleCopyRow(row);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleCopyRow = (row: TruthTableRow) => {
    const text = columns.map(c => displayValue(row.values[c.expression])).join('\t');
    navigator.clipboard.writeText(text).catch(() => {});
    if (navigator.vibrate) navigator.vibrate([10, 50]);
    setCopiedRowId(row.id);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  const handleRowClick = (row: TruthTableRow) => {
    if (selectedRowId === row.id) {
        setSelectedRowId(null);
    } else {
        setSelectedRowId(row.id);
        if (onRowSelect) onRowSelect(row);
    }
  };

  const toggleColFocus = (colId: string) => {
      setFocusedColId(prev => prev === colId ? null : colId);
  };

  const handleCellClick = (e: React.MouseEvent, row: TruthTableRow, col: TableColumn) => {
    if (onRowChange) {
        e.stopPropagation();
        const newValue = !row.values[col.expression];
        const newRow = { ...row, values: { ...row.values, [col.expression]: newValue } };
        onRowChange(newRow, col);
        if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const getOpacity = (col: TableColumn) => {
      if (!focusedColId) return 1;
      if (col.id === focusedColId) return 1;
      const focusedCol = columns.find(c => c.id === focusedColId);
      if (focusedCol && focusedCol.dependencyIds?.includes(col.astId || '')) return 1;
      return 0.3;
  };

  const inputCols = columns.filter(c => c.isInput);
  const lastInputColId = inputCols.length > 0 ? inputCols[inputCols.length - 1].id : null;

  return (
    <div className="w-full h-full flex flex-col bg-surface-100 dark:bg-dark-container overflow-hidden">
      <div className="flex-1 overflow-auto no-scrollbar pb-32 w-full">
        <div className="min-w-max inline-block align-middle">
           
           {/* Header */}
           <div className={clsx(
               "z-10 bg-surface-100/95 dark:bg-dark-container/95 backdrop-blur-md flex border-b border-surface-300 dark:border-white/5",
               settings.table.stickyHeaders ? "sticky top-0" : ""
           )}>
              {columns.map((col, i) => {
                  const width = colWidths[col.id] || (col.isInput ? 64 : 120);
                  const opacity = settings.table.highlightDependencies ? getOpacity(col) : 1;
                  const isLastInput = col.id === lastInputColId;

                  return (
                    <MotionDiv 
                        layout
                        key={col.id}
                        initial={false}
                        animate={{ width: width, opacity }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onClick={() => toggleColFocus(col.id)}
                        className={clsx(
                            "relative py-4 px-3 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer select-none group first:pl-6 last:pr-6",
                            col.isInput 
                                ? "bg-surface-200/50 dark:bg-white/5" 
                                : col.isOutput 
                                    ? "bg-primary-50/50 dark:bg-primary-900/10" 
                                    : ""
                        )}
                    >
                        {/* Divider for last input column */}
                        {isLastInput && (
                            <div className="absolute right-0 top-3 bottom-3 w-[2px] bg-gradient-to-b from-transparent via-primary-500/30 dark:via-primary-400/30 to-transparent z-10" />
                        )}

                        <div className="flex items-center gap-1.5">
                            <span className={clsx(
                                "text-base font-extrabold font-display truncate text-center",
                                col.isOutput ? "text-primary-700 dark:text-primary-300" : 
                                col.isInput ? "text-surface-800 dark:text-surface-200" : "text-surface-500 dark:text-surface-400"
                            )}>
                                {col.label}
                            </span>
                        </div>

                        <div 
                            onPointerDown={(e) => startResize(e, col.id)}
                            className="absolute right-0 top-0 bottom-0 w-6 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 hover:opacity-100"
                        >
                            <div className="w-1.5 h-6 rounded-full bg-surface-400/50 dark:bg-surface-500/50" />
                        </div>
                    </MotionDiv>
                  );
              })}
           </div>

           {/* Body */}
           <div className="divide-y divide-surface-200/80 dark:divide-white/5">
             {rows.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const isCopied = copiedRowId === row.id;
                const finalVal = row.values[columns[columns.length-1].expression];
                
                return (
                  <MotionDiv
                    layout
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5), ease: "easeOut" }}
                    onClick={() => handleRowClick(row)}
                    onTouchStart={() => handleTouchStart(row)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(row)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    className={clsx(
                      "flex transition-colors duration-200 select-none relative group touch-manipulation",
                      isSelected 
                        ? "bg-primary-100 dark:bg-primary-900/30" 
                        : finalVal 
                            ? "bg-surface-50 dark:bg-dark-containerHigh" 
                            : "bg-surface-100 dark:bg-dark-container"
                    )}
                  >
                    {columns.map((col, colIdx) => {
                        const val = row.values[col.expression];
                        const width = colWidths[col.id] || (col.isInput ? 64 : 120);
                        const opacity = settings.table.highlightDependencies ? getOpacity(col) : 1;
                        const isLastInput = col.id === lastInputColId;

                        return (
                            <MotionDiv 
                                layout
                                initial={false}
                                animate={{ width: width, opacity }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                key={col.id} 
                                onClick={(e: React.MouseEvent) => handleCellClick(e, row, col)}
                                className={clsx(
                                    "relative py-4 px-2 flex items-center justify-center flex-shrink-0 transition-opacity first:pl-6 last:pr-6",
                                    "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform origin-center"
                                )}
                            >
                                {isLastInput && (
                                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-surface-400/20 dark:via-white/10 to-transparent pointer-events-none" />
                                )}

                                <span className={clsx(
                                    "font-mono transition-all",
                                    col.isOutput ? "text-xl font-bold" : "text-lg",
                                    val 
                                      ? (col.isOutput ? "text-primary-700 dark:text-primary-300" : "text-surface-900 dark:text-white font-semibold") 
                                      : "text-surface-400 dark:text-surface-600"
                                )}>
                                    {col.isOutput && isCopied ? <Check className="w-6 h-6 text-green-600 scale-125" /> : displayValue(val)}
                                </span>
                            </MotionDiv>
                        );
                    })}
                  </MotionDiv>
                );
             })}
           </div>
        </div>
      </div>
      
      <AnimatePresence>
        {copiedRowId && (
            <MotionDiv 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-800 dark:bg-surface-100 text-white dark:text-surface-900 px-8 py-4 rounded-full text-base font-bold shadow-2xl pointer-events-none z-50 flex items-center gap-3"
            >
                <div className="bg-green-400 text-surface-900 rounded-full p-1">
                    <Check className="w-4 h-4 stroke-[4]" />
                </div>
                <span>Row Copied</span>
            </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TruthTable;
