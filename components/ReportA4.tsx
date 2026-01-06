import React, { useEffect, useRef } from 'react';
import { AuditData, DetailedReviewItem } from '../types';

interface ReportA4Props {
  data: AuditData;
  onUpdate?: (path: string, value: any) => void;
  isEditing?: boolean;
}

export const ReportA4: React.FC<ReportA4Props> = ({ data, onUpdate, isEditing }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshMath = () => {
    if (isEditing) return;
    const win = window as any;
    if (win.MathJax && win.MathJax.typesetPromise) {
      win.MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
        console.warn('MathJax typeset failed:', err);
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(refreshMath, 200);
    return () => clearTimeout(timer);
  }, [data, isEditing]);

  const renderEditable = (path: string, value: any, className: string = "") => (
    <span
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onBlur={(e) => onUpdate?.(path, e.currentTarget.innerText)}
      className={`${className} ${
        isEditing ? 'bg-yellow-50 ring-1 ring-blue-300 px-1 rounded cursor-text' : ''
      }`}
    >
      {value}
    </span>
  );

  const renderTableRows = (items: DetailedReviewItem[] | undefined, partKey: string) => {
    if (!items || items.length === 0) return (
      <tr>
        <td colSpan={4} className="text-center italic text-[11pt] py-4">
          (Không ghi nhận lỗi sai ở phần này)
        </td>
      </tr>
    );

    return items.map((item, idx) => (
      <tr key={`${partKey}-${idx}`}>
        <td className="text-center font-bold text-[11pt]">{item.questionNo.replace('Câu ', '')}</td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.questionReview`, e.currentTarget.innerText)}
          className="text-[11pt]"
        >{item.questionReview}</td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.observation`, e.currentTarget.innerText)}
          className="text-[11pt] text-justify leading-relaxed"
        >{item.observation}</td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.suggestion`, e.currentTarget.innerText)}
          className="text-[11pt] italic leading-relaxed"
        >{item.suggestion}</td>
      </tr>
    ));
  };

  return (
    <div 
      id="audit-report-a4" 
      ref={containerRef}
      className={`a4-container bg-white font-report text-black mx-auto ${isEditing ? '' : 'preview-shadow'}`}
      style={{ fontSize: '13pt' }}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="text-center font-bold text-[11pt] leading-tight">
          <p className="uppercase">SỞ GD&ĐT ...........................</p>
          <p className="uppercase">TRƯỜNG THPT ......................</p>
          <div className="w-24 h-[0.7pt] bg-black mx-auto mt-2"></div>
        </div>
        <div className="text-center font-bold text-[11pt] leading-tight">
          <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="normal-case">Độc lập - Tự do - Hạnh phúc</p>
          <div className="w-40 h-[0.7pt] bg-black mx-auto mt-2"></div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[16pt] font-bold uppercase tracking-tight">BIÊN BẢN PHẢN BIỆN ĐỀ THI</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-x-12 text-[13pt] italic">
          <p>Môn: <b>{renderEditable('subject', data.subject)}</b></p>
          <p>Khối: <b>{renderEditable('grade', data.grade)}</b></p>
          <p>Học kỳ: <b>{renderEditable('semester', data.semester)}</b></p>
          <p>Mã đề: <b>{renderEditable('examCode', data.examCode)}</b></p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[14pt] uppercase tracking-wide">I. THỐNG KÊ TỶ LỆ CÂU HỎI</h2>
          {data.isAIGeneratedMatrix && (
            <span className="text-[9pt] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold italic">
              * Ma trận gợi ý bởi AI
            </span>
          )}
        </div>
        <table className="mb-4">
          <thead>
            <tr className="font-bold text-center bg-gray-50">
              <th className="w-[35%]">{data.isAIGeneratedMatrix ? "Cấu trúc gợi ý (AI)" : "Ma trận gốc"}</th>
              <th>NB</th>
              <th>TH</th>
              <th>VD</th>
              <th>VDC</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody className="text-center">
            <tr>
              <td className="text-left font-bold px-3 italic text-blue-800">
                {data.isAIGeneratedMatrix ? "Chuẩn đề xuất" : "Ma trận dự kiến"}
              </td>
              <td>{data.stats.matrix.nb}</td>
              <td>{data.stats.matrix.th}</td>
              <td>{data.stats.matrix.vd}</td>
              <td>{data.stats.matrix.vdc}</td>
              <td className="font-bold">
                {data.stats.matrix.nb + data.stats.matrix.th + data.stats.matrix.vd + data.stats.matrix.vdc}
              </td>
            </tr>
            <tr>
              <td className="text-left font-bold px-3">Đề thi thực tế</td>
              <td>{data.stats.actual.nb}</td>
              <td>{data.stats.actual.th}</td>
              <td>{data.stats.actual.vd}</td>
              <td>{data.stats.actual.vdc}</td>
              <td className="font-bold">{data.totalQuestions}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[12pt] italic leading-relaxed">
          <b>Nhận xét tỷ lệ:</b> {renderEditable('overview.matrixAlignment', data.overview.matrixAlignment)}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-[14pt] mb-4 uppercase tracking-wide">II. ĐÁNH GIÁ CHUYÊN MÔN TỔNG QUAN</h2>
        <div className="space-y-3 ml-2">
          <p><span className="font-bold">1. Tính khoa học & Logic:</span> {renderEditable('overview.scientific', data.overview.scientific)}</p>
          <p><span className="font-bold">2. Tính sư phạm & Ngôn từ:</span> {renderEditable('overview.pedagogical', data.overview.pedagogical)}</p>
          <p><span className="font-bold">3. Độ chính xác kiến thức:</span> {renderEditable('overview.accuracy', data.overview.accuracy)}</p>
          {data.overview.improvementSuggestions && (
            <div className="mt-4 p-3 bg-blue-50/50 border-l-4 border-blue-600 rounded-r-lg">
              <p className="font-bold text-blue-900 mb-1">Gợi ý nâng cao chuẩn đề thi:</p>
              <div className="italic text-[12pt]">{renderEditable('overview.improvementSuggestions', data.overview.improvementSuggestions)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="font-bold text-[14pt] mb-6 uppercase tracking-wide">III. CHI TIẾT PHẢN BIỆN LỖI SAI</h2>
        <div className="mb-6">
          <p className="font-bold mb-2 italic underline text-[11pt]">Phần I: Câu hỏi trắc nghiệm nhiều lựa chọn</p>
          <table className="table-fixed">
            <thead>
              <tr className="font-bold text-center bg-gray-50">
                <th className="w-[10%]">Câu</th>
                <th className="w-[25%] text-left">Nội dung</th>
                <th className="w-[35%] text-left">Lỗi sai</th>
                <th className="w-[30%] text-left">Góp ý</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part1, 'part1')}</tbody>
          </table>
        </div>

        <div className="mb-6">
          <p className="font-bold mb-2 italic underline text-[11pt]">Phần II: Câu hỏi trắc nghiệm Đúng/Sai</p>
          <table className="table-fixed">
            <thead>
              <tr className="font-bold text-center bg-gray-50">
                <th className="w-[10%]">Câu</th>
                <th className="w-[25%] text-left">Nội dung</th>
                <th className="w-[35%] text-left">Lỗi sai</th>
                <th className="w-[30%] text-left">Góp ý</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part2, 'part2')}</tbody>
          </table>
        </div>

        <div>
          <p className="font-bold mb-2 italic underline text-[11pt]">Phần III: Câu hỏi trả lời ngắn</p>
          <table className="table-fixed">
            <thead>
              <tr className="font-bold text-center bg-gray-50">
                <th className="w-[10%]">Câu</th>
                <th className="w-[25%] text-left">Nội dung</th>
                <th className="w-[35%] text-left">Lỗi sai</th>
                <th className="w-[30%] text-left">Góp ý</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part3, 'part3')}</tbody>
          </table>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-10 text-center">
        <div className="flex flex-col items-center">
          <p className="font-bold uppercase mb-20 text-[11pt]">Người ra đề</p>
          <p className="italic text-[10pt]">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="italic mb-2 text-[11pt]">Ngày {data.auditDate}</p>
          <p className="font-bold uppercase mb-20 text-[11pt]">Người phản biện</p>
          <div className="border-b border-black/40 px-6 min-w-[200px] font-bold text-[12pt]">
            {renderEditable('auditorName', data.auditorName || '(Ký tên)')}
          </div>
        </div>
      </div>
    </div>
  );
};