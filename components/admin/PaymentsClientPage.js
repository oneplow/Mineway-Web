"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  User,
  Calendar,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import PageLoader from "@/components/ui/PageLoader";

export default function PaymentsClientPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_review"); // "pending_review" | "all"
  const [processingId, setProcessingId] = useState(null);

  const fetchPayments = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/admin/payments"
          : `/api/admin/payments?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchPayments();
  }, [fetchPayments]);

  const handleAction = async (paymentId, action) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      toast.success(data.message);
      fetchPayments();
    } catch {
      toast.error("เชื่อมต่อไม่ได้");
    } finally {
      setProcessingId(null);
    }
  };

  const statusLabel = (s) =>
    ({
      pending: "รอชำระ",
      pending_review: "รอตรวจสอบ",
      completed: "สำเร็จ",
      failed: "ล้มเหลว",
    }[s] || s);

  const statusColor = (s) =>
    ({
      pending: "text-amber-400 bg-amber-500/10",
      pending_review: "text-blue-400 bg-blue-500/10",
      completed: "text-emerald-400 bg-emerald-500/10",
      failed: "text-red-400 bg-red-500/10",
    }[s] || "text-gray-400 bg-gray-500/10");

  const pendingCount = payments.filter(
    (p) => p.status === "pending_review"
  ).length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Payment Review
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            ตรวจสอบและอนุมัติรายการเติมเงินจากผู้ใช้
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pendingCount} รอตรวจสอบ
            </div>
          )}
          <button
            onClick={() => {
              setLoading(true);
              fetchPayments();
            }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "pending_review", label: "รอตรวจสอบ" },
          { key: "completed", label: "อนุมัติแล้ว" },
          { key: "failed", label: "ปฏิเสธแล้ว" },
          { key: "all", label: "ทั้งหมด" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              filter === tab.key
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">ไม่มีรายการ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Payment info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColor(
                        p.status
                      )}`}
                    >
                      {statusLabel(p.status)}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {p.id.substring(0, 12)}...
                    </span>
                    <span className="text-xs text-gray-600">
                      {p.method === "promptpay"
                        ? "PromptPay"
                        : p.method === "voucher"
                        ? "TrueMoney"
                        : p.method}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium">
                        {p.user?.username || p.user?.email || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Banknote className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-bold text-white">
                        ฿{p.amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="font-bold">{p.points} Pts</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">
                        {new Date(p.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                {p.status === "pending_review" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(p.id, "approve")}
                      disabled={processingId === p.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold text-sm transition-all disabled:opacity-50"
                    >
                      {processingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => handleAction(p.id, "reject")}
                      disabled={processingId === p.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-bold text-sm transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
