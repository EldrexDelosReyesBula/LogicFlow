
import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useDragControls, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

const MotionDiv = motion.div as any;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  const DRAG_THRESHOLD = 150;

  useEffect(() => {
    if (isOpen) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [isOpen, controls]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 300) {
      onClose();
    } else {
      controls.start('visible');
    }
  };

  const variants = {
    hidden: { 
        y: '100%', 
        opacity: 0, 
        transition: { type: "spring", damping: 40, stiffness: 400 } 
    },
    visible: { 
        y: 0, 
        opacity: 1, 
        transition: { type: "spring", damping: 40, stiffness: 400 } 
    },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
            <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-900/10 dark:bg-black/60 backdrop-blur-sm z-40"
            />
        )}
      </AnimatePresence>

      <MotionDiv
        drag="y"
        dragControls={dragControls}
        dragListener={false} 
        dragConstraints={{ top: 0 }}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        initial="hidden"
        animate={controls}
        variants={variants}
        style={{ y }}
        className="fixed bottom-0 left-0 right-0 h-[92vh] bg-surface-50 dark:bg-dark-surface z-50 rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-t border-white/50 dark:border-white/5"
      >
        <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="w-full pt-6 pb-4 flex flex-col items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none bg-surface-50 dark:bg-dark-surface"
        >
          <div className="w-12 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full mb-6" />
          
          <div className="w-full px-8 flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-surface-900 dark:text-white tracking-tight">{title}</h2>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2.5 bg-surface-200 dark:bg-dark-containerHigh rounded-full hover:bg-surface-300 transition-colors"
            >
                <X className="w-6 h-6 text-surface-600 dark:text-surface-300" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-surface-50 dark:bg-dark-surface relative">
          {children}
        </div>
      </MotionDiv>
    </>
  );
};

export default BottomSheet;
