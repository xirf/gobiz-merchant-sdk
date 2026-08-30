import type { OperationResultType } from '../constants/enums.js';
import type { Item } from './common.js';

export interface PartialCapturePayload {
  amount: number;
  items?: Item[];
}

export interface CaptureResponse {
  id: number;
  result: OperationResultType;
}

export interface VoidAuthorizationResponse {
  id: number;
  result: OperationResultType;
}
