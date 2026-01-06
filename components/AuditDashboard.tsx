
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, FileText, BookOpen, Fingerprint, LayoutDashboard, Edit3, Save, Eye, MousePointer2, User } from 'lucide-react';
import { AuditData } from '../types';
import { ReportA4 } from './ReportA4';

interface AuditDashboardProps {
  data: AuditData;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ data: initialData }) => {
  const [data, setData] = useState<AuditData>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  const chartData = [
    { name: 'Nhận biết', value: data.stats.actual.nb, color: '#3b82f6' },
    { name: 'Thông hiểu', value: data.stats.actual.th, color: '#10b981' },
    { name: 'Vận dụng', value: data.stats.actual.vd, color: '#f59e0b' },
    { name: 'Vận dụng cao', value: data.stats.actual.vdc, color: '#ef4444' },
  ];

  const handleUpdate = (path: string, value: any) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start max-w-[1600px] mx-auto">
      {/* Left Sidebar - Stats & Errors */}
      <div className="lg:col-span-4 space-y-6 print:hidden">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Tổng quan phân tích
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Môn học</p>
                <p className="font-bold text-slate-900">{data.subject}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mã đề</p>
                <p className="font-bold text-slate-900">{data.examCode}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <label className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1 mb-2">
                <User className="w-3 h-3" /> Người phản biện
              </label>
              <input 
                type="text"
                placeholder="Nhập họ và tên..."
                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={data.auditorName}
                onChange={(e) => handleUpdate('auditorName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
               <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Số câu</p>
                <p className="font-bold text-slate-900">{data.totalQuestions}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mã báo cáo</p>
                <p className="font-bold text-slate-900 truncate">{data.reportId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            Ma trận thực tế (%)
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Phát hiện quan trọng
          </h3>
          <div className="space-y-3">
            {data.warnings.map((w, i) => (
              <div key={i} className={`p-4 rounded-xl border flex gap-3 text-sm font-semibold ${
                w.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                {w.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                {w.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main A4 Area */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Floating Controls for the A4 */}
        <div className="sticky top-24 z-40 mb-6 flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-200 shadow-xl print:hidden">
          <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-200">
            <div className={`w-3 h-3 rounded-full ${isEditing ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {isEditing ? 'Chế độ chỉnh sửa' : 'Chế độ xem trước'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
              isEditing 
              ? 'bg-green-600 text-white shadow-green-200' 
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
            }`}
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'HOÀN TẤT & LƯU' : 'CHỈNH SỬA BIÊN BẢN'}
          </button>

          {!isEditing && (
            <div className="text-[10px] text-slate-400 font-bold max-w-[150px] leading-tight flex items-center gap-2">
              <MousePointer2 className="w-3 h-3 text-blue-500" />
              Click nút để sửa nội dung trực tiếp
            </div>
          )}
        </div>

        {/* The Document */}
        <div className={`relative transition-all duration-700 ${
          isEditing ? 'ring-[16px] ring-blue-50 rounded-lg shadow-2xl scale-[1.01]' : 'shadow-lg hover:shadow-2xl'
        }`}>
           <ReportA4 data={data} onUpdate={handleUpdate} isEditing={isEditing} />
        </div>
      </div>
    </div>
  );
};
