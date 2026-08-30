export const Currency = {
  CZK: 'CZK',
  EUR: 'EUR',
  PLN: 'PLN',
  USD: 'USD',
  GBP: 'GBP',
  HUF: 'HUF',
  RON: 'RON',
} as const;

export type CurrencyType = (typeof Currency)[keyof typeof Currency];

export const PaymentInstrument = {
  PAYMENT_CARD: 'PAYMENT_CARD',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  GPAY: 'GPAY',
  APPLE_PAY: 'APPLE_PAY',
  PAYPAL: 'PAYPAL',
  MPAYMENT: 'MPAYMENT',
  PRSMS: 'PRSMS',
  PAYSAFECARD: 'PAYSAFECARD',
  BITCOIN: 'BITCOIN',
  CLICK_TO_PAY: 'CLICK_TO_PAY',
  TWISTO: 'TWISTO',
  SKIPPAY: 'SKIPPAY',
} as const;

export type PaymentInstrumentType = (typeof PaymentInstrument)[keyof typeof PaymentInstrument];

export const BankSwift = {
  QRPAYMENT: 'QRPAYMENT',
  GIBACZPX: 'GIBACZPX', // Česká Spořitelna
  KOMBCZPP: 'KOMBCZPP', // Komerční Banka
  CEKOCZPP: 'CEKOCZPP', // ČSOB
  RZBCCZPP: 'RZBCCZPP', // Raiffeisenbank
  BACXCZPP: 'BACXCZPP', // UniCredit Bank
  AGBACZPP: 'AGBACZPP', // Moneta Money Bank
  FIOBCZPP: 'FIOBCZPP', // FIO Banka
  BREXCZPP: 'BREXCZPP', // mBank
  AIRACZPP: 'AIRACZPP', // AirBank
  INGBCZPP: 'INGBCZPP', // ING Bank
  OBKLCZ2X: 'OBKLCZ2X', // Oberbank
  SUBACZPP: 'SUBACZPP', // VÚB Praha
  BPPFCZP1: 'BPPFCZP1', // Hello bank!
  CTASCZ22: 'CTASCZ22', // CREDITAS
  EXPNCZPP: 'EXPNCZPP', // Max banka
  JTBPCZPP: 'JTBPCZPP', // J&T Banka
  PTBNCZPP: 'PTBNCZPP', // Partners Banka
  TATRSKBX: 'TATRSKBX', // Tatra Banka (SK)
  SUBASKBX: 'SUBASKBX', // VÚB (SK)
  UNCRSKBX: 'UNCRSKBX', // UniCredit (SK)
  GIBASKBX: 'GIBASKBX', // Slovenská Sporiteľňa (SK)
  CEKOSKBX: 'CEKOSKBX', // ČSOB (SK)
  POBNSKBA: 'POBNSKBA', // Poštová Banka (SK)
  OTPVSKBX: 'OTPVSKBX', // OTP Banka (SK)
  KOMASK2X: 'KOMASK2X', // Prima Banka (SK)
  CITISKBA: 'CITISKBA', // Citibank (SK)
  FIOZSKBA: 'FIOZSKBA', // Fio banka (SK)
  BREXSKBX: 'BREXSKBX', // mBank (SK)
  INGBSKBX: 'INGBSKBX', // ING Bank (SK)
  SZFXPLPW: 'SZFXPLPW', // Santander (PL)
  INGBPLPW: 'INGBPLPW', // ING (PL)
  PKOPPLPW: 'PKOPPLPW', // iPKO (PL)
  BREXPLPW: 'BREXPLPW', // mBank (PL)
  BPHKPLPK: 'BPHKPLPK', // Bank BPH (PL)
  ALBPPLPW: 'ALBPPLPW', // Alior Bank (PL)
  PBPBPLPW: 'PBPBPLPW', // Bank Pekao (PL)
} as const;

export type BankSwiftType = (typeof BankSwift)[keyof typeof BankSwift];

export const PaymentState = {
  CREATED: 'CREATED',
  PAYMENT_METHOD_CHOSEN: 'PAYMENT_METHOD_CHOSEN',
  PAID: 'PAID',
  AUTHORIZED: 'AUTHORIZED',
  CANCELED: 'CANCELED',
  TIMEOUTED: 'TIMEOUTED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentStateType = (typeof PaymentState)[keyof typeof PaymentState];

export const CardStatus = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;

export type CardStatusType = (typeof CardStatus)[keyof typeof CardStatus];

export const ItemType = {
  ITEM: 'ITEM',
  DELIVERY: 'DELIVERY',
  DISCOUNT: 'DISCOUNT',
} as const;

export type ItemTypeType = (typeof ItemType)[keyof typeof ItemType];

export const OAuthScope = {
  PAYMENT_CREATE: 'payment-create',
  PAYMENT_ALL: 'payment-all',
} as const;

export type OAuthScopeType = (typeof OAuthScope)[keyof typeof OAuthScope];

export const Language = {
  CS: 'CS',
  SK: 'SK',
  EN: 'EN',
  DE: 'DE',
  RU: 'RU',
  PL: 'PL',
  HU: 'HU',
  FR: 'FR',
  RO: 'RO',
  BG: 'BG',
  HR: 'HR',
  IT: 'IT',
  ES: 'ES',
} as const;

export type LanguageType = (typeof Language)[keyof typeof Language];

export const OperationResult = {
  ACCEPTED: 'ACCEPTED',
  FINISHED: 'FINISHED',
  FAILED: 'FAILED',
} as const;

export type OperationResultType = (typeof OperationResult)[keyof typeof OperationResult];

export const RecurrenceCycle = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  ON_DEMAND: 'ON_DEMAND',
} as const;

export type RecurrenceCycleType = (typeof RecurrenceCycle)[keyof typeof RecurrenceCycle];

export const RecurrenceState = {
  REQUESTED: 'REQUESTED',
  STARTED: 'STARTED',
  STOPPED: 'STOPPED',
} as const;

export type RecurrenceStateType = (typeof RecurrenceState)[keyof typeof RecurrenceState];

export const PreauthorizationState = {
  REQUESTED: 'REQUESTED',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  CANCELED: 'CANCELED',
} as const;

export type PreauthorizationStateType = (typeof PreauthorizationState)[keyof typeof PreauthorizationState];

export const StatementFormat = {
  CSV_A: 'CSV_A',
  CSV_B: 'CSV_B',
  CSV_C: 'CSV_C',
  PDF: 'PDF',
  ABO_A: 'ABO_A',
  ABO_B: 'ABO_B',
  XLS: 'XLS',
} as const;

export type StatementFormatType = (typeof StatementFormat)[keyof typeof StatementFormat];

export const BNPLType = {
  TWISTO: 'TWISTO',
  SKIPPAY: 'SKIPPAY',
} as const;

export type BNPLTypeType = (typeof BNPLType)[keyof typeof BNPLType];

export const QrCodeFormat = {
  PNG: 'png',
  SVG: 'svg',
  HTML: 'html',
} as const;

export type QrCodeFormatType = (typeof QrCodeFormat)[keyof typeof QrCodeFormat];
