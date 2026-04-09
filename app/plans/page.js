"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Zap, Server, Shield, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageLoader from '@/components/ui/PageLoader';
import Modal from '@/components/ui/Modal';

export default function PlansPage() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();

  const fetchData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([fetch("/api/user"), fetch("/api/plans")]);
      if (uRes.ok) setUser(await uRes.json());
      if (pRes.ok) setPlans(await pRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const initiatePurchase = (plan) => {
    if (user?.plan?.id === plan.id) {
      return toast.error("คุณกำลังใช้แพ็กเกจนี้อยู่แล้ว");
    }
    if (user?.points < plan.pricePoints) {
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
    <div className="min-h-screen transition-colors duration-300 bg-[#f8fafc] dark:bg-[#0a0c0f]">
      <Navbar user={user} />

      <div className="pt-24 pb-16 px-6 md:px-12 max-w-[1100px] mx-auto animate-fade-in">
        {/* Header section */}
        <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shadow-sm">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">
              แพ็กเกจเน็ตเวิร์ค
            </h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">
              เลือกแพ็กเกจที่เหมาะสมกับปริมาณผู้เล่นและแบนด์วิดท์ที่คุณต้องการสำหรับการเชื่อมต่อที่เสถียรที่สุด
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="bg-gray-50 dark:bg-[#0a0c0f] border border-gray-200 dark:border-[#1e2330] rounded-xl px-5 py-2.5 text-[15px] font-bold shadow-sm flex items-center">
              ยอดคงเหลือ: <span className="text-[#10d97e] ml-2 text-lg"><span className="font-syne">{user?.points?.toLocaleString() || 0}</span> Pts</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-center">

          {plans.map((plan) => {
            const isCurrent = user?.plan?.id === plan.id;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || "[]");

            return (
              <div key={plan.id} className={`bg-white dark:bg-[#111318] rounded-2xl p-6 md:p-8 transition-all duration-300 flex flex-col relative ${plan.isPopular ? 'border-2 border-[#10d97e] transform md:-translate-y-2 shadow-xl shadow-emerald-500/10' : 'border border-gray-200 dark:border-[#1e2330] shadow-sm hover:-translate-y-1 hover:shadow-lg'}`}>
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
                <div className="flex items-baseline mb-6 border-b border-gray-100 dark:border-[#1e2330] pb-6">
                  <span className="text-4xl md:text-5xl font-extrabold text-[#10d97e]">{plan.pricePoints}</span>
                  <span className="text-gray-500 dark:text-[#8892a4] font-semibold ml-2 text-sm md:text-md">Pts / เดือน</span>
                </div>

                <ul className="mb-8 space-y-4 flex-1">
                  <li className="flex items-center text-gray-700 dark:text-[#e8ecf4] text-[14px]">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg mr-3 text-[#10d97e]"><Zap size={18} /></div>
                    <span className="font-medium">{plan.bandwidthGB} GB ทราฟฟิก</span>
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-[#e8ecf4] text-[14px]">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg mr-3 text-[#10d97e]"><Server size={18} /></div>
                    <span className="font-medium">รับได้ {plan.maxPlayers === 0 ? "ไม่จำกัด" : plan.maxPlayers} คน</span>
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-[#e8ecf4] text-[14px]">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg mr-3 text-[#10d97e]"><Shield size={18} /></div>
                    <span className="font-medium">สร้างได้ {plan.maxKeys} APIs</span>
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
                  className={`w-full py-3.5 font-bold rounded-xl transition-all ${isCurrent ? 'bg-gray-100 dark:bg-[#1e2330] text-gray-400 dark:text-[#4a5568] cursor-not-allowed' : plan.isPopular ? 'bg-[#10d97e] hover:bg-[#0ea865] text-white shadow-[#10d97e]/20 shadow-md' : 'bg-gray-100 dark:bg-[#1e2330] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-[#1e2330]'}`}
                >
                  {isCurrent ? "กำลังใช้งาน" : `เลือกแพ็กเกจ ${plan.displayName}`}
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
        confirmText={`ยืนยัน, หัก ${selectedPlan?.pricePoints} Pts`}
        onConfirm={executePurchase}
        isProcessing={isProcessing}
      >
        <p>
          คุณกำลังจะเปลี่ยนไปใช้แพ็กเกจ <span className="font-bold text-[#10d97e]">{selectedPlan?.displayName}</span>
        </p>
        <p className="mt-3 bg-gray-50 dark:bg-[#0a0c0f] border border-gray-200 dark:border-[#1e2330] rounded-xl p-3 text-sm">
          ระบบจะหัก <strong className="text-gray-900 dark:text-white">{selectedPlan?.pricePoints} Points</strong> จากกระเป๋าของคุณ
          โดยแพ็กเกจใหม่จะเริ่มนับโควต้าทันทีหลังจากทำรายการสำเร็จ
        </p>
      </Modal>

    </div>
  );
}
