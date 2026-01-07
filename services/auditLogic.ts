
import { GoogleGenAI, Type } from "@google/genai";
import { AuditData } from '../types';
import mammoth from "mammoth";
import * as XLSX from "xlsx";

function minifyContent(html: string): string {
  return html
    .replace(/<img[^>]*>/g, '') 
    .replace(/style="[^"]*"/g, '') 
    .replace(/class="[^"]*"/g, '') 
    .replace(/<p>\s*<\/p>/g, '') 
    .replace(/&nbsp;/g, ' ')
    .replace(/\s\s+/g, ' ') 
    .replace(/<(?!table|tr|td|p|strong|b|i|br|\/table|\/tr|\/td|\/p|\/strong|\/b|\/i|\/br)[^>]+>/g, '') 
    .trim();
}

async function extractContent(file: File): Promise<{ text?: string; inlineData?: { data: string; mimeType: string } }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({ inlineData: { data: base64Data, mimeType: 'application/pdf' } });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return { text: minifyContent(result.value) };
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    let fullText = "";
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (data.length > 0) {
        fullText += `### SHEET: ${sheetName}\n`;
        (data as any[]).forEach(row => {
          fullText += `| ${row.map(c => String(c || '')).join(' | ')} |\n`;
        });
        fullText += "\n";
      }
    });
    return { text: fullText.trim() };
  }

  const rawText = await file.text();
  return { text: rawText.slice(0, 300000) };
}

export const generateAuditReport = async (
  examFile: File, 
  matrixFile: File | null,
  customApiKey?: string
): Promise<AuditData> => {
  const apiKey = customApiKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Vui lòng cấu hình API Key trong mục Cài đặt (biểu tượng răng cưa) trước khi bắt đầu.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const [examContent, matrixContent] = await Promise.all([
      extractContent(examFile),
      matrixFile 
        ? extractContent(matrixFile) 
        : Promise.resolve<{ text?: string; inlineData?: { data: string; mimeType: string } }>({ text: "KHÔNG CÓ MA TRẬN ĐÍNH KÈM" })
    ]);

    const examPart = examContent.text 
      ? { text: `--- NỘI DUNG ĐỀ THI ---\n${examContent.text}` }
      : { inlineData: examContent.inlineData! };

    const matrixPart = matrixContent.text 
      ? { text: `--- DỮ LIỆU MA TRẬN ---\n${matrixContent.text}` }
      : { inlineData: matrixContent.inlineData! };

    const promptText = `
      BỐI CẢNH: Bạn là một Chuyên gia Giáo dục Việt Nam, có nhiệm vụ "Soi lỗi" đề thi và "Giải đề" một cách chuyên nghiệp.

      QUY TẮC PHÂN LOẠI DỮ LIỆU (TUYỆT ĐỐI TUÂN THỦ):
      - 'answer': Phải có giá trị rõ ràng (VD: "A", "B", "Đúng - Sai - Đúng"). CẤM ghi "Chưa rõ".
      - 'explanation': Đây là vùng QUAN TRỌNG NHẤT. Bạn phải trình bày lời giải chi tiết, phân tích kiến thức, tại sao chọn đáp án đó. PHẢI CÓ NỘI DUNG DÀI VÀ ĐẦY ĐỦ Ở ĐÂY.
      - 'observation': Chỉ dùng để ghi lỗi của đề bài (sai font, sai kiến thức, câu hỏi mơ hồ). Nếu đề không lỗi, ghi "Đề đạt yêu cầu". CẤM ghi lời giải vào đây.
      - 'suggestion': Chỉ dùng để ghi đề xuất sửa đổi câu hỏi để hay hơn. CẤM đưa lời giải vào đây.

      YÊU CẦU: Nếu bạn thấy mình đang định viết kiến thức giải bài vào cột 'suggestion', hãy DỪNG LẠI và đưa toàn bộ nội dung đó vào cột 'explanation'.

      ĐỊNH DẠNG: Trả về JSON theo đúng Schema. Sử dụng LaTeX cho công thức.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: promptText }, examPart, matrixPart]
      },
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            examCode: { type: Type.STRING },
            grade: { type: Type.STRING },
            semester: { type: Type.STRING },
            totalQuestions: { type: Type.NUMBER },
            reportId: { type: Type.STRING },
            auditorName: { type: Type.STRING },
            overview: {
              type: Type.OBJECT,
              properties: {
                scientific: { type: Type.STRING },
                pedagogical: { type: Type.STRING },
                accuracy: { type: Type.STRING },
                matrixAlignment: { type: Type.STRING },
                improvementSuggestions: { type: Type.STRING }
              }
            },
            detailedReviews: {
              type: Type.OBJECT,
              properties: {
                part1: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
                part2: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
                part3: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } } } }
              }
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                matrix: { type: Type.OBJECT, properties: { nb: { type: Type.NUMBER }, th: { type: Type.NUMBER }, vd: { type: Type.NUMBER }, vdc: { type: Type.NUMBER } } },
                actual: { type: Type.OBJECT, properties: { nb: { type: Type.NUMBER }, th: { type: Type.NUMBER }, vd: { type: Type.NUMBER }, vdc: { type: Type.NUMBER } } }
              }
            },
            warnings: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, message: { type: Type.STRING } } } },
            auditDate: { type: Type.STRING }
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) throw new Error("AI không phản hồi dữ liệu.");
    const parsed = JSON.parse(jsonStr) as AuditData;
    
    if (!parsed.stats) {
      parsed.stats = {
        matrix: { nb: 0, th: 0, vd: 0, vdc: 0 },
        actual: { nb: 0, th: 0, vd: 0, vdc: 0 }
      };
    }

    return parsed;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi xử lý phản biện.");
  }
};
