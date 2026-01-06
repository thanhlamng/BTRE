import React, { useState, useEffect } from 'react';
import { FileUp, ClipboardCheck, LayoutDashboard, Download, RotateCcw, ShieldCheck, AlertCircle, Loader2, Printer, Play } from 'lucide-react';
import { UploadSection } from './components/UploadSection';
import { ProcessingScreen } from './components/ProcessingScreen';
import { AuditDashboard } from './components/AuditDashboard';
import { AuditStatus, AuditData, FileState } from './types';
import { generateAuditReport } from './services/auditLogic';

const App: React.FC = () => {
  const [status, setStatus] = useState<AuditStatus>(AuditStatus.IDLE);
  const [files, setFiles] = useState<FileState>({ exam: null, matrix: null });
  const [auditResult, setAuditResult] = useState<AuditData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (type: 'exam' | 'matrix', file: File) => {
    setError(null);
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const startAnalysis = async () => {
    if (!files.exam) {
      setError("Vui lòng tải lên ít nhất một file Đề thi.");
      return;
    }
    
    setStatus(AuditStatus.ANALYZING);
    try {
      const result = await generateAuditReport(files.exam, files.matrix);
      setAuditResult(result);
      setStatus(AuditStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã có lỗi xảy ra trong quá trình phân tích.");
      setStatus(AuditStatus.IDLE);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('audit-report-a4');
    if (!element || isGeneratingPDF) return;

    try {
      setIsGeneratingPDF(true);
      
      // Ensure MathJax is fully rendered
      const mathJax = (window as any).MathJax;
      if (mathJax && mathJax.typesetPromise) {
        await mathJax.typesetPromise();
      }

      // Wait for font and layout stabilization
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `PhanBien_${auditResult?.subject || 'DeThi'}_${auditResult?.examCode || 'NoCode'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: document.documentElement.offsetWidth
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Call html2pdf library
      const html2pdf = (window as any).html2pdf;
      if (html2pdf) {
        await html2pdf().set(opt).from(element).save();
      } else {
        throw new Error("Thư viện html2pdf chưa được tải.");
      }
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      alert('Không thể tạo PDF. Vui lòng thử lại hoặc sử dụng tính năng In của hệ thống.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const reset = () => {
    setFiles({ exam: null, matrix: null });
    setAuditResult(null);
    setStatus(AuditStatus.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-2xl font-black text-slate-900 tracking-tight">AutoAudit</span>
                <span className="text-blue-600 font-bold ml-1 text-lg">PRO</span>
              </div>
            </div>
            
            {status === AuditStatus.COMPLETED && (
              <div className="flex items-center gap-4">
                <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                  <RotateCcw className="w-4 h-4" /> LÀM MỚI
                </button>
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isGeneratingPDF}
                  className={`group flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-black shadow-2xl transition-all ${
                    isGeneratingPDF 
                    ? 'bg-slate-400 cursor-not-allowed text-white' 
                    : 'bg-slate-900 text-white hover:bg-black hover:-translate-y-1'
                  }`}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      ĐANG TẠO PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      TẢI PDF BÁO CÁO
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className={`flex-1 w-full ${status === AuditStatus.COMPLETED ? 'p-0 sm:p-4 lg:p-8 max-w-full' : 'p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto'}`}>
        {status === AuditStatus.IDLE && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase border border-blue-100 shadow-sm">
                Smarter Audit Engine 2025
              </div>
              <h1 className="text-5xl font-black text-slate-900 sm:text-7xl tracking-tighter leading-none">
                Thẩm định Đề thi <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Tự động & Thông minh
                </span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                Tải lên đề thi để AI tự động rà soát lỗi và xây dựng ma trận gợi ý theo chuẩn GDPT 2018.
              </p>
            </div>

            <UploadSection onUpload={handleUpload} files={files} />

            <div className="flex flex-col items-center gap-4 py-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-bold text-sm">{error}</p>
                </div>
              )}
              
              <button
                disabled={!files.exam}
                onClick={startAnalysis}
                className={`group flex items-center gap-3 px-10 py-5 rounded-3xl text-xl font-black transition-all shadow-2xl ${
                  files.exam 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play className={`w-6 h-6 ${files.exam ? 'fill-current' : ''}`} />
                {files.matrix ? 'PHÂN TÍCH VỚI MA TRẬN' : 'PHÂN TÍCH ĐỀ & TẠO MA TRẬN'}
              </button>
            </div>
          </div>
        )}

        {status === AuditStatus.ANALYZING && <ProcessingScreen />}
        {status === AuditStatus.COMPLETED && auditResult && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <AuditDashboard data={auditResult} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm font-bold tracking-wide">
          <div>&copy; 2026 ThanhLamNg - Smart Audit AI</div>
        </div>
      </footer>
    </div>
  );
};

export default App;