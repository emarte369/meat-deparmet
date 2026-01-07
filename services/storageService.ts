import { Seller, Invoice, Sale } from '../types';

const DB_NAME = 'MeatDeptDB';
const DB_VERSION = 1;
const STORES = {
  SELLERS: 'sellers',
  INVOICES: 'invoices',
  SALES: 'sales',
};

class StorageService {
  private db: IDBDatabase | null = null;
  private isPersistent: boolean = false;

  async init(): Promise<void> {
    if (this.db) return;

    if (navigator.storage && navigator.storage.persist) {
      this.isPersistent = await navigator.storage.persist();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORES.SELLERS)) db.createObjectStore(STORES.SELLERS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.INVOICES)) db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.SALES)) db.createObjectStore(STORES.SALES, { keyPath: 'id' });
      };
    });
  }

  async getStorageStatus() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const persistent = await navigator.storage.persisted();
      return {
        persistent,
        usage: (estimate.usage || 0) / (1024 * 1024),
        isStandalone: (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
      };
    }
    return { persistent: false, usage: 0, isStandalone: false };
  }

  private async getStoreData<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async addItem<T>(storeName: string, item: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteItem(storeName: string, id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSellers(): Promise<Seller[]> { return this.getStoreData<Seller>(STORES.SELLERS); }
  async addSeller(seller: Seller): Promise<void> { await this.addItem(STORES.SELLERS, seller); }
  async deleteSeller(id: string): Promise<void> { await this.deleteItem(STORES.SELLERS, id); }

  async getInvoices(): Promise<Invoice[]> { return this.getStoreData<Invoice>(STORES.INVOICES); }
  async addInvoice(invoice: Invoice): Promise<void> { await this.addItem(STORES.INVOICES, invoice); }
  async deleteInvoice(id: string): Promise<void> { await this.deleteItem(STORES.INVOICES, id); }

  async getSales(): Promise<Sale[]> { return this.getStoreData<Sale>(STORES.SALES); }
  async addSale(sale: Sale): Promise<void> { await this.addItem(STORES.SALES, sale); }
  async deleteSale(id: string): Promise<void> { await this.deleteItem(STORES.SALES, id); }

  async exportDatabase() {
    const data = {
      sellers: await this.getSellers(),
      invoices: await this.getInvoices(),
      sales: await this.getSales(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meat_dept_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importDatabase(jsonString: string) {
    const data = JSON.parse(jsonString);
    if (data.sellers) for (const s of data.sellers) await this.addSeller(s);
    if (data.invoices) for (const i of data.invoices) await this.addInvoice(i);
    if (data.sales) for (const s of data.sales) await this.addSale(s);
  }

  async clearAllData() {
    await this.init();
    const transaction = this.db!.transaction(Object.values(STORES), 'readwrite');
    Object.values(STORES).forEach(store => transaction.objectStore(store).clear());
  }
}

export const dbService = new StorageService();