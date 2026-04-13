"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/UserProvider';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { TOPUP_PACKAGES, PAYMENT_METHODS } from '@/lib/constants';
import toast from 'react-hot-toast';
import PageLoader from '@/components/ui/PageLoader';

function StatusBadge({ status }) {
  const cfg = {
    completed: { bg: "bg-[#10d97e]/10", text: "text-[#10d97e]", label: "สำเร็จ" },
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", label: "รอชำระ" },
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

  const [selectedMethod, setSelectedMethod] = useState("promptpay");
  const [selectedPkg, setSelectedPkg] = useState(TOPUP_PACKAGES[1]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  useEffect(() => { fetchData() }, []);

  const handleTopup = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("กำลังดำเนินการจำลองตัดบัตร...");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedPkg.price, points: selectedPkg.points + selectedPkg.bonus, method: selectedMethod })
      });
      if (res.ok) {
        toast.success("เติมเงินจำลองสำเร็จ! ได้รับยอดเงินแล้ว", { id: toastId });
        fetchData();
        refreshUser(); // sync navbar points
      } else {
        toast.error("เกิดข้อผิดพลาด", { id: toastId });
      }
    } catch (err) {
      toast.error("พบปัญหาเชื่อมต่อ", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="w-full">

      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1100px] mx-auto animate-fade-in">

        {/* Header section */}
        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shadow-xl">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">เติมเงิน (Top Up)</h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-sm">เลือกแพ็กเกจและช่องทางการเติมเงินเพื่อรับ Points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Col: Top Up Form */}
          <div className="lg:col-span-2 space-y-8">

            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] shadow-xl ring-1 ring-black/5 dark:ring-white/5">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#10d97e] text-black flex items-center justify-center text-xs font-bold">1</span>
                เลือกแพ็กเกจที่ต้องการ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TOPUP_PACKAGES.map((pkg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative p-5 rounded-[20px] cursor-pointer transition-all ring-2 ${selectedPkg === pkg ? 'ring-[#10d97e] bg-[#10d97e]/5 shadow-lg shadow-[#10d97e]/10' : 'ring-black/5 dark:ring-white/5 hover:ring-[#10d97e]/50 bg-black/5 dark:bg-white/5'}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">คุ้มที่สุด</div>
                    )}
                    {selectedPkg === pkg && (
                      <div className="absolute top-4 right-4 text-[#10d97e]"><CheckCircle2 size={20} /></div>
                    )}

                    <div className="font-syne text-3xl font-black text-gray-900 dark:text-[#e8ecf4] mb-1">
                      {pkg.price} <span className="text-sm text-gray-500 font-bold">THB</span>
                    </div>
                    <div className="text-[15px] font-bold text-[#10d97e]">
                      รับ {pkg.points} Points {pkg.bonus > 0 && <span className="text-amber-500 text-xs ml-1">(+{pkg.bonus} โบนัส)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] shadow-xl ring-1 ring-black/5 dark:ring-white/5 mt-8">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#10d97e] text-black flex items-center justify-center text-xs font-bold">2</span>
                ช่องทางการชำระเงิน
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {PAYMENT_METHODS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-4 rounded-[16px] cursor-pointer ring-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${selectedMethod === m.id ? 'ring-[#10d97e] bg-[#10d97e]/5 shadow-md shadow-[#10d97e]/10' : 'ring-black/5 dark:ring-white/5 bg-black/5 dark:bg-[#121620]/50 hover:ring-[#10d97e]/50'}`}
                  >
                    <div className="text-2xl">{m.icon}</div>
                    <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4]">{m.label}</div>
                    <div className="text-[11px] text-gray-500 dark:text-[#8892a4]">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-200 dark:ring-blue-800/30 rounded-xl p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-400 mb-8 backdrop-blur-md">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>ระบบชำระเงินอยู่ในโหมดจำลอง (Mock-up) การกดปุ่มด้านล่างจะเพิ่ม Points ทันทีโดยไม่ต้องชำระเงินจริง</p>
              </div>

              <button
                onClick={handleTopup}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,217,126,0.3)] ${isProcessing ? 'bg-[#10d97e]/50 cursor-not-allowed' : 'bg-[#10d97e] hover:brightness-110 text-white dark:text-[#0a0c0f]'}`}
              >
                {isProcessing && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isProcessing ? "กำลังดำเนินการ..." : `ยืนยันชำระ ${selectedPkg.price} บาท`}
              </button>
            </div>

          </div>

          {/* Right Col: Transactions & Balances */}
          <div className="space-y-6 md:space-y-8">

            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/5 shadow-xl flex flex-col justify-center min-h-[140px]">
              <p className="text-[11px] font-bold text-gray-500 dark:text-[#8892a4] uppercase tracking-widest mb-3">ยอดคงเหลือของคุณ</p>
              <div className="flex items-end mb-1">
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-[#e8ecf4] mr-2 tracking-tight">{user?.points || 0}</h2>
              </div>
              <p className="text-[#10d97e] font-bold text-[14px]">ยอดเงินสะสม (Points)</p>
            </div>

            <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl p-6 md:p-8 rounded-[24px] ring-1 ring-black/5 dark:ring-white/5 shadow-xl overflow-hidden flex flex-col max-h-[600px]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#e8ecf4]">ประวัติการทำรายการ</h3>
              </div>

              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {transactions.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-4">ยังไม่มีประวัติการเติมเงิน</div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-4 bg-black/5 dark:bg-[#121620]/50 rounded-[16px] ring-1 ring-black/5 dark:ring-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center text-[#10d97e]">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-gray-900 dark:text-[#e8ecf4] mb-0.5">{t.method.toUpperCase()}</div>
                          <div className="text-[11px] text-gray-500 dark:text-[#8892a4]">{new Date(t.createdAt).toLocaleDateString("th-TH")}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-bold text-[#10d97e] mb-1">+{t.points} Pts</div>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
