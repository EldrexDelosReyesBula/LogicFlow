
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check } from 'lucide-react';

// Fix for strict type checking on motion components
const MotionDiv = motion.div as any;

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        title: "Welcome to LogicFlow",
        desc: "A premium, academic-grade logic playground. Let's get you started.",
        target: "center"
    },
    {
        title: "Expression Input",
        desc: "Type propositional formulas here. Use the smart keyboard below for symbols like →, ↔, and ⊕.",
        target: "input"
    },
    {
        title: "Analysis Modes",
        desc: "Generate full Truth Tables, Karnaugh Maps, or use the new Step-by-Step logic engine.",
        target: "generate"
    },
    {
        title: "Offline History",
        desc: "All your work is saved locally on your device. Access past calculations anytime.",
        target: "history"
    }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <AnimatePresence>
            <MotionDiv 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center md:p-6"
            >
                <MotionDiv 
                    layout
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.3 }}
                    className="bg-white dark:bg-slate-800 p-8 md:p-6 rounded-none md:rounded-3xl shadow-2xl w-full h-full md:h-auto md:max-w-sm relative border-0 md:border md:border-white/20 flex flex-col justify-center md:block"
                >
                    <button 
                        onClick={onComplete}
                        className="absolute top-8 right-8 md:top-4 md:right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="mb-8 md:mb-6">
                        <div className="w-14 h-14 md:w-12 md:h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6 md:mb-4 text-primary-600 dark:text-primary-400 font-bold text-2xl md:text-xl">
                            {step + 1}
                        </div>
                        <h2 className="text-3xl md:text-xl font-display font-bold text-slate-900 dark:text-white mb-4 md:mb-2">
                            {STEPS[step].title}
                        </h2>
                        <p className="text-lg md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                            {STEPS[step].desc}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-2">
                            {STEPS.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`} 
                                />
                            ))}
                        </div>
                        <button 
                            onClick={handleNext}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30 text-lg md:text-base"
                        >
                            {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
                            {step === STEPS.length - 1 ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </MotionDiv>
            </MotionDiv>
        </AnimatePresence>
    );
};

export default Onboarding;
