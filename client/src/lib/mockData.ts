import kensingtonImage from '@assets/stock_images/luxury_london_townho_8c6c80bb.jpg';

// Mock data for The Exchange

export type DocumentStatus = 'pending' | 'uploaded' | 'in_review' | 'approved' | 'rejected';

export interface Document {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  uploadDate?: string;
  notes?: string;
  required: boolean;
  description: string;
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
  clientId: string;
  client: Client;
  agentId: string;
  status: 'active' | 'pending' | 'closed';
  stage: 'Awaiting Documents' | 'In Review' | 'Approved' | 'Listing Live';
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
  },
  {
    id: 'c2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '+44 7700 900123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    id: 'c3',
    name: 'Emma Thompson',
    email: 'emma.t@example.com',
    phone: '+44 7700 900456',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  }
];

export const MOCK_DOCUMENTS_TEMPLATE: Document[] = [
  {
    id: 'd1',
    name: 'Proof of ID',
    type: 'Passport/Driving License',
    status: 'approved',
    uploadDate: '2024-10-15',
    required: true,
    description: 'A valid government-issued photo ID.',
  },
  {
    id: 'd2',
    name: 'Proof of Address',
    type: 'Utility Bill',
    status: 'in_review',
    uploadDate: '2024-10-20',
    required: true,
    description: 'A utility bill or bank statement dated within the last 3 months.',
  },
  {
    id: 'd3',
    name: 'Source of Funds',
    type: 'Bank Statement',
    status: 'pending',
    required: true,
    description: 'Evidence showing the origin of the funds being used.',
  },
  {
    id: 'd4',
    name: 'Property Information Form',
    type: 'Form TA6',
    status: 'pending',
    required: true,
    description: 'Standard property information form.',
  },
  {
    id: 'd5',
    name: 'Fittings and Contents Form',
    type: 'Form TA10',
    status: 'pending',
    required: false,
    description: 'List of items included in the sale.',
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    address: '12 Kensington Gardens',
    city: 'London',
    zip: 'W8 4SG',
    price: '£2,450,000',
    clientId: 'c1',
    client: MOCK_CLIENTS[0],
    agentId: 'a1',
    status: 'active',
    stage: 'In Review',
    image: kensingtonImage,
    documents: [
      { ...MOCK_DOCUMENTS_TEMPLATE[0], status: 'approved', uploadDate: '2024-10-15' },
      { ...MOCK_DOCUMENTS_TEMPLATE[1], status: 'in_review', uploadDate: '2024-10-20' },
      { ...MOCK_DOCUMENTS_TEMPLATE[2], status: 'pending' },
      { ...MOCK_DOCUMENTS_TEMPLATE[3], status: 'pending' },
      { ...MOCK_DOCUMENTS_TEMPLATE[4], status: 'pending' },
    ]
  },
  {
    id: 'p2',
    address: '45 Marina Heights',
    city: 'Brighton',
    zip: 'BN2 5WA',
    price: '£650,000',
    clientId: 'c2',
    client: MOCK_CLIENTS[1],
    agentId: 'a1',
    status: 'active',
    stage: 'Awaiting Documents',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    documents: [
        { ...MOCK_DOCUMENTS_TEMPLATE[0], status: 'approved', uploadDate: '2024-10-10' },
        { ...MOCK_DOCUMENTS_TEMPLATE[1], status: 'pending' },
        { ...MOCK_DOCUMENTS_TEMPLATE[2], status: 'pending' },
        { ...MOCK_DOCUMENTS_TEMPLATE[3], status: 'pending' },
        { ...MOCK_DOCUMENTS_TEMPLATE[4], status: 'pending' },
    ]
  },
  {
    id: 'p3',
    address: 'The Old Rectory',
    city: 'Cotswolds',
    zip: 'GL54 1AB',
    price: '£1,200,000',
    clientId: 'c3',
    client: MOCK_CLIENTS[2],
    agentId: 'a1',
    status: 'active',
    stage: 'Approved',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    documents: [
        { ...MOCK_DOCUMENTS_TEMPLATE[0], status: 'approved', uploadDate: '2024-09-01' },
        { ...MOCK_DOCUMENTS_TEMPLATE[1], status: 'approved', uploadDate: '2024-09-02' },
        { ...MOCK_DOCUMENTS_TEMPLATE[2], status: 'approved', uploadDate: '2024-09-05' },
        { ...MOCK_DOCUMENTS_TEMPLATE[3], status: 'approved', uploadDate: '2024-09-10' },
        { ...MOCK_DOCUMENTS_TEMPLATE[4], status: 'approved', uploadDate: '2024-09-12' },
    ]
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
