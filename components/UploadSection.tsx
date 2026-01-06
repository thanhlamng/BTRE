
import React from 'react';
import { FileUp, FileText, CheckCircle2, TableProperties } from 'lucide-react';
import { FileState } from '../types';

interface UploadSectionProps {
  onUpload: (type: 'exam' | 'matrix', file: File) => void;
  files: FileState;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onUpload, files }) => {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Zone 1: Exam */}
      <div className="group relative">
        <div className={`h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300 ${
          files.exam ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 bg-white shadow-xl hover:shadow-blue-100'
        }`}>
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files?.[0] && onUpload('exam', e.target.files[0])}
            accept=".docx,.pdf"
          />
          {files.exam ? (
            <div className="text-center space-y-4 animate-in zoom-in duration-300">
              <div className="bg-green-100 p-4 rounded-2xl inline-block">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Đề thi đã sẵn sàng</h3>
                <p className="text-green-600 font-medium truncate max-w-[200px] mx-auto">{files.exam.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl inline-block group-hover:bg-blue-100 transition-colors">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Tải lên Đề thi</h3>
                <p className="text-slate-500">Kéo thả hoặc chọn file .docx, .pdf</p>
              </div>
              <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full inline-block font-black uppercase tracking-wider">
                Bắt buộc
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Matrix */}
      <div className="group relative">
        <div className={`h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300 ${
          files.matrix ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-500 bg-white shadow-xl hover:shadow-blue-100'
        }`}>
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files?.[0] && onUpload('matrix', e.target.files[0])}
            accept=".docx,.xlsx,.xls"
          />
          {files.matrix ? (
            <div className="text-center space-y-4 animate-in zoom-in duration-300">
              <div className="bg-green-100 p-4 rounded-2xl inline-block">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ma trận đã sẵn sàng</h3>
                <p className="text-green-600 font-medium truncate max-w-[200px] mx-auto">{files.matrix.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl inline-block group-hover:bg-slate-100 transition-colors">
                <TableProperties className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ma trận / Đặc tả</h3>
                <p className="text-slate-500">Kéo thả hoặc chọn file .docx, .xlsx</p>
              </div>
              <div className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full inline-block font-black uppercase tracking-wider">
                Tùy chọn (Optional)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
