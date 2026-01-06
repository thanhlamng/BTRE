
import React, { useState, useEffect } from 'react';
import { Loader2, Search, FileScan, CheckCircle, DatabaseZap } from 'lucide-react';

export const ProcessingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: DatabaseZap, text: "Đang tối ưu hóa dữ liệu & nén nội dung..." },
    { icon: Search, text: "Đang quét tất cả 28+ đơn vị câu hỏi..." },
    { icon: FileScan, text: "Đang đối chiếu mức độ với ma trận đặc tả..." },
    { icon: Loader2, text: "Đang biên soạn phản biện chuyên môn..." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 max-w-xl mx-auto">
      <div className="relative">
        <div className="w-32 h-32 border-4 border-blue-100 rounded-full flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           <DatabaseZap className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Đang thẩm định chuyên sâu</h2>
          <p className="text-slate-500 text-sm">Quá trình này có thể mất 30-60 giây tùy vào độ dài của đề thi.</p>
        </div>
        
        <div className="space-y-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                isActive ? 'bg-blue-50 scale-105 border border-blue-200' : 'bg-white opacity-40'
              } ${isCompleted ? 'opacity-80' : ''}`}>
                <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-slate-100'}`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 animate-bounce' : 'text-slate-400'}`} />
                  )}
                </div>
                <span className={`font-medium ${isActive ? 'text-blue-900' : 'text-slate-600'}`}>{s.text}</span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
