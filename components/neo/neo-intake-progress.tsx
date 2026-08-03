"use client";

interface NeoIntakeProgressProps {
  score: number;
  filesAssigned: number;
  onProceed: () => void;
}

export function NeoIntakeProgress({ score, filesAssigned, onProceed }: NeoIntakeProgressProps) {
  const ready = score >= 3;
  const progressPercent = Math.min((score / 3) * 100, 100);

  return (
    <div className="shrink-0 px-4 py-3 border-t border-orech-line bg-orech-paper">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-orech-mist font-mono uppercase tracking-widest">Case Preparation</span>
        <span className="text-[10px] text-orech-mist/80">{score} / 3 Context Points</span>
      </div>
      <div className="h-1.5 w-full bg-orech-slate rounded-full overflow-hidden mb-3">
         <div 
           className="h-full bg-orech-bronze transition-all duration-500 ease-out" 
           style={{ width: `${progressPercent}%` }} 
         />
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <span className="text-orech-mist/90 text-[10px]">{filesAssigned} Evidence File(s)</span>
        {ready ? (
           <button 
             onClick={onProceed} 
             className="bg-orech-bronze text-[#121212] px-4 py-1.5 rounded-lg hover:bg-orech-bronzeMuted transition shadow-sm font-semibold uppercase tracking-wide text-[10px]"
           >
             Summarize & Submit Intake
           </button>
        ) : (
           <span className="text-orech-mist/40 italic text-[10px]">Provide more details to submit...</span>
        )}
      </div>
    </div>
  );
}
