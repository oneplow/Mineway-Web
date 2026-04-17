"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/components/UserProvider";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Upload,
  QrCode,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Clock,
  Sparkles,
  Wallet,
  Settings2
} from "lucide-react";
import { TOPUP_PACKAGES } from "@/lib/constants";
import toast from "react-hot-toast";
import PageLoader from "@/components/ui/PageLoader";

function StatusBadge({ status }) {
  const cfg = {
    completed: { bg: "bg-[#10d97e]/10", text: "text-[#10d97e]", label: "สำเร็จ" },
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", label: "รอชำระ" },
    pending_review: { bg: "bg-blue-500/10", text: "text-blue-500", label: "รอตรวจสอบ" },
    waiting_verify: { bg: "bg-blue-500/10", text: "text-blue-500", label: "รอตรวจสอบ" },
    failed: { bg: "bg-red-500/10", text: "text-red-500", label: "ล้มเหลว" },
  }[status] || { bg: "bg-gray-500/10", text: "text-gray-500", label: status };

  return (
    <span className={`px-2.5 py-1 ${cfg.bg} ${cfg.text} rounded-full text-[11px] font-bold tracking-wider`}>
      {cfg.label}
    </span>
  );
}

export default function PaymentsPage() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useUser();

  const [paymentMethod, setPaymentMethod] = useState("promptpay"); // 'promptpay' or 'voucher'
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // PromptPay State
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(1);
  const [customAmount, setCustomAmount] = useState("");
  const [order, setOrder] = useState(null);
  const qrCanvasRef = useRef(null);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Voucher State
  const [voucherUrl, setVoucherUrl] = useState("");

  // Redeem Code State
  const [redeemCode, setRedeemCode] = useState("");

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([fetch("/api/user"), fetch("/api/payments")]);
      if (uRes.ok) setUser(await uRes.json());
      if (tRes.ok) setTransactions(await tRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Generate QR ────────────────────────────────────────────────────
  const generateQR = useCallback(async (promptpayNumber, amount) => {
    if (!qrCanvasRef.current || !promptpayNumber || !amount) return;

    try {
      const { generatePromptPayPayload } = await import("@/lib/promptpay");
      const QRCode = await import("qrcode");

      const payload = generatePromptPayPayload(promptpayNumber, amount);

      await QRCode.toCanvas(qrCanvasRef.current, payload, {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch (err) {
      console.error("QR generation error:", err);
      toast.error("ไม่สามารถสร้าง QR Code ได้");
    }
  }, []);

  useEffect(() => {
    if (step === 2 && paymentMethod === "promptpay" && order?.promptpayNumber && order?.amount) {
      const timer = setTimeout(() => { generateQR(order.promptpayNumber, order.amount); }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, paymentMethod, order, generateQR]);

  // ─── Create PromptPay Order ─────────────────────────────────────────
  const handleCreateOrder = async () => {
    if (selectedPkgIndex === null && (!customAmount || isNaN(customAmount) || parseFloat(customAmount) < 10)) {
      toast.error("กรุณาเลือกแพ็กเกจ หรือระบุจำนวนเงินขั้นต่ำ 10 บาท");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("กำลังสร้างรายการ...");
    try {
      const payload = selectedPkgIndex !== null ? { packageIndex: selectedPkgIndex } : { customAmount: parseFloat(customAmount) };

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด", { id: toastId });
        setIsProcessing(false);
        return;
      }
      if (!data.promptpayNumber) {
        toast.error("ระบบยังไม่ได้ตั้งค่าเลข PromptPay", { id: toastId });
        setIsProcessing(false);
        return;
      }

      setOrder(data);
      setStep(2);
      toast.success(data.existing ? "พบรายการที่รอชำระอยู่" : "สร้างรายการสำเร็จ", { id: toastId });
    } catch (err) {
      toast.error("เชื่อมต่อไม่ได้", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Handle Slip Upload ─────────────────────────────────────────────
  const handleSlipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));

    const toastId = toast.loading("กำลังอ่าน QR จากสลิป...");
    try {
      const imageData = await readImageAsData(file);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (!code || !code.data) {
        toast.error("ไม่พบ QR Code ในสลิป", { id: toastId });
        return;
      }
      toast.success("อ่าน QR Code สำเร็จ! กำลังตรวจสอบ...", { id: toastId });
      await verifySlip(code.data);
    } catch (err) {
      toast.error("ไม่สามารถอ่านภาพสลิปได้", { id: toastId });
    }
  };

  const readImageAsData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const verifySlip = async (slipPayload) => {
    if (!order?.orderId) return;
    setIsVerifying(true);
    try {
      const res = await fetch("/api/payments/verify-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, slipPayload }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "การตรวจสอบล้มเหลว");
        setIsVerifying(false);
        return;
      }

      if (data.status === "pending_review") {
        // Admin needs to manually approve
        toast.success(data.message || "อัปโหลดสลิปสำเร็จ! รอแอดมินตรวจสอบ", { duration: 6000 });
        setStep(3);
        setOrder(prev => ({ ...prev, pendingReview: true }));
        fetchData();
      } else {
        // SlipOK verified — instant credit
        toast.success(data.message || "เติมเงินสำเร็จ!");
        setStep(3);
        fetchData();
        refreshUser();
      }
    } catch (err) {
      toast.error("เชื่อมต่อไม่ได้");
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Handle Voucher Submit ──────────────────────────────────────────
  const handleVoucherSubmit = async () => {
    if (!voucherUrl || !voucherUrl.includes("gift.truemoney.com")) {
      toast.error("กรุณากรอกลิงก์ซองอั่งเปาให้ถูกต้อง");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("กำลังตรวจสอบซองอั่งเปา...");

    try {
      const res = await fetch("/api/payments/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: voucherUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "ไม่สามารถเติมเงินด้วยซองนี้ได้", { id: toastId });
        setIsProcessing(false);
        return;
      }

      toast.success(data.message || "เติมเงินสำเร็จ!", { id: toastId });
      setOrder({ points: data.points }); // Use order state just passing points for the success screen
      setStep(3);
      fetchData();
      refreshUser();
    } catch (err) {
      toast.error("เชื่อมต่อไม่ได้", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode || redeemCode.trim() === "") {
      toast.error("กรุณากรอกโค้ดเติมเงิน");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("กำลังตรวจสอบโค้ด...");

    try {
      const res = await fetch("/api/payments/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "โค้ดไม่ถูกต้อง", { id: toastId });
        setIsProcessing(false);
        return;
      }

      toast.success(data.message || "เติมโค้ดสำเร็จ!", { id: toastId });
      setOrder({ points: data.points }); 
      setStep(3);
      fetchData();
      refreshUser();
    } catch (err) {
      toast.error("เชื่อมต่อไม่ได้", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setOrder(null);
    setSlipFile(null);
    setSlipPreview(null);
    setIsVerifying(false);
    setVoucherUrl("");
  };

  if (loading) return <PageLoader />;

  return (
    <div className="w-full">
      <div className="pt-8 md:pt-12 pb-12 px-6 md:px-12 max-w-[1100px] mx-auto animate-fade-in">

        {/* Header */}
        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shadow-xl">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">เติมเงิน (Top Up)</h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-sm">เลือกระบบชำระเงินที่ต้องการเพื่อรับ Points</p>
          </div>
          {step > 1 && (
            <button onClick={handleReset} className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={16} /> กลับ
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Dynamic Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {step === 1 && (
              <>
                {/* Method Selection Tabs */}
                <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-2 rounded-[20px] ring-1 ring-black/5 dark:ring-white/5 flex shadow-xl">
                  <button
                    onClick={() => setPaymentMethod("promptpay")}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                      paymentMethod === "promptpay" ? "bg-[#10d97e] text-black shadow-lg" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <QrCode size={18} />
                    สแกน QR PromptPay
                  </button>
                  <button
                    onClick={() => setPaymentMethod("voucher")}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                      paymentMethod === "voucher" ? "bg-orange-500 text-white shadow-lg" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <Wallet size={18} />
                    ซองเปา
                  </button>
                  <button
                    onClick={() => setPaymentMethod("redeem_code")}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                      paymentMethod === "redeem_code" ? "bg-purple-500 text-white shadow-lg" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <Sparkles size={18} />
                    กรอกโค้ด
                  </button>
                </div>

                {/* Content based on method */}
                <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] shadow-xl ring-1 ring-black/5 dark:ring-white/5 transition-all">
                  
                  {paymentMethod === "promptpay" ? (
                    <>
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#10d97e] text-black flex items-center justify-center text-xs font-bold">1</span>
                        เลือกหรือระบุจำนวนเงิน (PromptPay)
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {TOPUP_PACKAGES.map((pkg, idx) => (
                          <div
                            key={idx}
                            onClick={() => { setSelectedPkgIndex(idx); setCustomAmount(""); }}
                            className={`relative p-5 rounded-[20px] cursor-pointer transition-all ring-2 ${selectedPkgIndex === idx ? "ring-[#10d97e] bg-[#10d97e]/5 shadow-lg shadow-[#10d97e]/10" : "ring-black/5 dark:ring-white/5 hover:ring-[#10d97e]/50 bg-black/5 dark:bg-white/5"}`}
                          >
                            {pkg.popular && <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">คุ้มที่สุด</div>}
                            {selectedPkgIndex === idx && <div className="absolute top-4 right-4 text-[#10d97e]"><CheckCircle2 size={20} /></div>}
                            <div className="font-syne text-3xl font-black text-gray-900 dark:text-[#e8ecf4] mb-1">
                              {pkg.price} <span className="text-sm text-gray-500 font-bold">THB</span>
                            </div>
                            <div className="text-[15px] font-bold text-[#10d97e]">รับ {pkg.points} Points</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">หรือ</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>

                      <div 
                        onClick={() => setSelectedPkgIndex(null)}
                        className={`p-1 rounded-[20px] ring-2 transition-all ${selectedPkgIndex === null ? "ring-[#10d97e] shadow-lg shadow-[#10d97e]/10" : "ring-black/5 dark:ring-white/5"}`}
                      >
                        <div className="bg-gray-100 dark:bg-black/20 rounded-[16px] flex items-center overflow-hidden">
                          <div className="p-4 bg-gray-200/50 dark:bg-black/20 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0">
                            <Settings2 className="w-5 h-5" />
                          </div>
                          <input 
                            type="number"
                            placeholder="ระบุจำนวนเงิน (ขั้นต่ำ 10 บาท)"
                            value={customAmount}
                            onChange={(e) => {
                              setSelectedPkgIndex(null);
                              setCustomAmount(e.target.value);
                            }}
                            className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-syne text-xl px-4 py-4 w-full"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleCreateOrder}
                        disabled={isProcessing || (selectedPkgIndex === null && !customAmount)}
                        className={`w-full py-4 mt-8 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,217,126,0.3)] ${isProcessing ? "bg-[#10d97e]/50 cursor-not-allowed" : "bg-[#10d97e] hover:brightness-110 text-white dark:text-[#0a0c0f]"}`}
                      >
                        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                        ดำเนินการรับ QR Code
                      </button>
                    </>
                  ) : paymentMethod === "voucher" ? (
                    <>
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                        กรอกลิงก์ซองอั่งเปา
                      </h3>

                      <div className="bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-500/20 p-5 rounded-xl mb-6">
                        <p className="text-sm text-orange-800 dark:text-orange-200/90 leading-relaxed font-medium">
                          1. เข้าแอป <b>TrueMoney</b> แล้วสร้างลิงก์ซองของขวัญ<br/>
                          2. กำหนด <b className="text-orange-600 dark:text-orange-400">กรอกจำนวนเงิน</b> (ขั้นต่ำ 10 บาท)<br/>
                          3. กำหนดประเภทการสุ่มเป็น <b className="text-orange-600 dark:text-orange-400">"แบ่งจำนวนเงินเท่ากัน"</b> และจำนวนคนที่รับ <b className="text-orange-600 dark:text-orange-400">"1 คน"</b><br/>
                          4. นำลิงก์ที่ได้มาวางในช่องด้านล่าง
                        </p>
                      </div>

                      <div className="mb-8 relative">
                        <input 
                          type="text"
                          placeholder="https://gift.truemoney.com/campaign/?v=..."
                          value={voucherUrl}
                          onChange={(e) => setVoucherUrl(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 rounded-xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all"
                        />
                      </div>

                      <button
                        onClick={handleVoucherSubmit}
                        disabled={isProcessing || !voucherUrl}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] ${isProcessing ? "bg-orange-500/50 cursor-not-allowed" : "bg-orange-500 hover:brightness-110 text-white"}`}
                      >
                        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isProcessing ? "กำลังตรวจสอบ..." : "ยืนยันการเติมอั่งเปา"}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-5 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                        กรอกโค้ดแลก Points
                      </h3>

                      <div className="bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-500/20 p-5 rounded-xl mb-6">
                        <p className="text-sm text-purple-800 dark:text-purple-200/90 leading-relaxed font-medium">
                          1. นำโค้ดกิจกรรม หรือ โค้ดที่ได้รับจาก Admin มากรอกที่นี่<br/>
                          2. โค้ดแต่ละอันอาจมีการจำกัดจำนวนสิทธิ์<br/>
                          3. หากพบว่ามีโค้ดที่ถูกต้อง คะแนนจะเข้าระบบทันที
                        </p>
                      </div>

                      <div className="mb-8 relative">
                        <input 
                          type="text"
                          placeholder="Ex. FREE500"
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                          className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all uppercase"
                        />
                      </div>

                      <button
                        onClick={handleRedeemCode}
                        disabled={isProcessing || !redeemCode}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] ${isProcessing ? "bg-purple-500/50 cursor-not-allowed" : "bg-purple-500 hover:brightness-110 text-white"}`}
                      >
                        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isProcessing ? "กำลังตรวจสอบ..." : "แลกโค้ดกำนัล"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {step === 2 && paymentMethod === "promptpay" && order && (
              <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] shadow-xl ring-1 ring-black/5 dark:ring-white/5">
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-6 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#10d97e] text-black flex items-center justify-center text-xs font-bold"><QrCode size={14} /></span>
                  สแกน QR เพื่อโอนเงิน
                </h3>
                <div className="flex flex-col items-center mb-8">
                  <div className="bg-white p-4 rounded-2xl shadow-lg mb-4"><canvas ref={qrCanvasRef} /></div>
                  <div className="text-center">
                    <div className="font-syne text-4xl font-black text-[#10d97e] mb-1">฿{order.amount.toFixed(2)}</div>
                    <p className="text-sm text-gray-500 dark:text-[#8892a4]">โอนเงินตามจำนวนนี้<span className="font-bold text-amber-400"> (ห้ามปัดเศษ!)</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">โอนแล้ว? อัปโหลดสลิป</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <div className="relative">
                  {slipPreview && <div className="mb-4 flex justify-center"><img src={slipPreview} alt="Slip" className="max-h-[300px] rounded-xl ring-2 ring-white/10 shadow-lg" /></div>}
                  <label className={`flex flex-col items-center justify-center w-full py-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isVerifying ? "border-blue-500/50 bg-blue-500/5" : "border-white/10 hover:border-[#10d97e]/50 hover:bg-[#10d97e]/5"}`}>
                    {isVerifying ? (
                      <><Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" /><span className="text-sm font-bold text-blue-400">กำลังตรวจสอบ...</span></>
                    ) : (
                      <><Upload className="w-10 h-10 text-gray-500 mb-3" /><span className="text-sm font-bold text-gray-400">คลิกเพื่ออัปโหลดสลิป</span></>
                    )}
                    <input type="file" accept="image/*" onChange={handleSlipUpload} disabled={isVerifying} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-8 md:p-12 rounded-[24px] shadow-xl ring-1 ring-black/5 dark:ring-white/5 text-center">
                {order?.pendingReview ? (
                  <>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-500/20 text-amber-500 animate-pulse">
                      <Clock className="w-10 h-10" />
                    </div>
                    <h2 className="font-syne text-3xl font-bold text-gray-900 dark:text-[#e8ecf4] mb-3">รอแอดมินตรวจสอบ</h2>
                    <p className="text-gray-500 dark:text-[#8892a4] mb-2">
                      สลิปของคุณถูกส่งเข้าระบบแล้ว รอแอดมินตรวจสอบยืนยัน
                    </p>
                    <p className="text-amber-500 font-bold text-sm mb-2">
                      จำนวน {order?.points || 0} Points จะเข้าระบบหลังจากตรวจสอบเสร็จ
                    </p>
                    <p className="text-xs text-gray-400">ปกติใช้เวลาไม่เกิน 5 นาที</p>
                    <button onClick={handleReset} className="px-8 py-3 font-bold rounded-xl shadow-lg transition-all mx-auto mt-8 bg-amber-500 text-white hover:brightness-110">
                      กลับหน้าเติมเงิน
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${paymentMethod === 'promptpay' ? 'bg-[#10d97e]/20 text-[#10d97e]' : paymentMethod === 'redeem_code' ? 'bg-purple-500/20 text-purple-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="font-syne text-3xl font-bold text-gray-900 dark:text-[#e8ecf4] mb-3">เติมเงินสำเร็จ!</h2>
                    <p className="text-gray-500 dark:text-[#8892a4] mb-2">
                      บัญชีคุณได้รับ <span className={`font-bold text-lg ${paymentMethod === 'promptpay' ? 'text-[#10d97e]' : paymentMethod === 'redeem_code' ? 'text-purple-500' : 'text-orange-500'}`}>{order?.points || 0} Points</span>
                    </p>
                    <button onClick={handleReset} className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all mx-auto mt-8 ${paymentMethod === 'promptpay' ? 'bg-[#10d97e] text-black hover:brightness-110' : paymentMethod === 'redeem_code' ? 'bg-purple-500 text-white hover:brightness-110' : 'bg-orange-500 text-white hover:brightness-110'}`}>
                      เติมเงินอีกครั้ง
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Transactions */}
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/5 shadow-xl flex flex-col justify-center min-h-[140px]">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">ยอดคงเหลือของคุณ</p>
              <div className="flex items-end mb-1"><h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-[#e8ecf4] tracking-tight">{user?.points || 0}</h2></div>
              <p className="text-[#10d97e] font-bold text-[14px]">Points</p>
            </div>

            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/5 shadow-xl max-h-[600px] flex flex-col overflow-hidden">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-6">ประวัติการเติมเงิน</h3>
              <div className="space-y-4 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                {transactions.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">ไม่มีประวัติ</p> : transactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-black/5 dark:bg-[#121620]/50 rounded-[16px] ring-1 ring-black/5 dark:ring-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${t.method === 'promptpay' ? 'bg-[#10d97e]' : 'bg-orange-500'}`}>
                        {t.method === 'promptpay' ? <QrCode size={18} /> : <Wallet size={18} />}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-0.5">{t.method.replace('_', ' ').toUpperCase()} ฿{Number(t.amount).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-500">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[14px] whitespace-nowrap font-bold mb-1 ${t.method === 'promptpay' ? 'text-[#10d97e]' : 'text-orange-500'}`}>+{t.points} Pts</div>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
