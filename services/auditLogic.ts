
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

export const generateAuditReport = async (examFile: File, matrixFile: File | null): Promise<AuditData> => {
  // Initialize Gemini AI with API key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Explicitly typing the fallback promise result to avoid union type issues with matrixContent
    const [examContent, matrixContent] = await Promise.all([
      extractContent(examFile),
      matrixFile 
        ? extractContent(matrixFile) 
        : Promise.resolve<{ text?: string; inlineData?: { data: string; mimeType: string } }>({ text: "KHÔNG CÓ MA TRẬN ĐÍNH KÈM" })
    ]);

    const examPart = examContent.text 
      ? { text: `--- NỘI DUNG ĐỀ THI ---\n${examContent.text}` }
      : { inlineData: examContent.inlineData! };

    const hasMatrix = !!matrixFile;
    // Fix: matrixContent now strictly follows the return type of extractContent
    const matrixPart = matrixContent.text 
      ? { text: `--- DỮ LIỆU MA TRẬN ---\n${matrixContent.text}` }
      : { inlineData: matrixContent.inlineData! };

    const promptText = `
      BỐI CẢNH: Chuyên gia Khảo thí THPT.
      NHIỆM VỤ: Phân tích Đề thi và Ma trận.
      
      TRƯỜNG HỢP ${hasMatrix ? "CÓ MA TRẬN" : "KHÔNG CÓ MA TRẬN"}:
      ${!hasMatrix ? `
      - Hãy phân tích các câu hỏi trong đề để tự xác định mức độ (NB, TH, VD, VDC) của từng câu.
      - Xây dựng một "Ma trận gợi ý lý tưởng" dựa trên cấu trúc đề thi 2025 của Bộ GD&ĐT (40% NB, 30% TH, 20% VD, 10% VDC hoặc tương đương tùy môn).
      - Đưa ra "Góp ý nâng cao" để đề thi chuyên nghiệp và bám sát chuẩn GDPT 2018 hơn.
      - Đặt biến isAIGeneratedMatrix = true.` : `
      - Đối chiếu thực tế đề thi với Ma trận được cung cấp.
      - Đặt biến isAIGeneratedMatrix = false.`}

      QUY TẮC TOÁN HỌC: Công thức trong dòng dùng $, riêng biệt dùng $$. Escape gạch chéo ngược trong JSON (\\\\).
      YÊU CẦU: Trả về JSON theo schema.
    `;

    // Using gemini-3-pro-preview for complex reasoning and audit tasks
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
                part1: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING } } } },
                part2: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING } } } },
                part3: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { questionNo: { type: Type.STRING }, questionReview: { type: Type.STRING }, observation: { type: Type.STRING }, suggestion: { type: Type.STRING } } } }
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
    if (!jsonStr) {
      throw new Error("Không nhận được nội dung từ AI.");
    }

    return JSON.parse(jsonStr) as AuditData;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi xử lý AI.");
  }
};
