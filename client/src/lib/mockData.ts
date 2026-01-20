import kensingtonImage from '@assets/stock_images/luxury_london_townho_8c6c80bb.jpg';

// Mock data for The Exchange

export type DocumentStatus = 'pending' | 'uploaded' | 'in_review' | 'approved' | 'rejected';

export interface Document {
  id: string;
  name: string;
  type: string; // Used as category/section in this new flow
  status: DocumentStatus;
  uploadDate?: string;
  dueDate?: string;
  notes?: string;
  required: boolean;
  description: string;
  uploadedBy?: 'tenant' | 'agent' | 'guarantor';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  zip: string;
  price: string;
  clientId?: string;
  client?: Client;
  agentId: string;
  status: 'active' | 'pending' | 'closed';
  stage: 'Awaiting Documents' | 'In Review' | 'Approved' | 'Listing Live' | 'Empty';
  documents: Document[];
  image: string;
}

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+44 7700 900077',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  }
];

// Baseline Template based on Tenancy Paperwork Checklist
export const MOCK_DOCUMENTS_TEMPLATE: Document[] = [
  // A) Application
  {
    id: 'd1',
    name: 'Tenancy Application Form',
    type: 'Application',
    status: 'uploaded',
    uploadDate: '2026-01-18',
    dueDate: '2026-01-20',
    required: true,
    description: 'Signed tenancy application form.',
    uploadedBy: 'tenant'
  },
  // B) Tenant identity
  {
    id: 'd2',
    name: 'Photographic ID',
    type: 'Identity',
    status: 'uploaded',
    uploadDate: '2026-01-19',
    dueDate: '2026-01-20',
    required: true,
    description: 'Passport or driving licence.',
    uploadedBy: 'tenant'
  },
  // C) Tenancy history
  {
    id: 'd3',
    name: 'Previous Tenancy Agreement',
    type: 'History',
    status: 'in_review',
    uploadDate: '2026-01-19',
    dueDate: '2026-01-21',
    required: true,
    description: 'Must cover landlord name, address, and rental amount.',
    uploadedBy: 'tenant'
  },
  {
    id: 'd4',
    name: 'Landlord Reference',
    type: 'History',
    status: 'pending',
    dueDate: '2026-01-22',
    required: true,
    description: 'Reference letter or email from previous landlord.',
  },
  // D) Tenancy agreement
  {
    id: 'd5',
    name: 'Signed Tenancy Agreement',
    type: 'Agreement',
    status: 'pending',
    dueDate: '2026-01-25',
    required: true,
    description: 'All pages must be initialled, last page signed & dated.',
  },
  // E) Affordability
  {
    id: 'd6',
    name: 'Proof of Income',
    type: 'Affordability',
    status: 'approved',
    uploadDate: '2026-01-15',
    dueDate: '2026-01-20',
    required: true,
    description: 'Employment contract or last 3 months payslips.',
    uploadedBy: 'tenant'
  },
  // F) Proof of address
  {
    id: 'd7',
    name: 'Proof of Address (Doc 1)',
    type: 'Address',
    status: 'pending',
    dueDate: '2026-01-22',
    required: true,
    description: 'Bank statement dated within last 3 months.',
  },
  {
    id: 'd8',
    name: 'Proof of Address (Doc 2)',
    type: 'Address',
    status: 'pending',
    dueDate: '2026-01-22',
    required: true,
    description: 'Utility bill or driving licence.',
  },
  // G) Guarantor
  {
    id: 'd9',
    name: 'Guarantor Form',
    type: 'Guarantor',
    status: 'pending',
    dueDate: '2026-01-23',
    required: true,
    description: 'Completed and signed guarantor form.',
  },
  {
    id: 'd10',
    name: 'Guarantor Proof of Ownership',
    type: 'Guarantor',
    status: 'pending',
    dueDate: '2026-01-23',
    required: true,
    description: 'Mortgage statement or land registry document.',
  },
  {
    id: 'd11',
    name: 'Guarantor ID',
    type: 'Guarantor',
    status: 'pending',
    dueDate: '2026-01-23',
    required: true,
    description: 'Guarantor photographic ID.',
  },
  // H) Payments evidence
  {
    id: 'd12',
    name: 'Rent Payment Evidence',
    type: 'Payments',
    status: 'pending',
    dueDate: '2026-01-28',
    required: true,
    description: 'Proof of balance of rent payment.',
  },
  {
    id: 'd13',
    name: 'Deposit Payment Evidence',
    type: 'Payments',
    status: 'uploaded',
    uploadDate: '2026-01-20',
    dueDate: '2026-01-28',
    required: true,
    description: 'Evidence of damage deposit transfer.',
    uploadedBy: 'tenant'
  },
  {
    id: 'd14',
    name: 'Standing Order Setup',
    type: 'Payments',
    status: 'pending',
    dueDate: '2026-01-28',
    required: true,
    description: 'Screenshot confirming standing order setup.',
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '15 Willow Avenue',
    city: 'London',
    zip: 'SW4 7RJ',
    price: '£2,150 pcm',
    clientId: 'c1',
    client: MOCK_CLIENTS[0],
    agentId: 'a1',
    status: 'active',
    stage: 'In Review',
    image: kensingtonImage, // Reusing existing image asset
    documents: MOCK_DOCUMENTS_TEMPLATE
  }
];

export const CURRENT_AGENT = {
  id: 'a1',
  name: 'James Sterling',
  email: 'james@theexchange.com',
  role: 'agent',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop'
};

export const BANK_DETAILS = {
  accountName: "The Exchange Estate Agents Ltd",
  bankName: "Barclays Bank",
  sortCode: "20-45-67",
  accountNumber: "87654321",
  iban: "GB20 BARC 2045 6787 6543 21",
  bic: "BARCGB22"
};
