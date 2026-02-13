
import React from 'react';
import { clsx } from 'clsx';
import { KMapData, KMapGroup } from '../types';
import { motion } from 'framer-motion';

// Fix for strict type checking on motion components
const MotionDiv = motion.div as any;

interface KMapProps {
  data: KMapData;
  expression: string;
}

const KarnaughMap: React.FC<KMapProps> = ({ data, expression }) => {
  if (!data) return null;

  const { grid, rowLabels, colLabels, variables, groups, minimizedExpression } = data;
  const numRows = grid.length;
  const numCols = grid[0].length;
  
  const displayRowVar = variables.length === 2 ? variables[0] : variables.length === 3 ? variables[0] : variables.slice(0, 2).join('');
  const displayColVar = variables.length === 2 ? variables[1] : variables.length === 3 ? variables.slice(1).join('') : variables.slice(2).join('');

  return (
    <div className="p-6 flex flex-col items-center w-full min-h-[60vh]">
      <div className="w-full max-w-md">
        
        {/* K-Map Layout */}
        <div className="relative mt-12 ml-12 mb-8 select-none">
            {/* Variables Label - Rotated Style */}
            <div className="absolute -top-12 -left-12 w-24 h-24 flex items-center justify-center">
                 <div className="relative w-full h-full">
                    <div className="absolute top-2 right-0 text-xs font-bold text-slate-900 dark:text-white tracking-widest">{displayColVar}</div>
                    <div className="absolute bottom-2 left-0 text-xs font-bold text-slate-900 dark:text-white tracking-widest">{displayRowVar}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1px] bg-slate-300 dark:bg-white/10 -rotate-45 transform origin-center"></div>
                 </div>
            </div>

            {/* Column Headers */}
            <div className="flex ml-[1px]">
                {colLabels.map((label, i) => (
                    <div key={i} className="flex-1 min-w-[4rem] text-center text-sm font-mono font-bold text-slate-500 dark:text-slate-400 pb-2">
                        {label}
                    </div>
                ))}
            </div>

            <div className="flex relative">
                {/* Row Headers */}
                <div className="flex flex-col mr-2 w-10">
                    {rowLabels.map((label, i) => (
                        <div key={i} className="flex-1 min-h-[4rem] flex items-center justify-end text-sm font-mono font-bold text-slate-500 dark:text-slate-400 pr-2">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid Container */}
                <div className="relative shadow-2xl rounded-2xl overflow-hidden">
                    <div 
                        className="grid gap-[1px] bg-slate-200 dark:bg-slate-700/50 border border-slate-200 dark:border-white/5 relative z-0"
                        style={{ 
                            gridTemplateColumns: `repeat(${numCols}, 4rem)`,
                            gridTemplateRows: `repeat(${numRows}, 4rem)`
                        }}
                    >
                        {grid.map((row, rIdx) => (
                            row.map((cell, cIdx) => (
                                <MotionDiv
                                    key={`${rIdx}-${cIdx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (rIdx * numCols + cIdx) * 0.02 }}
                                    className={clsx(
                                        "bg-white dark:bg-[#1a1c24] flex items-center justify-center font-mono text-2xl font-bold relative group transition-colors",
                                        cell.value ? "text-slate-900 dark:text-white" : "text-slate-200 dark:text-slate-700"
                                    )}
                                >
                                    {cell.value ? '1' : '0'}
                                    <div className="absolute top-1 right-1 text-[0.6rem] font-sans text-slate-300 dark:text-slate-600 opacity-50">
                                        {cell.mintermIndex}
                                    </div>
                                </MotionDiv>
                            ))
                        ))}
                    </div>

                    {/* Groups Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none w-full h-full">
                         {groups.map((group, gIdx) => (
                             <React.Fragment key={gIdx}>
                                 {group.cells.map((cell, cIdx) => (
                                     <MotionDiv
                                        key={`g-${gIdx}-c-${cIdx}`}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 + gIdx * 0.1 }}
                                        className={clsx(
                                            "absolute rounded-xl border-[3px]",
                                            group.color
                                        )}
                                        style={{
                                            // 4rem is 64px + gap 1px = 65px
                                            top: `calc(${cell.r} * (4rem + 1px))`,
                                            left: `calc(${cell.c} * (4rem + 1px))`,
                                            width: '4rem',
                                            height: '4rem'
                                        }}
                                     />
                                 ))}
                             </React.Fragment>
                         ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Legend / Results */}
        <div className="w-full space-y-3">
             <div className="bg-surface-50 dark:bg-white/5 p-5 rounded-2xl border border-surface-200 dark:border-white/5">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Minimized Expression</h4>
                <div className="font-mono text-xl font-medium text-primary-600 dark:text-primary-300 break-words">
                    {minimizedExpression || "0"}
                </div>
            </div>
            
            {groups.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {groups.map((g, i) => (
                        <div key={i} className={clsx("px-3 py-1.5 rounded-lg text-xs font-mono font-bold border flex items-center gap-2", g.color.replace('bg-', 'text-').replace('/20',''))}>
                            <div className={clsx("w-2 h-2 rounded-full", g.color.replace('/20', ''))}></div>
                            {g.term}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default KarnaughMap;
