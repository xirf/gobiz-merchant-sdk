import type { CardStatusType } from '../constants/enums.js';

export interface CardDetailsResponse {
  card_id: number;
  status: CardStatusType;
  card_number: string;
  card_expiration: string;
  card_brand: string;
  card_issuer_country?: string;
  card_issuer_bank?: string;
  card_fingerprint?: string;
}

export interface DeleteCardResponse {
  card_id: number;
  status: CardStatusType;
}
