import kensingtonImage from '@assets/stock_images/luxury_london_townho_8c6c80bb.jpg';

// Mock data for The Exchange

export type DocumentStatus = 'pending' | 'uploaded' | 'in_review' | 'approved' | 'rejected';

export interface Document {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  uploadDate?: string;
  dueDate?: string;
  notes?: string;
  required: boolean;
  description: string;
  path?: 'employment' | 'student';
  isGuarantor?: boolean;
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
  clientLifecycleStatus?: 'onboarding_in_progress' | 'onboarding_ready_to_confirm' | 'approved_active_tenancy';
  documents: Document[];
  image: string;
  guarantorRequired?: boolean;
  welcomePack?: any[];
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
    dueDate: '2024-10-10',
    required: true,
    description: 'A valid government-issued photo ID.',
  },
  {
    id: 'd2',
    name: 'Proof of Address #1',
    type: 'Bank Statement',
    status: 'in_review',
    uploadDate: '2024-10-20',
    dueDate: '2024-10-18',
    required: true,
    description: 'Bank statement dated within the last 3 months.',
  },
  {
    id: 'd2b',
    name: 'Proof of Address #2',
    type: 'Utility Bill',
    status: 'pending',
    dueDate: '2024-11-01',
    required: true,
    description: 'Utility bill or driving licence (different from ID proof).',
  },
  {
    id: 'd3',
    name: 'Tenancy Application',
    type: 'Form',
    status: 'approved',
    uploadDate: '2024-10-12',
    required: true,
    description: 'Signed tenancy application form.',
  },
  {
    id: 'd4',
    name: 'Current Tenancy Agreement',
    type: 'Agreement',
    status: 'pending',
    required: true,
    description: 'Copy of current signed tenancy agreement.',
  },
  {
    id: 'd5',
    name: 'Landlord Reference Evidence',
    type: 'Email/Letter',
    status: 'pending',
    required: true,
    description: 'Evidence of permission/request for landlord reference.',
  },
  {
    id: 'd6_emp',
    name: 'Employment Evidence',
    type: 'Contract/Payslips',
    status: 'pending',
    required: true, // Conditional in logic
    description: 'Employment contract OR last 3 months payslips.',
    path: 'employment'
  },
  {
    id: 'd6_stu',
    name: 'Student Evidence',
    type: 'ID/Enrollment',
    status: 'pending',
    required: false, // Conditional in logic
    description: 'Student ID OR acceptance/enrolment documents.',
    path: 'student'
  },
  {
    id: 'd7_gua_form',
    name: 'Guarantor Form',
    type: 'Form',
    status: 'pending',
    required: true, // Conditional
    description: 'Completed guarantor form.',
    isGuarantor: true
  },
  {
    id: 'd7_gua_id',
    name: 'Guarantor ID',
    type: 'ID',
    status: 'pending',
    required: true, // Conditional
    description: 'Guarantor photographic ID.',
    isGuarantor: true
  },
  {
    id: 'd7_gua_home',
    name: 'Guarantor Home Ownership',
    type: 'Proof',
    status: 'pending',
    required: true, // Conditional
    description: 'Proof of guarantor home ownership.',
    isGuarantor: true
  },
  {
    id: 'd8',
    name: 'Signed Tenancy Agreement',
    type: 'Agreement',
    status: 'pending',
    required: true,
    description: 'All pages signed, last page signed & dated.',
  },
  {
    id: 'd9_rent',
    name: 'Rent Payment Proof',
    type: 'Receipt',
    status: 'pending',
    required: true,
    description: 'Proof of balance of rent payment.',
  },
  {
    id: 'd9_dep',
    name: 'Deposit Payment Proof',
    type: 'Receipt',
    status: 'pending',
    required: true,
    description: 'Evidence of damage deposit payment.',
  },
  {
    id: 'd9_so',
    name: 'Standing Order Proof',
    type: 'Screenshot',
    status: 'pending',
    required: true,
    description: 'Evidence of standing order set up.',
  }
];

export const WELCOME_PACK_SLIDES = [
  {
    id: 'wp1',
    title: 'Welcome Home',
    body: 'We hope you settle in well. Here is everything you need to know about your new home.',
    icon: 'info'
  },
  {
    id: 'wp2',
    title: 'Wi-Fi Details',
    body: 'Get connected immediately using the details below.',
    icon: 'wifi',
    fields: [
      { label: 'Network', value: 'Kensington_Guest', copyable: true },
      { label: 'Password', value: 'Welcome2026!', copyable: true }
    ]
  },
  {
    id: 'wp3',
    title: 'Refuse Collection',
    body: 'Please ensure bins are put out by 7am on collection days.',
    icon: 'trash',
    fields: [
      { label: 'General Waste', value: 'Every Tuesday' },
      { label: 'Recycling', value: 'Alternate Tuesdays' }
    ]
  },
  {
    id: 'wp4',
    title: 'Emergency Contacts',
    body: 'For urgent maintenance issues, please contact our 24/7 support line.',
    icon: 'phone',
    fields: [
      { label: 'Emergency Line', value: '020 7946 0000', copyable: true },
      { label: 'Office Hours', value: 'Mon-Fri, 9am-6pm' }
    ]
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
    stage: 'Awaiting Documents',
    clientLifecycleStatus: 'onboarding_in_progress', // 'onboarding_in_progress' | 'approved_active_tenancy'
    image: kensingtonImage,
    guarantorRequired: true, 
    welcomePack: WELCOME_PACK_SLIDES,
    documents: [
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd3')!, status: 'approved' }, // App form (Stage 1)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd1')!, status: 'pending' },  // ID (Stage 2)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd2')!, status: 'pending' },  // Addr 1 (Stage 2)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd2b')!, status: 'pending' }, // Addr 2 (Stage 2)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd4')!, status: 'pending' },  // Tenancy History (Stage 3)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd5')!, status: 'pending' },  // Landlord Ref (Stage 3)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd6_emp')!, status: 'pending' }, // Emp (Stage 4)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd6_stu')!, status: 'pending' }, // Stu (Stage 4)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd7_gua_form')!, status: 'pending' }, // Gua (Stage 4)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd7_gua_id')!, status: 'pending' }, // Gua (Stage 4)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd7_gua_home')!, status: 'pending' }, // Gua (Stage 4)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd8')!, status: 'pending' }, // Agmt (Stage 5)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd9_rent')!, status: 'pending' }, // Pay (Stage 6)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd9_dep')!, status: 'pending' }, // Pay (Stage 6)
      { ...MOCK_DOCUMENTS_TEMPLATE.find(d => d.id === 'd9_so')!, status: 'pending' }, // Pay (Stage 6)
    ]
  },
  // ... keep other properties simple or update if needed
];

export const JOURNEY_STAGES = [
  {
    id: 'stage_1',
    title: 'Application',
    description: 'Submit your tenancy application.',
    requirementIds: ['d3'],
    guidanceBullets: [
      "Complete and upload your signed tenancy application form.",
      "Make sure all personal details are accurate.",
      "Once submitted, your agent will review and confirm next steps."
    ]
  },
  {
    id: 'stage_2',
    title: 'Identity & Address',
    description: 'Verify ID and residency.',
    requirementIds: ['d1', 'd2', 'd2b'],
    guidanceBullets: [
      "Upload a clear photo/scan of your passport or driving licence.",
      "Upload two proof-of-address documents (one bank statement + one utility bill/licence).",
      "Ensure documents are recent (within the last 3 months where relevant)."
    ]
  },
  {
    id: 'stage_3',
    title: 'Tenancy History',
    description: 'Previous tenancy details.',
    requirementIds: ['d4', 'd5'],
    guidanceBullets: [
      "Upload your current signed tenancy agreement (showing landlord, dates, address, and rent).",
      "Upload evidence that your landlord has been contacted for a reference (permission/request email proof).",
      "If anything is missing, your agent may request a resubmission."
    ]
  },
  {
    id: 'stage_4',
    title: 'Affordability',
    description: 'Income and guarantor check.',
    requirementIds: ['d6_emp', 'd6_stu', 'd7_gua_form', 'd7_gua_id', 'd7_gua_home'],
    guidanceBullets: [
      "Upload either employment evidence (contract/payslips) OR student enrolment evidence.",
      "If a guarantor is required, upload the guarantor form, proof of ownership, and ID.",
      "Make sure all documents are readable and complete."
    ]
  },
  {
    id: 'stage_5',
    title: 'Agreement',
    description: 'Sign the contract.',
    requirementIds: ['d8'],
    guidanceBullets: [
      "Upload your signed tenancy agreement.",
      "Confirm all pages are signed and the final page is signed and dated.",
      "Your agent will approve this before payments are finalised."
    ]
  },
  {
    id: 'stage_6',
    title: 'Payments',
    description: 'Rent and deposit.',
    requirementIds: ['d9_rent', 'd9_dep', 'd9_so'],
    guidanceBullets: [
      "Upload proof of your rent payment (balance of rent).",
      "Upload proof of deposit payment / standing order.",
      "Upload confirmation of standing order set up for future rent payments.",
      "Use the bank details provided to avoid payment delays."
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

export const HELP_SERVICES = [
  {
    id: 'internet',
    title: 'Internet & Wi-Fi',
    icon: 'wifi',
    description: 'Setup and support for broadband.',
    links: [
      { title: 'Virgin Media', url: 'https://www.virginmedia.com', description: 'Broadband, TV & Phone bundles.' },
      { title: 'BT Broadband', url: 'https://www.bt.com/broadband', description: 'Fiber broadband packages.' },
      { title: 'Hyperoptic', url: 'https://www.hyperoptic.com', description: 'Gigabit fiber broadband.' }
    ]
  },
  {
    id: 'cleaning',
    title: 'Cleaning Services',
    icon: 'sparkles',
    description: 'Professional home cleaning.',
    links: [
      { title: 'Fantastic Services', url: 'https://fantasticservices.com', description: 'Domestic cleaning and one-off cleans.' },
      { title: 'Housekeep', url: 'https://housekeep.com', description: 'Regular home cleaning.' },
      { title: 'End of Tenancy Cleaning', url: '#', description: 'Deep clean for moving out.' }
    ]
  },
  {
    id: 'pest',
    title: 'Pest Control',
    icon: 'bug',
    description: 'Removal and prevention services.',
    links: [
      { title: 'Rentokil', url: 'https://www.rentokil.co.uk', description: 'Expert pest control services.' },
      { title: 'Pest.co.uk', url: 'https://www.pest.co.uk', description: 'Local pest control technicians.' }
    ]
  },
  {
    id: 'utilities',
    title: 'Utilities',
    icon: 'zap',
    description: 'Gas, electricity and water.',
    links: [
      { title: 'Octopus Energy', url: 'https://octopus.energy', description: 'Green energy supplier.' },
      { title: 'British Gas', url: 'https://www.britishgas.co.uk', description: 'Gas and electricity.' },
      { title: 'Thames Water', url: 'https://www.thameswater.co.uk', description: 'Water services.' }
    ]
  },
   {
    id: 'moving',
    title: 'Moving Services',
    icon: 'truck',
    description: 'Removals and storage.',
    links: [
      { title: 'AnyVan', url: 'https://www.anyvan.com', description: 'Man and van services.' },
      { title: 'Zipjet', url: 'https://www.zipjet.co.uk', description: 'Laundry and dry cleaning.' }
    ]
  }
];
