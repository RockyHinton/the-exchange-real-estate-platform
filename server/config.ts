export interface AgencyConfig {
  name: string;
  tagline: string;
  address: string;
  city: string;
  postcode: string;
  email: string;
  phone: string;
}

export interface BankConfig {
  accountName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
}

export interface AppConfig {
  agentEmails: string[];
  agency: AgencyConfig;
  bank: BankConfig;
}

function parseAgentEmails(): string[] {
  const emailsEnv = process.env.AGENT_EMAILS || "";
  if (!emailsEnv.trim()) {
    return [];
  }
  return emailsEnv
    .split(",")
    .map(email => email.toLowerCase().trim())
    .filter(email => email.length > 0);
}

export function getConfig(): AppConfig {
  return {
    agentEmails: parseAgentEmails(),
    agency: {
      name: process.env.AGENCY_NAME || "Your Agency Name",
      tagline: process.env.AGENCY_TAGLINE || "Property Management",
      address: process.env.AGENCY_ADDRESS || "",
      city: process.env.AGENCY_CITY || "",
      postcode: process.env.AGENCY_POSTCODE || "",
      email: process.env.AGENCY_EMAIL || "",
      phone: process.env.AGENCY_PHONE || "",
    },
    bank: {
      accountName: process.env.BANK_ACCOUNT_NAME || "",
      bankName: process.env.BANK_NAME || "",
      sortCode: process.env.BANK_SORT_CODE || "",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
      iban: process.env.BANK_IBAN || undefined,
      bic: process.env.BANK_BIC || undefined,
    },
  };
}

export function isAgentEmail(email: string): boolean {
  const config = getConfig();
  const normalizedEmail = email.toLowerCase().trim();
  return config.agentEmails.includes(normalizedEmail);
}

export function getAgentEmails(): string[] {
  return getConfig().agentEmails;
}
