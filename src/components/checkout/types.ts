export type AddressState = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
};

export type PaymentMode = "STRIPE" | "PAYPAL" | "DEMO";

export type StartResponse = {
  mode: "stripe" | "paypal" | "demo";
  orderNumber: string;
  orderId: string;
  clientSecret?: string;
  paypalOrderId?: string;
  publishableKey?: string;
  error?: string;
  code?: string;
};

export const emptyAddress: AddressState = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  county: "",
  postcode: "",
  country: "GB",
};

export const COUNTRIES = [
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "NL", label: "Netherlands" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "ZA", label: "South Africa" },
];
