import { TouType } from "@domain/index";

export interface TermsOfUseResult {
  id: string;
  name: string;
  touType: TouType;
  summary?: string;
  releasedAt?: Date;
  error?: TouCreateError;
  createdAt?: Date;
}

export interface TermsOfUseModel {
  data: TermsOfUseResult[];
  count: number;
}

export interface TermsOfUseResultCreationModel {
  name: string;
  touType: TouType;
  summary?: string;
  releasedAt?: Date;
}

export interface AcceptTermsOfUseResult {
  id: string;
  name: string;
  summary: string;
  releasedAt: Date;
  isAccepted: boolean;
}

interface TouCreateError {
  code: string;
  message: string;
}
