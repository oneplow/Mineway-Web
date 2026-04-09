// Mock data matching the Prisma schema
// Replace these with real DB calls via /api routes in production

export const PLANS = [
  {
    id: "plan_free",
    name: "free",
    displayName: "Free",
    pricePoints: 0,
    bandwidthGB: 10,
    maxPlayers: 5,
    maxKeys: 1,
    maxNodes: 1,
    features: ["10 GB bandwidth/เดือน", "5 players พร้อมกัน", "1 API key", "1 region"],
    isPopular: false,
  },
  {
    id: "plan_starter",
    name: "starter",
    displayName: "Starter",
    pricePoints: 99,
    bandwidthGB: 100,
    maxPlayers: 20,
    maxKeys: 3,
    maxNodes: 3,
    features: ["100 GB bandwidth/เดือน", "20 players พร้อมกัน", "3 API keys", "3 regions", "Email alerts", "Priority support"],
    isPopular: true,
  },
  {
    id: "plan_pro",
    name: "pro",
    displayName: "Pro",
    pricePoints: 299,
    bandwidthGB: 500,
    maxPlayers: 0,
    maxKeys: 10,
    maxNodes: 99,
    features: ["500 GB bandwidth/เดือน", "ผู้เล่นไม่จำกัด", "10 API keys", "ทุก region", "Email + Discord alerts", "Priority support", "Custom subdomain"],
    isPopular: false,
  },
];

export const REGIONS = [
  { value: "ap-southeast-1", label: "ไทย (Bangkok)", flag: "🇹🇭", ping: "~5ms" },
  { value: "ap-southeast-2", label: "สิงคโปร์", flag: "🇸🇬", ping: "~35ms" },
  { value: "ap-northeast-1", label: "ญี่ปุ่น (Tokyo)", flag: "🇯🇵", ping: "~70ms" },
];

export const TOPUP_PACKAGES = [
  { points: 100, price: 100, bonus: 0 },
  { points: 300, price: 300, bonus: 10 },
  { points: 600, price: 600, bonus: 30, popular: true },
  { points: 1200, price: 1200, bonus: 100 },
];

import { QrCode, Wallet, Building2 } from 'lucide-react';

export const PAYMENT_METHODS = [
  { id: "promptpay", label: "PromptPay", icon: <QrCode size={28} className="text-blue-500" />, desc: "QR Code พร้อมเพย์" },
  { id: "truemoney", label: "TrueMoney Wallet", icon: <Wallet size={28} className="text-orange-500" />, desc: "กดอนุมัติผ่านแอป" },
  { id: "bank", label: "โอนธนาคาร", icon: <Building2 size={28} className="text-emerald-500" />, desc: "กรุงไทย / กสิกร / SCB" },
];
