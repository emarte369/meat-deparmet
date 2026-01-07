export interface Seller {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  sellerId: string;
  sellerName: string; // Denormalized for easier display
  date: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  description: string;
  createdAt: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  SELLERS = 'SELLERS',
  INVOICES = 'INVOICES',
  SALES = 'SALES',
  REPORTS = 'REPORTS'
}

export interface ReportData {
  totalSales: number;
  totalExpenses: number; // Sum of invoices
  netProfit: number;
  profitMargin: number;
  returnOnCapital: number;
  saleCount: number;
  invoiceCount: number;
  periodStart: string;
  periodEnd: string;
}