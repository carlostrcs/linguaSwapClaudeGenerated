export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  displayName?: string | null;
}

export interface Account {
  userId: string;
  email: string;
  displayName?: string | null;
}

export interface LibrarySummary {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  entryCount: number;
}

export interface TranslationDto {
  languageCode: string;
  text: string;
}

export interface EntryDto {
  id: number;
  notes?: string | null;
  createdAt: string;
  translations: TranslationDto[];
}
