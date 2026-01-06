
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
      BỐI CẢNH: Chuyên gia Khảo thí cấp cao tại Việt Nam.
      NHIỆM VỤ: Phản biện đề thi và ĐẶC BIỆT chú ý phần đáp án.
      
      YÊU CẦU QUAN TRỌNG VỀ ĐÁP ÁN:
      - Nếu đề thi CHƯA có đáp án hoặc lời giải chi tiết, bạn BẮT BUỘC phải giải đề này và cung cấp đáp án chính xác cùng lời giải logic cho từng câu vào trường "answer" và "explanation".
      - Nếu đã có đáp án, hãy kiểm tra tính đúng đắn của nó.
      
      YÊU CẦU VỀ ĐỊNH DẠNG:
      - Trả về JSON theo đúng schema. 
      - Các công thức toán học/hóa học phải dùng LaTeX (inline: $, block: $$). 
      - Ký tự gạch chéo ngược trong JSON phải được double escape: \\\\.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: promptText }, examPart, matrixPart]
      },
      config: {
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
            isAIGeneratedMatrix: { type: Type.BOOLEAN },
            overview: {
              type: Type.OBJECT,
              properties: {
                scientific: { type: Type.STRING },
                pedagogical: { type: Type.STRING },
                accuracy: { type: Type.STRING },
                matrixAlignment: { type: Type.STRING },
                improvementSuggestions: { type: Type.STRING }
              },
              required: ["scientific", "pedagogical", "accuracy", "matrixAlignment"]
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
    return JSON.parse(jsonStr) as AuditData;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi xử lý phản biện.");
  }
};
