import { QrCode, Wallet, Building2 } from "lucide-react";

export const REGIONS = [
  { 
    value: "ap-southeast-1", 
    label: "\u0E44\u0E17\u0E22 (Bangkok)", 
    flag: "\uD83C\uDDF9\uD83C\uDDED", 
    ping: "~5ms" 
  },
  { 
    value: "ap-southeast-2", 
    label: "\u0E2A\u0E34\u0E07\u0E04\u0E42\u0E1B\u0E23\u0E4C", 
    flag: "\uD83C\uDDF8\uD83C\uDDEC", 
    ping: "~35ms" 
  },
  { 
    value: "ap-northeast-1", 
    label: "\u0E0D\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E19 (Tokyo)", 
    flag: "\uD83C\uDDEF\uD83C\uDDF5", 
    ping: "~70ms" 
  },
];

export const TOPUP_PACKAGES = [
  { points: 100, price: 100, bonus: 0 },
  { points: 300, price: 300, bonus: 10 },
  { points: 600, price: 600, bonus: 30, popular: true },
  { points: 1200, price: 1200, bonus: 100 },
];

export const PAYMENT_METHODS = [
  {
    id: "promptpay",
    label: "PromptPay",
    icon: <QrCode size={28} className="text-blue-500" />,
    desc: "\u0E21\u0E27\u0E25\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E1C\u0E48\u0E32\u0E19 PromptPay",
  },
  {
    id: "truemoney",
    label: "TrueMoney Wallet",
    icon: <Wallet size={28} className="text-orange-500" />,
    desc: "\u0E17\u0E23\u0E39\u0E21\u0E31\u0E19\u0E19\u0E35\u0E48\u0020\u0E27\u0E2D\u0E25\u0E40\u0E25\u0E47\u0E15",
  },
  {
    id: "bank",
    label: "\u0E42\u0E2D\u0E19\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23",
    icon: <Building2 size={28} className="text-emerald-500" />,
    desc: "\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23\u0E44\u0E17\u0E22",
  },
];
