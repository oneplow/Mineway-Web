"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/UserProvider';
import { Zap, Server, Shield, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import PageLoader from '@/components/ui/PageLoader';
import Modal from '@/components/ui/Modal';

export default function PlansPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useUser();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    let shouldRedirect = false;
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/user?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/plans?t=" + Date.now(), { cache: "no-store" })
      ]);
      if (uRes.status === 401 || uRes.status === 404) {
        shouldRedirect = true;
        await signOut({ callbackUrl: "/auth/login", redirect: true });
        return;
      }
      if (uRes.ok) setUser(await uRes.json());
      if (pRes.ok) setPlans(await pRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      if (!shouldRedirect) setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const initiatePurchase = (plan) => {
    if (user?.plan?.id === plan.id) {
      return toast.error("คุณกำลังใช้แพ็กเกจนี้อยู่แล้ว");
    }
    if (plan.pricePoints > 0 && user?.points < plan.pricePoints) {
      toast.error("ยอดเงินไม่เพียงพอ กำลังพาไปหน้าเติมเงิน...");
      setTimeout(() => router.push("/payments"), 2000);
      return;
    }

    setSelectedPlan(plan);
    setConfirmModalOpen(true);
  };

  const executePurchase = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("เปลี่ยนแพ็กเกจสำเร็จ!");
        setConfirmModalOpen(false);
        fetchData();
        refreshUser(); // sync navbar points & plan
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("พบปัญหาการเชื่อมต่อเครือข่าย");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="w-full">

      <div className="pt-8 md:pt-12 pb-16 px-6 md:px-12 max-w-[1100px] mx-auto animate-fade-in">
        {/* Header section */}
        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shadow-xl">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">
              แพ็กเกจเน็ตเวิร์ค
            </h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">
              เลือกแพ็กเกจที่เหมาะสมกับปริมาณผู้เล่นและแบนด์วิดท์ที่คุณต้องการสำหรับการเชื่อมต่อที่เสถียรที่สุด
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/5 rounded-[12px] px-5 py-2.5 text-[15px] font-bold shadow-sm flex items-center">
              ยอดคงเหลือ: <span className="text-[#10d97e] ml-2 text-lg"><span className="font-syne">{user?.points?.toLocaleString() || 0}</span> Pts</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-center">

          {plans.map((plan) => {
            const isCurrent = user?.plan?.id === plan.id;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || "[]");

            return (
              <div key={plan.id} className={`bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl rounded-[24px] p-6 md:p-8 transition-all duration-300 flex flex-col relative ${plan.isPopular ? 'ring-2 ring-[#10d97e] transform md:-translate-y-2 shadow-2xl shadow-[#10d97e]/20' : 'ring-1 ring-black/5 dark:ring-white/5 shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:ring-black/10 dark:hover:ring-white/10'}`}>
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-[#10d97e] text-white text-[11px] font-black px-4 py-1.5 rounded-bl-xl rounded-tr-[14px] uppercase tracking-widest shadow-sm">
                    นิยมสุด
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1">
                    <CheckCircle2 size={12} /> แพ็กเกจปัจจุบัน
                  </div>
                )}

                <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-[#e8ecf4]">{plan.displayName}</h3>
                <div className="flex items-baseline mb-6 border-b border-black/5 dark:border-white/5 pb-6">
                  {plan.pricePoints === 0 ? (
                    <>
                      <span className="text-4xl md:text-5xl font-extrabold text-[#10d97e]">ฟรี</span>
                      <span className="text-gray-500 dark:text-[#8892a4] font-semibold ml-2 text-sm md:text-md">ไม่มีค่าใช้จ่าย</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl md:text-5xl font-extrabold text-[#10d97e]">{plan.pricePoints}</span>
                      <span className="text-gray-500 dark:text-[#8892a4] font-semibold ml-2 text-sm md:text-md">Pts / เดือน</span>
                    </>
                  )}
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  <li className="flex items-center text-gray-700 dark:text-[#e8ecf4] text-[14px]">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg mr-3 text-[#10d97e]"><Zap size={18} /></div>
                    <span className="font-medium">{plan.bandwidthGB} GB ทราฟฟิก</span>
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-[#e8ecf4] text-[14px]">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg mr-3 text-[#10d97e]"><Shield size={18} /></div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        สร้างได้ {isCurrent ? (plan.maxKeys + (user?.extraKeys || 0)) : plan.maxKeys} APIs
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-[#4a5568]">
                        {isCurrent && (user?.extraKeys || 0) > 0 ? `(รวมช่องเสริม ${user.extraKeys} ช่อง)` : "(สามารถซื้อช่องเพิ่มได้ภายหลัง)"}
                      </span>
                    </div>
                  </li>
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center text-gray-500 dark:text-[#8892a4] text-[13px] ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mr-3"></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => initiatePurchase(plan)}
                  disabled={isCurrent}
                  className={`w-full py-3.5 font-bold rounded-xl transition-all ${isCurrent ? 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-[#4a5568] cursor-not-allowed' : plan.isPopular ? 'bg-[#10d97e] hover:bg-[#0ea865] text-white shadow-[#10d97e]/20 shadow-md' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/5'}`}
                >
                  {isCurrent ? "กำลังใช้งาน" : plan.pricePoints === 0 ? "เริ่มต้นฟรี" : `เลือกแพ็กเกจ ${plan.displayName}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="ขอยืนยันการสั่งซื้อแพ็กเกจ"
        confirmText={selectedPlan?.pricePoints === 0 ? "เปิดใช้งานฟรี" : `ยืนยัน, หัก ${selectedPlan?.pricePoints} Pts`}
        onConfirm={executePurchase}
        isProcessing={isProcessing}
      >
        <p>
          คุณกำลังจะเปลี่ยนไปใช้แพ็กเกจ <span className="font-bold text-[#10d97e]">{selectedPlan?.displayName}</span>
        </p>
        <p className="mt-3 bg-gray-50 dark:bg-[#0a0c0f] border border-gray-200 dark:border-[#1e2330] rounded-xl p-3 text-sm">
          {selectedPlan?.pricePoints === 0 ? (
            <>แพ็กเกจนี้ <strong className="text-[#10d97e]">ไม่มีค่าใช้จ่าย</strong> โควต้าจะเริ่มนับทันทีหลังเปิดใช้งาน</>
          ) : (
            <>ระบบจะหัก <strong className="text-gray-900 dark:text-white">{selectedPlan?.pricePoints} Points</strong> จากกระเป๋าของคุณ
              โดยแพ็กเกจใหม่จะเริ่มนับโควต้าทันทีหลังจากทำรายการสำเร็จ</>
          )}
        </p>
        <p className="mt-2 text-[10px] text-blue-500 font-bold px-1">
          * ช่องเสริม (Extra Slots) ที่คุณซื้อไปแล้วจะยังคงอยู่ถาวร และจะถูกบวกเพิ่มจากสิทธิ์ของแพ็กเกจใหม่โดยอัตโนมัติ
        </p>
      </Modal>

    </div>
  );
}
