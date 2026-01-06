
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
        <td colSpan={5} className="text-center italic text-[10pt] py-4">
          (Không ghi nhận lỗi sai hoặc phản biện cho phần này)
        </td>
      </tr>
    );

    return items.map((item, idx) => (
      <tr key={`${partKey}-${idx}`}>
        <td className="text-center font-bold text-[10pt]">{item.questionNo.replace('Câu ', '')}</td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.questionReview`, e.currentTarget.innerText)}
          className="text-[10pt]"
        >{item.questionReview}</td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.observation`, e.currentTarget.innerText)}
          className="text-[10pt] text-justify"
        >{item.observation}</td>
        <td className="text-[10pt] bg-slate-50/50">
           <div className="font-bold text-blue-800 mb-1 border-b border-blue-100 pb-1">
             Đáp án: {renderEditable(`detailedReviews.${partKey}.${idx}.answer`, item.answer || 'Chưa rõ')}
           </div>
           <div className="text-[9.5pt] leading-relaxed py-1 whitespace-pre-wrap">
             {renderEditable(`detailedReviews.${partKey}.${idx}.explanation`, item.explanation || 'Đang cập nhật...')}
           </div>
        </td>
        <td 
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate?.(`detailedReviews.${partKey}.${idx}.suggestion`, e.currentTarget.innerText)}
          className="text-[10pt] italic"
        >{item.suggestion}</td>
      </tr>
    ));
  };

  return (
    <div 
      id="audit-report-a4" 
      ref={containerRef}
      className={`a4-container bg-white font-report text-black mx-auto ${isEditing ? '' : 'preview-shadow'}`}
      style={{ fontSize: '12pt' }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="text-center font-bold text-[10pt] leading-tight">
          <p className="uppercase">SỞ GD&ĐT ...........................</p>
          <p className="uppercase">TRƯỜNG THPT ......................</p>
          <div className="w-24 h-[0.7pt] bg-black mx-auto mt-2"></div>
        </div>
        <div className="text-center font-bold text-[10pt] leading-tight">
          <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="normal-case">Độc lập - Tự do - Hạnh phúc</p>
          <div className="w-40 h-[0.7pt] bg-black mx-auto mt-2"></div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[15pt] font-bold uppercase tracking-tight">BIÊN BẢN PHẢN BIỆN ĐỀ THI & ĐÁP ÁN</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-x-10 text-[12pt] italic">
          <p>Môn: <b>{renderEditable('subject', data.subject)}</b></p>
          <p>Khối: <b>{renderEditable('grade', data.grade)}</b></p>
          <p>Mã đề: <b>{renderEditable('examCode', data.examCode)}</b></p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-[12pt] uppercase tracking-wide">I. THỐNG KÊ TỶ LỆ CÂU HỎI</h2>
        </div>
        <table className="mb-3">
          <thead>
            <tr className="font-bold text-center bg-gray-50 text-[10pt]">
              <th className="w-[30%]">Hạng mục</th>
              <th>NB</th>
              <th>TH</th>
              <th>VD</th>
              <th>VDC</th>
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody className="text-center text-[11pt]">
            <tr>
              <td className="text-left px-3 italic">Ma trận chuẩn</td>
              <td>{data.stats.matrix.nb}</td>
              <td>{data.stats.matrix.th}</td>
              <td>{data.stats.matrix.vd}</td>
              <td>{data.stats.matrix.vdc}</td>
              <td className="font-bold">{data.stats.matrix.nb + data.stats.matrix.th + data.stats.matrix.vd + data.stats.matrix.vdc}</td>
            </tr>
            <tr>
              <td className="text-left font-bold px-3">Thực tế đề thi</td>
              <td>{data.stats.actual.nb}</td>
              <td>{data.stats.actual.th}</td>
              <td>{data.stats.actual.vd}</td>
              <td>{data.stats.actual.vdc}</td>
              <td className="font-bold">{data.totalQuestions}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11pt] italic"><b>Nhận xét tỷ lệ:</b> {renderEditable('overview.matrixAlignment', data.overview.matrixAlignment)}</p>
      </div>

      <div className="mb-6">
        <h2 className="font-bold text-[12pt] mb-2 uppercase tracking-wide">II. ĐÁNH GIÁ CHUYÊN MÔN TỔNG QUAN</h2>
        <div className="space-y-2 ml-2 text-[11pt]">
          <p><span className="font-bold">1. Tính khoa học:</span> {renderEditable('overview.scientific', data.overview.scientific)}</p>
          <p><span className="font-bold">2. Tính sư phạm:</span> {renderEditable('overview.pedagogical', data.overview.pedagogical)}</p>
          <p><span className="font-bold">3. Độ chính xác:</span> {renderEditable('overview.accuracy', data.overview.accuracy)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-[12pt] mb-4 uppercase tracking-wide">III. CHI TIẾT PHẢN BIỆN & ĐÁP ÁN GỢI Ý</h2>
        
        {/* Định nghĩa tỷ lệ các cột cho tất cả các bảng phía dưới */}
        <div className="mb-6">
          <p className="font-bold mb-1 italic text-[11pt] text-blue-900 border-l-4 border-blue-600 pl-2">Phần I: Câu hỏi trắc nghiệm (Chọn 1 đáp án đúng)</p>
          <table>
            <thead>
              <tr className="font-bold text-center bg-gray-50 text-[10pt]">
                <th className="w-[5%]">Câu</th>
                <th className="w-[15%] text-left">Nội dung</th>
                <th className="w-[20%] text-left">Nhận xét lỗi</th>
                <th className="w-[45%] text-left">Đáp án & Lời giải chi tiết</th>
                <th className="w-[15%] text-left">Đề xuất</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part1, 'part1')}</tbody>
          </table>
        </div>

        <div className="mb-6">
          <p className="font-bold mb-1 italic text-[11pt] text-blue-900 border-l-4 border-blue-600 pl-2">Phần II: Câu hỏi trắc nghiệm Đúng/Sai</p>
          <table>
            <thead>
              <tr className="font-bold text-center bg-gray-50 text-[10pt]">
                <th className="w-[5%]">Câu</th>
                <th className="w-[15%] text-left">Nội dung</th>
                <th className="w-[20%] text-left">Nhận xét lỗi</th>
                <th className="w-[45%] text-left">Đáp án & Lời giải chi tiết</th>
                <th className="w-[15%] text-left">Đề xuất</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part2, 'part2')}</tbody>
          </table>
        </div>

        <div>
          <p className="font-bold mb-1 italic text-[11pt] text-blue-900 border-l-4 border-blue-600 pl-2">Phần III: Câu hỏi trắc nghiệm trả lời ngắn</p>
          <table>
            <thead>
              <tr className="font-bold text-center bg-gray-50 text-[10pt]">
                <th className="w-[5%]">Câu</th>
                <th className="w-[15%] text-left">Nội dung</th>
                <th className="w-[20%] text-left">Nhận xét lỗi</th>
                <th className="w-[45%] text-left">Đáp án & Lời giải chi tiết</th>
                <th className="w-[15%] text-left">Đề xuất</th>
              </tr>
            </thead>
            <tbody>{renderTableRows(data.detailedReviews?.part3, 'part3')}</tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-10 text-center">
        <div>
          <p className="font-bold uppercase mb-16 text-[10pt]">Người ra đề</p>
          <p className="italic text-[9pt]">(Ký và ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="italic mb-1 text-[10pt]">Ngày {data.auditDate}</p>
          <p className="font-bold uppercase mb-16 text-[10pt]">Người phản biện</p>
          <div className="border-b border-black/40 px-6 font-bold text-[11pt]">
            {renderEditable('auditorName', data.auditorName || '(Họ tên)')}
          </div>
        </div>
      </div>
    </div>
  );
};
