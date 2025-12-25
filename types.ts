
export enum Domain {
  SOFTWARE = 'Software Development',
  COMPUTER_SCIENCE = 'CS Theory',
  ENGINEERING = 'Engineering',
  MEDICAL = 'Medical & Health',
  GENERAL = 'General/Creative'
}

export enum MessageIntent {
  CHAT = 'CHAT',
  SEARCH = 'SEARCH'
}

export interface User {
  username: string;
  id: string;
}

export interface Feedback {
  type: 'up' | 'down';
  comment?: string;
}

export interface Source {
  title: string;
  uri: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: MessageIntent;
  thinking?: string;
  feedback?: Feedback;
  sources?: Source[];
}

export interface OmniExpertState {
  messages: Message[];
  isLoading: boolean;
  activeDomain: Domain;
}
