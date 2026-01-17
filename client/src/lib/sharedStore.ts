// Shared state store using localStorage events for cross-tab sync simulation

export type RentStatus = 'unpaid' | 'pending' | 'paid';

export interface RentPayment {
  id: string;
  dueDate: string;
  amount: number;
  status: RentStatus;
}

export interface ReportMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface ClientReport {
  id: string;
  clientId: string;
  propertyId: string;
  category: 'maintenance' | 'admin' | 'urgent';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved' | 'ignored';
  createdAt: string;
  messages: ReportMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// Initial mock data
const INITIAL_RENT_SCHEDULE: RentPayment[] = [
  { id: "pay_1", dueDate: "2026-10-01", amount: 1200, status: 'paid' },
  { id: "pay_2", dueDate: "2026-11-01", amount: 1200, status: 'paid' },
  { id: "pay_3", dueDate: "2026-12-01", amount: 1200, status: 'unpaid' },
  { id: "pay_4", dueDate: "2027-01-01", amount: 1200, status: 'unpaid' },
  { id: "pay_5", dueDate: "2027-02-01", amount: 1200, status: 'unpaid' },
];

class SharedStore {
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.notify);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify = () => {
    this.listeners.forEach(l => l());
  };

  // Generic getter/setter
  private get<T>(key: string, initial: T): T {
    if (typeof window === 'undefined') return initial;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  }

  private set<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
    this.notify();
    // Dispatch storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value) }));
  }

  // Rent Schedule
  getRentSchedule(propertyId: string): RentPayment[] {
    return this.get(`rent_${propertyId}`, INITIAL_RENT_SCHEDULE);
  }

  updateRentPayment(propertyId: string, paymentId: string, updates: Partial<RentPayment>) {
    const schedule = this.getRentSchedule(propertyId);
    const newSchedule = schedule.map(p => p.id === paymentId ? { ...p, ...updates } : p);
    this.set(`rent_${propertyId}`, newSchedule);
  }

  addRentPayment(propertyId: string, payment: RentPayment) {
    const schedule = this.getRentSchedule(propertyId);
    this.set(`rent_${propertyId}`, [...schedule, payment]);
  }

  deleteRentPayment(propertyId: string, paymentId: string) {
    const schedule = this.getRentSchedule(propertyId);
    this.set(`rent_${propertyId}`, schedule.filter(p => p.id !== paymentId));
  }

  // Reports
  getReports(propertyId: string): ClientReport[] {
    return this.get(`reports_${propertyId}`, []);
  }

  addReport(report: ClientReport) {
    const reports = this.get(`reports_${report.propertyId}`, []);
    // Ensure messages array exists
    const newReport = { ...report, messages: report.messages || [] };
    this.set(`reports_${report.propertyId}`, [newReport, ...reports]);
  }

  resolveReport(propertyId: string, reportId: string, status: 'resolved' | 'ignored' = 'resolved') {
    const reports = this.get(`reports_${propertyId}`, []) as ClientReport[];
    this.set(`reports_${propertyId}`, reports.map(r => r.id === reportId ? { ...r, status } : r));
  }

  addReportMessage(propertyId: string, reportId: string, message: ReportMessage) {
    const reports = this.get(`reports_${propertyId}`, []) as ClientReport[];
    this.set(`reports_${propertyId}`, reports.map(r => 
      r.id === reportId 
        ? { ...r, messages: [...(r.messages || []), message] } 
        : r
    ));
  }

  // Chat
  getMessages(propertyId: string): ChatMessage[] {
    return this.get(`chat_${propertyId}`, []);
  }

  sendMessage(propertyId: string, message: ChatMessage) {
    const messages = this.get(`chat_${propertyId}`, []);
    this.set(`chat_${propertyId}`, [...messages, message]);
  }

  markMessagesAsRead(propertyId: string, receiverId: string) {
    const messages = this.get(`chat_${propertyId}`, []) as ChatMessage[];
    const hasUnread = messages.some(m => m.receiverId === receiverId && !m.read);
    
    if (hasUnread) {
      const updatedMessages = messages.map(m => 
        (m.receiverId === receiverId && !m.read) 
          ? { ...m, read: true } 
          : m
      );
      this.set(`chat_${propertyId}`, updatedMessages);
    }
  }

  // Documents & Default Requirements
  getDefaultRequirements(): string[] {
    return this.get('default_requirements', ['Proof of ID', 'Proof of Address', 'Right to Rent Check']);
  }

  setDefaultRequirements(requirements: string[]) {
    this.set('default_requirements', requirements);
  }

  // Property Documents (Mock - usually this would be more complex)
  // We'll store documents keyed by propertyId, and inside they have clientId
  getPropertyDocuments(propertyId: string): any[] {
    // Return mock documents if empty, otherwise from storage
    return this.get(`docs_${propertyId}`, []);
  }

  addDocumentsForClient(propertyId: string, clientId: string, clientName: string) {
    const defaults = this.getDefaultRequirements();
    const currentDocs = this.getPropertyDocuments(propertyId);
    
    const newDocs = defaults.map((type, index) => ({
      id: `doc_${clientId}_${Date.now()}_${index}`,
      name: type,
      type: type, // Using name as type for simplicity
      status: 'pending',
      uploadDate: null,
      required: true,
      description: `Please upload your ${type}`,
      clientId: clientId, // Link to client
      clientName: clientName
    }));

    this.set(`docs_${propertyId}`, [...currentDocs, ...newDocs]);
  }

  removeDocumentsForClient(propertyId: string, clientId: string) {
    const currentDocs = this.getPropertyDocuments(propertyId);
    const filteredDocs = currentDocs.filter(doc => doc.clientId !== clientId);
    this.set(`docs_${propertyId}`, filteredDocs);
  }
}

export const sharedStore = new SharedStore();
