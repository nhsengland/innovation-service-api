import { TouType } from "@domain/index";

export interface TermsAndUseResult {
  id: string;
  name: string;
  touType: TouType;
  summary?: string;
  releaseAt?: Date;
}

export interface TermsAndUseModel {
  data: TermsAndUseResult[];
  count: number;
}

export interface TermsAndUseResultCreationModel {
  name: string;
  touType: TouType;
  summary?: string;
  releaseAt?: Date;
}
