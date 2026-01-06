
import React, { useState, useEffect } from 'react';
import { FileUp, ClipboardCheck, LayoutDashboard, Download, RotateCcw, ShieldCheck, AlertCircle, Loader2, Play, Settings, Key, X, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(localStorage.getItem('CUSTOM_GEMINI_KEY') || '');
  const [showKey, setShowKey] = useState(false);

  const handleUpload = (type: 'exam' | 'matrix', file: File) => {
    setError(null);
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const saveSettings = () => {
    localStorage.setItem('CUSTOM_GEMINI_KEY', tempApiKey);
    setIsSettingsOpen(false);
  };

  const startAnalysis = async () => {
    if (!files.exam) {
      setError("Vui lòng tải lên ít nhất một file Đề thi.");
      return;
    }
    
    setStatus(AuditStatus.ANALYZING);
    try {
      // Key thủ công lấy từ localStorage nếu có
      const manualKey = localStorage.getItem('CUSTOM_GEMINI_KEY') || undefined;
      const result = await generateAuditReport(files.exam, files.matrix, manualKey);
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
      const mathJax = (window as any).MathJax;
      if (mathJax && mathJax.typesetPromise) await mathJax.typesetPromise();
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `PhanBien_${auditResult?.subject || 'DeThi'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const html2pdf = (window as any).html2pdf;
      if (html2pdf) await html2pdf().set(opt).from(element).save();
    } catch (err) {
      alert('Lỗi xuất PDF. Vui lòng thử lại.');
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
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> CÀI ĐẶT HỆ THỐNG
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-3 h-3" /> Gemini API Key (Cá nhân)
                </label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 font-mono text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Dán API Key của bạn tại đây..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  * Key của bạn được lưu cục bộ trên trình duyệt. Nếu để trống, hệ thống sẽ sử dụng key mặc định của môi trường.
                </p>
              </div>

              <button 
                onClick={saveSettings}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> LƯU CẤU HÌNH
              </button>
            </div>
          </div>
        </div>
      )}

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
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2.5 rounded-xl transition-all border ${
                  localStorage.getItem('CUSTOM_GEMINI_KEY') 
                  ? 'bg-green-50 text-green-600 border-green-200' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Cài đặt API Key"
              >
                <Settings className="w-5 h-5" />
              </button>

              {status === AuditStatus.COMPLETED && (
                <>
                  <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                    <RotateCcw className="w-4 h-4" /> LÀM MỚI
                  </button>
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={isGeneratingPDF}
                    className="bg-slate-900 text-white px-7 py-3 rounded-2xl text-sm font-black shadow-2xl hover:bg-black transition-all flex items-center gap-2"
                  >
                    {isGeneratingPDF ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    TẢI PDF BÁO CÁO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className={`flex-1 w-full ${status === AuditStatus.COMPLETED ? 'p-0 sm:p-4 lg:p-8' : 'p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto'}`}>
        {status === AuditStatus.IDLE && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase border border-blue-100">
                AI Powered Audit Engine 2025
              </div>
              <h1 className="text-5xl font-black text-slate-900 sm:text-7xl tracking-tighter leading-none">
                Thẩm định Đề thi <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Tự động & Thông minh
                </span>
              </h1>
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
                className={`group flex items-center gap-3 px-12 py-5 rounded-3xl text-xl font-black transition-all shadow-2xl ${
                  files.exam 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-6 h-6 fill-current" />
                PHÂN TÍCH NGAY
              </button>
            </div>
          </div>
        )}

        {status === AuditStatus.ANALYZING && <ProcessingScreen />}
        {status === AuditStatus.COMPLETED && auditResult && <AuditDashboard data={auditResult} />}
      </main>
    </div>
  );
};

export default App;
