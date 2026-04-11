"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserProvider";
import { Key, Activity, Copy, Plus, Globe, ShieldCheck, ChevronDown, CheckCircle2, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { REGIONS } from "@/lib/constants";
import toast from "react-hot-toast";
import PageLoader from "@/components/ui/PageLoader";
import Modal from "@/components/ui/Modal";
import KeyDetailsDrawer from "@/components/ui/KeyDetailsDrawer";
import { useRouter } from "next/navigation";

function StatusBadge({ status }) {
  const cfg = {
    active: { base: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#10d97e]", dot: "bg-emerald-500 dark:bg-[#10d97e]", label: "ONLINE" },
    inactive: { base: "bg-gray-100 dark:bg-[#1e2330] text-gray-500 dark:text-[#8892a4]", dot: "bg-gray-400 dark:bg-[#4a5568]", label: "OFFLINE" },
    suspended: { base: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-[#ff4d4d]", dot: "bg-red-500 dark:bg-[#ff4d4d]", label: "SUSPENDED" },
  }[status] || { base: "bg-gray-100 dark:bg-[#1e2330] text-gray-500", dot: "bg-gray-400", label: status?.toUpperCase() };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${cfg.base}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function OverviewPage() {
  const [user, setUser] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshUser } = useUser();

  const [selectedKeyForDrawer, setSelectedKeyForDrawer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", region: "ap-southeast-1" });
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [noPlanModalOpen, setNoPlanModalOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, keysRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/keys")
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (keysRes.ok) setKeys(await keysRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const attemptCreate = () => {
    if (!user?.plan) {
      setNoPlanModalOpen(true);
      return;
    }
    setShowCreate(!showCreate);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("กรุณาใส่ชื่อ key");
    setCreating(true);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาดในการสร้าง");
      } else {
        setNewKeyValue(data.keyValue);
        setForm({ name: "", region: "ap-southeast-1" });
        setShowCreate(false);
        toast.success("สร้าง API key สำเร็จ!");
        fetchData(); // Refresh list & stats
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (key) => {
    setKeyToDelete(key);
    setDeleteModalOpen(true);
  };

  const handleCopy = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS (dev environment)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("คัดลอก API Key แล้ว");
    } catch (err) {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  };

  const executeDelete = async () => {
    if (!keyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/keys/${keyToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบ API key เรียบร้อยแล้ว");
        setDeleteModalOpen(false);
        setSelectedKeyForDrawer(null);
        fetchData();
      } else {
        toast.error("เกิดข้อผิดพลาด ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("ข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    } finally {
      setIsDeleting(false);
      setKeyToDelete(null);
    }
  };

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [keyToReset, setKeyToReset] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const confirmReset = (key) => {
    setKeyToReset(key);
    setResetModalOpen(true);
  };

  const executeReset = async () => {
    if (!keyToReset) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/keys/${keyToReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("ระบบได้สร้าง API Key ใหม่แทนที่ตัวเดิมแล้ว");
        setResetModalOpen(false);
        setSelectedKeyForDrawer(null); // Close drawer to show modal clearly
        setNewKeyValue(data.keyValue); // Trigger the green success modal!
        fetchData();
      } else {
        toast.error(data.error || "ขออภัย ไม่สามารถรีเซ็ต Key ได้");
      }
    } catch (err) {
      console.error(err);
      toast.error("เครือข่ายขัดข้อง กรุณาลองใหม่");
    } finally {
      setIsResetting(false);
      setKeyToReset(null);
    }
  };

  const handleToggle = async (key) => {
    const newStatus = key.status === "active" ? "inactive" : "active";
    const toastId = toast.loading(`กำลังเปลี่ยนสถานะเป็น ${newStatus}...`);
    try {
      const res = await fetch(`/api/keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`อัปเดตเป็น ${newStatus} แล้ว`, { id: toastId });

        // Update local state smoothly without full reload if possible, but fetchData is safer
        if (selectedKeyForDrawer && selectedKeyForDrawer.id === key.id) {
          setSelectedKeyForDrawer({ ...selectedKeyForDrawer, status: newStatus });
        }
        fetchData();
      } else {
        toast.error("อัปเดตสถานะไม่สำเร็จ", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("เครือข่ายขัดข้อง", { id: toastId });
    }
  };

  if (loading) return <PageLoader />;

  const atLimit = keys.length >= (user?.stats?.maxKeys || user?.plan?.maxKeys || 1);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] dark:from-[#050505] dark:to-[#0a0c10]">

      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1100px] mx-auto space-y-8 animate-fade-in">

        {/* Header section */}
        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-xl">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">
              ภาพรวม (Overview)
            </h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">จัดการที่ตั้งการเชื่อมต่อ, API keys, และตรวจสอบทราฟฟิกของคุณ</p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col md:flex-row md:items-center gap-4 md:space-x-6">
            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-[#4a5568] font-bold mb-1">แพ็กเกจปัจจุบัน</p>
              <p className="font-syne font-bold text-lg text-[#10d97e]">{user?.plan?.displayName || "ไม่มีแพ็กเกจ"} {user?.plan?.bandwidthGB ? `- ${user.plan.bandwidthGB}GB/mo` : ""}</p>
            </div>
            <button
              onClick={attemptCreate}
              disabled={atLimit && !showCreate}
              className={`flex items-center px-5 py-2.5 font-semibold rounded-xl transition-all ${atLimit && !showCreate ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-[#1e2330] dark:text-[#4a5568]' : 'bg-[#10d97e] hover:brightness-110 text-white dark:text-[#0a0c0f]'}`}
            >
              <Plus size={18} className="mr-2" /> สร้าง Key ใหม่
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 p-6 rounded-[20px] relative overflow-hidden group hover:ring-black/10 dark:hover:ring-[#10d97e]/30 transition-all duration-300 shadow-lg">
            <div className="absolute -top-4 -right-4 p-8 bg-[#10d97e]/5 rounded-full">
              <Activity size={48} className="text-[#10d97e]/40" />
            </div>
            <p className="text-gray-500 dark:text-[#8892a4] font-bold uppercase text-xs tracking-wider mb-2">Traffic Used</p>
            <div className="flex items-baseline mb-4 font-syne">
              <h2 className="text-5xl font-extrabold mr-2 text-gray-900 dark:text-[#e8ecf4]">{user?.stats?.totalTrafficGB || 0}</h2>
              <span className="text-gray-500 font-semibold">GB</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-[#0a0c0f] rounded-full h-2.5 overflow-hidden">
              <div className="bg-[#10d97e] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(((user?.stats?.totalTrafficGB || 0) / (user?.plan?.bandwidthGB || 1)) * 100, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#4a5568] mt-3 font-medium">
              {((user?.stats?.totalTrafficGB || 0) / (user?.plan?.bandwidthGB || 1) * 100).toFixed(1)}% of {user?.plan?.bandwidthGB || 0} GB limit
            </p>
          </div>

          <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 p-6 rounded-[20px] relative overflow-hidden group hover:ring-black/10 dark:hover:ring-[#10d97e]/30 transition-all duration-300 shadow-lg">
            <div className="absolute -top-4 -right-4 p-8 bg-blue-500/5 rounded-full">
              <Key size={48} className="text-blue-500/40" />
            </div>
            <p className="text-gray-500 dark:text-[#8892a4] font-bold uppercase text-xs tracking-wider mb-2">Active Keys</p>
            <div className="flex items-baseline mt-4 font-syne">
              <h2 className="text-5xl font-extrabold mr-2 text-gray-900 dark:text-[#e8ecf4]">{user?.stats?.totalKeys || 0}</h2>
              <span className="text-gray-400 dark:text-[#4a5568] font-bold text-xl">/ {user?.plan?.maxKeys || 0}</span>
            </div>
          </div>

          <div className="bg-[#10d97e]/[0.02] dark:bg-[#10d97e]/5 backdrop-blur-xl ring-1 ring-[#10d97e]/30 p-6 rounded-[20px] relative overflow-hidden flex flex-col justify-between group shadow-lg">
            <div className="absolute -top-4 -right-4 p-8 bg-[#10d97e]/10 rounded-full">
              <ShieldCheck size={48} className="text-[#10d97e]/40" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-[#8892a4] font-bold uppercase text-xs tracking-wider mb-2">Plan Status</p>
              <h2 className="font-syne text-3xl font-extrabold text-[#10d97e] mt-4">{user?.plan ? "Active" : "None"}</h2>
            </div>
            {user?.plan && (
              <div className="flex items-center text-sm text-gray-700 dark:text-[#e8ecf4] mt-4 font-medium bg-[#10d97e]/10 dark:bg-black/20 py-2 px-3 rounded-lg w-fit border border-[#10d97e]/20">
                <span className="w-2 h-2 rounded-full bg-[#10d97e] mr-2 shadow-[0_0_8px_#10d97e]"></span>
                ระบบพร้อมใช้งาน
              </div>
            )}
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] shadow-xl">
          <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
            <h3 className="font-syne text-xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4]">Your API Keys</h3>
          </div>

          {keys.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-[#4a5568]">
              ยังไม่มี API Key คุณสามารถสร้างใหม่ได้ที่ปุ่ม "สร้าง Key ใหม่"
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/5 dark:bg-[#121620]/50 border-b border-black/5 dark:border-white/5 text-gray-500 dark:text-[#8892a4] text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-5">Name / Tunnel</th>
                    <th className="p-5">Address</th>
                    <th className="p-5">Region</th>
                    <th className="p-5">Traffic</th>
                    <th className="p-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[13px] font-medium text-gray-700 dark:text-[#e8ecf4]">

                  {keys.map(k => {
                    const regionObj = REGIONS.find(r => r.value === k.region) || REGIONS[0];
                    const rxGB = (k.rxBytes / (1024 * 1024 * 1024)).toFixed(2);
                    const txGB = (k.txBytes / (1024 * 1024 * 1024)).toFixed(2);

                    return (
                      <tr key={k.id} className="transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setSelectedKeyForDrawer(k)}>
                        <td className="p-5 font-bold text-gray-900 dark:text-[#e8ecf4]">{k.name}</td>
                        <td className="p-5">
                          <div className="flex items-center space-x-3 w-fit">
                            <span className="font-mono tracking-wider">
                              {k.assignedPort ? (
                                <>
                                  <span className="text-gray-400 dark:text-[#8892a4]">play.lexten.store</span>
                                  <span className="text-[#10d97e]">:{k.assignedPort}</span>
                                </>
                              ) : (
                                <span className="text-gray-400 dark:text-[#8892a4]">—</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center text-gray-600 dark:text-[#8892a4]">
                            <span className="mr-1.5">{regionObj.flag}</span> {regionObj.label}
                          </div>
                        </td>
                        <td className="p-5 font-mono text-[12px]">
                          <span className="text-[#10d97e]">{rxGB}</span> <span className="text-gray-300 dark:text-[#4a5568]">/</span> <span className="text-blue-500">{txGB} GB</span>
                        </td>
                        <td className="p-5"><StatusBadge status={k.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <KeyDetailsDrawer
        isOpen={!!selectedKeyForDrawer}
        onClose={() => setSelectedKeyForDrawer(null)}
        apiKey={selectedKeyForDrawer}
        onCopy={handleCopy}
        onToggle={handleToggle}
        onDeleteRequest={confirmDelete}
        onResetRequest={confirmReset}
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="ยกเลิกการใช้งาน (Delete)"
        subtitle={<>เซิร์ฟเวอร์เป้าหมาย: <span className="text-emerald-400 font-bold">{keyToDelete?.name}</span></>}
        confirmText="ยืนยันการลบถาวร"
        onConfirm={executeDelete}
        isDestructive={true}
        isProcessing={isDeleting}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">ยืนยันลบ Tunnel ถาวร?</p>
            <p className="text-sm text-gray-500 mt-2">การดำเนินการนี้ไม่สามารถย้อนกลับได้ พอร์ตเชื่อมต่อปัจจุบันจะถูกนำเข้าสู่ระบบสุ่ม</p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="ตั้งค่ากุญแจใหม่ (Reset)"
        subtitle={<>เซิร์ฟเวอร์เป้าหมาย: <span className="text-emerald-400 font-bold">{keyToReset?.name}</span></>}
        confirmText="ยืนยันการเปลี่ยนกุญแจ"
        onConfirm={executeReset}
        isProcessing={isResetting}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">สร้างกุญแจชุดใหม่แทนที่อันเดิม</p>
            <p className="text-sm text-gray-500 mt-2">คำเตือน: กุญแจเดิมในปลั๊กอินจะใช้งานไม่ได้ทันที เซิร์ฟเวอร์ในเกมจะหลุดการเชื่อมต่อจนกว่าคุณจะนำกุญแจชุดใหม่ไปใส่แทน</p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={noPlanModalOpen}
        onClose={() => setNoPlanModalOpen(false)}
        title="จำเป็นต้องมีแพ็กเกจ"
        subtitle="ระบบตรวจพบว่าคุณไม่มีแพ็กเกจรองรับ"
        confirmText="ดูแพ็กเกจ"
        onConfirm={() => router.push("/plans")}
      >
        <p>คุณยังไม่มีแพ็กเกจเน็ตเวิร์คที่ใช้งานได้ กรุณา <strong>เลือกแพ็กเกจขั้นต่ำ 1 แผน</strong> ก่อนเพื่อรับสิทธิ์ในการสร้าง API Key และใช้งาน Tunnel</p>
      </Modal>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="สร้าง API Key ใหม่"
        subtitle="เพิ่มพอร์ตเซิร์ฟเวอร์ใหม่เข้าสู่จุดเชื่อมต่อพรีเมียม"
        confirmText={creating ? "กำลังสร้าง..." : "ยืนยันการสร้าง"}
        onConfirm={handleCreate}
        isProcessing={creating}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">ชื่อ Tunnel / เซิร์ฟเวอร์</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black tracking-widest text-sm">SRV</span>
              <input placeholder="เช่น Survival Main" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl pl-[68px] pr-4 py-4 text-gray-900 dark:text-white text-xl font-black outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner transition-all" />
            </div>
          </div>
          {/* 
            TODO: Uncomment this block when Multi-Region support is fully implemented on the backend 
          */}
          <div className="relative hidden">
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">ภูมิภาค (Region)</label>
            <div
              onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
              className="w-full bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-4 text-gray-900 dark:text-white text-xl font-black outline-none cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 shadow-inner transition-all flex items-center justify-between"
            >
              <span>
                {REGIONS.find(r => r.value === form.region)?.flag} {REGIONS.find(r => r.value === form.region)?.label} <span className="text-gray-500 dark:text-[#4a5568] ml-1">({REGIONS.find(r => r.value === form.region)?.ping})</span>
              </span>
              <ChevronDown size={18} className={`text-gray-500 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {regionDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[105]" onClick={() => setRegionDropdownOpen(false)}></div>
                <div className="absolute top-[105%] left-0 right-0 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-xl shadow-xl z-[110] overflow-hidden animate-fade-in py-1">
                  {REGIONS.map(r => (
                    <div
                      key={r.value}
                      onClick={() => { setForm({ ...form, region: r.value }); setRegionDropdownOpen(false); }}
                      className={`px-4 py-3 cursor-pointer text-[14px] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors ${form.region === r.value ? 'bg-[#10d97e]/10 text-[#10d97e] font-bold' : 'text-gray-700 dark:text-[#8892a4]'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{r.flag}</span>
                        <span>{r.label}</span>
                        <span className="text-[12px] text-gray-400 dark:text-[#4a5568]">({r.ping})</span>
                      </span>
                      {form.region === r.value && <CheckCircle2 size={16} className="text-[#10d97e]" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!newKeyValue}
        onClose={() => setNewKeyValue(null)}
        title={
          <div className="flex items-center gap-2 text-emerald-600 dark:text-[#10d97e]">
            <CheckCircle2 size={24} />
            <span>สร้าง API Key สำเร็จ</span>
          </div>
        }
        confirmText="คัดลอก & ปิด"
        onConfirm={() => { handleCopy(newKeyValue); setNewKeyValue(null); }}
        cancelText="ปิด"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-[13px] font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            กุญแจนี้จะแสดงครั้งเดียวเท่านั้น กรุณาคัดลอกและบันทึกไว้ในที่ปลอดภัย
          </div>
          <div className="flex items-center bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-inner">
            <code className="font-mono text-lg font-bold text-gray-900 dark:text-emerald-400 flex-1 break-all select-all">{newKeyValue}</code>
          </div>
        </div>
      </Modal>
    </div>
  );
}
