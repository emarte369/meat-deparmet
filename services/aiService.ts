import { GoogleGenAI } from "@google/genai";
import { ReportData } from "../types";

const apiKey = process.env.API_KEY || '';

export const generateFinancialAnalysis = async (report: ReportData): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Cannot generate AI analysis.";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a Senior Financial Analyst. Analyze the following "Weekly Financial Performance Report" for the period ${report.periodStart} to ${report.periodEnd}.

    Data:
    - Total Sales Revenue: $${report.totalSales.toFixed(2)}
    - Total Adjusted COGS (Vendor Expenditure): $${report.totalExpenses.toFixed(2)}
    - Gross Profit: $${report.netProfit.toFixed(2)}
    - Profit Margin: ${report.profitMargin.toFixed(2)}%
    - ROI: ${report.returnOnCapital.toFixed(2)}%
    - Transaction Volume: ${report.saleCount} sales, ${report.invoiceCount} invoices.

    Please provide a concise, professional analysis (max 3 paragraphs). 
    1. specific comment on the ROI and Margin.
    2. Analyze the Vendor Expenditure efficiency.
    3. Suggest one strategic improvement based on these numbers.
    
    Address the business owner directly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Failed to generate analysis due to a technical error.";
  }
};