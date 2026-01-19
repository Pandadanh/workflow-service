export interface QueueMessage {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
  processedAt?: Date;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  template?: string;
  variables?: Record<string, unknown>;
}

export interface OtpMessage {
  userId: string;
  email: string;
  phone?: string;
  otp: string;
  expiresAt: Date;
}

export interface LoginMessage {
  userId: string;
  email: string;
  deviceInfo?: string;
  ipAddress?: string;
  timestamp: Date;
}


