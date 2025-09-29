export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "NGN", label: "Nigerian Naira (NGN)" },
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "GHS", label: "Ghanaian Cedi (GHS)" },
  { code: "UGX", label: "Ugandan Shilling (UGX)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: SupportedCurrencyCode = "USD";
