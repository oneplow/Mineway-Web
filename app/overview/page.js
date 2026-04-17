"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserProvider";
import { Key, Activity, Copy, Plus, Globe, ShieldCheck, ChevronDown, CheckCircle2, AlertCircle, Trash2, RefreshCw, Server, Lock, Users, ShoppingCart } from "lucide-react";
import { REGIONS } from "@/lib/constants";
import toast from "react-hot-toast";
import PageLoader from "@/components/ui/PageLoader";
import Modal from "@/components/ui/Modal";
import KeyDetailsDrawer from "@/components/ui/KeyDetailsDrawer";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { useSession, signOut } from "next-auth/react";

function StatusBadge({ status, connectionInfo }) {
  if (status === "suspended") {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-[#ff4d4d]"><span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-[#ff4d4d]" />SUSPENDED</span>;
  }

  if (connectionInfo === undefined) {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-blue-50 dark:bg-[#1e2330] text-blue-500 dark:text-[#8892a4]"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-[#4a5568] animate-pulse" />CHECKING...</span>;
  }

  if (!connectionInfo?.connected) {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-gray-100 dark:bg-[#1e2330] text-gray-500 dark:text-[#8892a4]"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-[#4a5568]" />DISCONNECTED</span>;
  }

  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#10d97e]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#10d97e] animate-pulse" />CONNECTED</span>;
}

function PingBadge({ ping }) {
  if (ping === undefined) return <span className="text-[10px] text-gray-500 min-w-[50px] text-right">pinging...</span>;
  if (ping === -1) return <span className="text-[10px] text-red-500 font-bold min-w-[50px] text-right">Disconnected</span>;
  
  let colorClass = "text-emerald-500";
  let dotClass = "bg-emerald-500";
  if (ping > 150) {
    colorClass = "text-red-500";
    dotClass = "bg-red-500";
  } else if (ping > 50) {
    colorClass = "text-amber-500";
    dotClass = "bg-amber-500";
  }

  return (
    <span className={`flex items-center justify-end gap-1 text-[11px] font-bold ${colorClass} min-w-[50px]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
      {ping}ms
    </span>
  );
}

export default function OverviewPage() {
  const [user, setUser] = useState(null);
  const [keys, setKeys] = useState([]);
  const [sharedKeys, setSharedKeys] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refreshUser } = useUser();
  const settings = useSettings();

  const [selectedKeyForDrawer, setSelectedKeyForDrawer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    region: "ap-southeast-1",
    domainId: "",
    isCustomPort: false
  });
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [noPlanModalOpen, setNoPlanModalOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  // Ping Measurement State
  const [pingResults, setPingResults] = useState({});
  const [isPinging, setIsPinging] = useState(false);

  // Connection Status State (from tunnel server)
  const [connectionStatus, setConnectionStatus] = useState({});

  const measurePings = async (domainsToPing) => {
    if (!domainsToPing || domainsToPing.length === 0) return;
    setIsPinging(true);
    const results = { ...pingResults };
    
    // We will ping concurrently to save time
    const pingPromises = domainsToPing.map(async (d) => {
      const start = performance.now();
      try {
        // Use no-cors to prevent CORS issues, signal for timeout
        const res = await fetch(`https://tunnel.${d.domain}/health`, {
          mode: 'no-cors',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000)
        });
        results[d.id] = Math.round(performance.now() - start);
      } catch (err) {
        results[d.id] = -1; // -1 indicates offline/timeout
      }
    });

    await Promise.all(pingPromises);
    setPingResults(results);
    setIsPinging(false);
  };

  // Buy extra key slot
  const [buySlotModalOpen, setBuySlotModalOpen] = useState(false);
  const [isBuyingSlot, setIsBuyingSlot] = useState(false);
  const extraKeyPrice = parseInt(settings?.extraKeyPrice) || 200;

  const fetchData = async () => {
    let shouldRedirect = false;
    try {
      const [userRes, keysRes, domainsRes] = await Promise.all([
        fetch("/api/user?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/keys?t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/domains?t=" + Date.now(), { cache: "no-store" })
      ]);

      if (userRes.status === 401 || userRes.status === 404) {
        shouldRedirect = true;
        await signOut({ callbackUrl: "/auth/login", redirect: true });
        return;
      }

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u);
      }
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data.keys || []);
        setSharedKeys(data.sharedKeys || []);
      }
      if (domainsRes.ok) {
        const d = await domainsRes.json();
        setDomains(d);
        if (d.length > 0) {
          const defaultDomain = d.find(dm => dm.isDefault) || d[0];
          setForm(prev => ({ ...prev, domainId: defaultDomain.id }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("ดึงข้อมูลหลักล้มเหลว");
    } finally {
      if (!shouldRedirect) setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch("/api/keys/connection-status?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data.connections || {});
      }
    } catch (err) {
      console.error("Failed to fetch connection status:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll connection status every 15 seconds
  useEffect(() => {
    if (!loading && keys.length > 0) {
      fetchConnectionStatus();
      const interval = setInterval(fetchConnectionStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [loading, keys.length]);

  const attemptCreate = () => {
    if (!user?.plan) {
      setNoPlanModalOpen(true);
      return;
    }
    if (!showCreate) {
      measurePings(domains); // Start pinging when modal opens
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
        const defaultDomain = domains.find(dm => dm.isDefault) || domains[0];
        setForm({ name: "", region: "ap-southeast-1", domainId: defaultDomain?.id || "", isCustomPort: false });
        setShowCreate(false);
        toast.success("สร้าง API key สำเร็จ!");
        fetchData(); // Refresh list & stats
        refreshUser(); // sync global user context (navbar points)
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
        setSelectedKeyForDrawer(null);
        setNewKeyValue(data.keyValue);
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

  const handleBuySlot = async () => {
    setIsBuyingSlot(true);
    try {
      const res = await fetch("/api/keys/buy-slot", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ซื้อช่อง Key เพิ่มสำเร็จ! (เหลือ ${data.points} Points)`);
        setBuySlotModalOpen(false);
        fetchData();
        refreshUser();
      } else {
        toast.error(data.error || "ซื้อช่องเพิ่มไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("เครือข่ายขัดข้อง กรุณาลองใหม่");
    } finally {
      setIsBuyingSlot(false);
    }
  };

  if (loading) return <PageLoader />;

  const totalMaxKeys = user?.stats?.maxKeys || (user?.plan?.maxKeys || 1) + (user?.extraKeys || 0);
  const atLimit = keys.length >= totalMaxKeys;
  const domainPreview = `${form.name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.${domains.find(d => d.id === form.domainId)?.domain || '???'}`;

  return (
    <div className="w-full">

      <div className="pt-8 md:pt-12 pb-12 px-6 md:px-12 max-w-[1100px] mx-auto space-y-8 animate-fade-in">

        {/* Dashboard Announcement Banner */}
        {settings.dashboardAnnouncement && (
          <div className="bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{settings.dashboardAnnouncement}</p>
          </div>
        )}

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
              <span className="text-gray-400 dark:text-[#4a5568] font-bold text-xl">/ {totalMaxKeys}</span>
            </div>
            {(user?.extraKeys || 0) > 0 && (
              <p className="text-[11px] text-blue-400 mt-1 font-semibold">+{user.extraKeys} ช่องเสริม</p>
            )}
            <button
              onClick={() => setBuySlotModalOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-blue-500 hover:text-blue-400 transition-colors group/buy"
            >
              <ShoppingCart size={13} className="group-hover/buy:scale-110 transition-transform" />
              ซื้อช่องเพิ่ม ({extraKeyPrice} Points)
            </button>
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

        <div className="bg-white/70 dark:bg-[#0a0c10]/90 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 rounded-[24px] shadow-xl p-6 md:p-8">
          <h3 className="font-syne text-xl font-bold tracking-tight text-gray-900 dark:text-[#e8ecf4] mb-6">Your API Keys</h3>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#111318] rounded-2xl border border-dashed border-gray-300 dark:border-[#1e2330]">
              <Server size={32} className="text-gray-400 dark:text-[#4a5568] mb-3" />
              <p className="text-[14px] font-bold text-gray-900 dark:text-[#e8ecf4]">ยังไม่ได้สร้าง Tunnel</p>
              <p className="text-[12px] text-gray-500 dark:text-[#8892a4] mt-1 max-w-sm font-medium">กดปุ่มสร้าง Tunnel ด้านบนเพื่อเริ่มต้นเชื่อมต่อเซิร์ฟเวอร์ Minecraft ของคุณออกสู่โลกกว้าง</p>
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
                              {(k.assignedPort || connectionStatus[k.id]?.assignedPort) ? (
                                <>
                                  <span className="text-gray-400 dark:text-[#8892a4]">{k.subdomain || "mineway.cloud"}</span>
                                  {!k.isCustomPort && <span className="text-[#10d97e]">:{k.assignedPort || connectionStatus[k.id]?.assignedPort}</span>}
                                </>
                              ) : (
                                <span className="text-amber-500/70 dark:text-amber-400/60 text-[11px] font-bold">⏳ รอเชื่อมต่อปลั๊กอิน</span>
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
                        <td className="p-5"><StatusBadge status={k.status} connectionInfo={connectionStatus[k.id]} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sharedKeys?.length > 0 && (
            <div className="mt-8 relative">
              <div className="absolute -inset-x-6 inset-y-0 bg-[#0a0c0f]/50 border-y border-white/5 pointer-events-none"></div>
              <div className="relative py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-indigo-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-[#e8ecf4]">Shared with Me <span className="text-[11px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-2 font-mono">TEAM</span></h3>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[13px] font-medium text-gray-700 dark:text-[#e8ecf4]">
                      {sharedKeys.map(k => (
                        <tr key={k.id} className="transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setSelectedKeyForDrawer(k)}>
                          <td className="p-5 font-bold text-gray-900 dark:text-[#e8ecf4]">{k.name}</td>
                          <td className="p-5 text-gray-400">Shared Tunnel</td>
                          <td className="p-5"><StatusBadge status={k.status} connectionInfo={connectionStatus[k.id]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
        connectionInfo={selectedKeyForDrawer ? connectionStatus[selectedKeyForDrawer.id] : undefined}
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
        confirmText="ดูแพ็กเกจ (มีแพ็กเกจฟรี!)"
        onConfirm={() => router.push("/plans")}
      >
        <p>คุณยังไม่มีแพ็กเกจเน็ตเวิร์คที่ใช้งานได้ กรุณา <strong>เลือกแพ็กเกจขั้นต่ำ 1 แผน</strong> ก่อนเพื่อรับสิทธิ์ในการสร้าง API Key และใช้งาน Tunnel</p>
        <p className="mt-2 text-[12px] text-emerald-500 font-bold">💡 เรามีแพ็กเกจ Free Trial ให้ทดลองใช้ฟรีโดยไม่ต้องเติมเงิน!</p>
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
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">ชื่อ Tunnel / เซิร์ฟเวอร์</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-extrabold tracking-widest text-[12px]">SRV</span>
              <input placeholder="เช่น my-survival" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl pl-[60px] pr-4 py-3 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 shadow-inner transition-all" />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 px-1">ภาษาอังกฤษ ตัวเลข และ - เท่านั้น (3-32 ตัวอักษร)</p>
          </div>

          {domains.length > 0 && (
            <div className="relative">
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">โดเมนสำหรับเชื่อมต่อ</label>
              <div
                onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                className="w-full bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm font-bold outline-none cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 shadow-inner transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  <span>{domains.find(d => d.id === form.domainId)?.domain || "เลือกโดเมน"}</span>
                  {domains.find(d => d.id === form.domainId)?.isDefault && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">Default</span>
                  )}
                  <PingBadge ping={pingResults[form.domainId]} />
                </span>
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${domainDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {domainDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[105]" onClick={() => setDomainDropdownOpen(false)}></div>
                  <div className="absolute top-[105%] left-0 right-0 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-xl shadow-xl z-[110] overflow-hidden animate-fade-in py-1">
                    {domains.map(d => (
                      <div
                        key={d.id}
                        onClick={() => { setForm({ ...form, domainId: d.id }); setDomainDropdownOpen(false); }}
                        className={`px-4 py-3 cursor-pointer text-[14px] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2330] transition-colors ${form.domainId === d.id ? 'bg-[#10d97e]/10 text-[#10d97e] font-bold' : 'text-gray-700 dark:text-[#8892a4]'}`}
                      >
                        <span className="flex items-center gap-2">
                          <Globe size={14} />
                          <span>{d.domain}</span>
                          {d.isDefault && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">Default</span>}
                          {d.description && <span className="text-[11px] text-gray-500 ml-1">— {d.description}</span>}
                        </span>
                        <div className="flex items-center gap-3">
                          <PingBadge ping={pingResults[d.id]} />
                          {form.domainId === d.id && <CheckCircle2 size={16} className="text-[#10d97e]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Live Preview */}
          {form.name.trim() && form.domainId && (
            <div className="p-3 bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-inner">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">ที่อยู่สำหรับเชื่อมต่อ (Preview)</p>
              <code className="flex items-center font-mono text-sm font-bold text-[#10d97e]">
                {form.name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.{domains.find(d => d.id === form.domainId)?.domain || '???'}
                {!form.isCustomPort && <span className="text-gray-500">:<span className="text-gray-400">PORT</span></span>}
              </code>
            </div>
          )}

          {/* VIP Custom Port toggle */}
          <div
            className={`flex items-start gap-3 p-4 border rounded-xl mt-2 cursor-pointer transition-colors ${form.isCustomPort ? 'bg-indigo-500/10 border-indigo-500/30 dark:bg-indigo-500/20 dark:border-indigo-500/40' : 'bg-gray-50 border-gray-200 dark:bg-[#161a22] dark:border-[#1e2330] hover:border-indigo-500/50'}`}
            onClick={() => setForm(p => ({ ...p, isCustomPort: !p.isCustomPort }))}
          >
            <div className={`mt-0.5 w-5 h-5 rounded shadow-inner flex items-center justify-center transition-all ${form.isCustomPort ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
              {form.isCustomPort && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div>
              <div className={`text-[13px] font-bold flex items-center gap-1.5 ${form.isCustomPort ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                VIP: บริการเชื่อมต่อแบบซ่อนพอร์ต (Custom Port)
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-500 mt-1.5 leading-relaxed">
                ให้ผู้เล่นสามารถเข้าเซิร์ฟเวอร์ด้วยที่อยู่นี้ได้โดยตรง ไม่ต้องพิมพ์พอร์ตตัวเลขตามหลัง <br />
                <span className="text-orange-500/80 font-bold">• มีค่าบริการ {settings.customPortPrice} Points (จะถูกหักทันทีเมื่อกดสร้าง)</span>
              </div>
            </div>
          </div>

          {/* Region (hidden for now) */}
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
          <div className="flex items-center bg-gray-50 dark:bg-[#161a22] border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-inner">
            <code className="font-mono text-[15px] font-bold text-gray-900 dark:text-emerald-400 flex-1 break-all select-all">{newKeyValue}</code>
          </div>
        </div>
      </Modal>

      {/* Buy Extra Key Slot Modal */}
      <Modal
        isOpen={buySlotModalOpen}
        onClose={() => setBuySlotModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-blue-500">
            <ShoppingCart size={22} />
            <span>ซื้อช่อง Key เพิ่ม</span>
          </div>
        }
        confirmText={isBuyingSlot ? "กำลังดำเนินการ..." : `ยืนยัน (${extraKeyPrice} Points)`}
        onConfirm={handleBuySlot}
        cancelText="ยกเลิก"
        isLoading={isBuyingSlot}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">ซื้อช่องสร้าง API Key เพิ่มอีก 1 ช่อง</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1">ช่องนี้จะเพิ่มถาวรสำหรับบัญชีของคุณ ไม่มีวันหมดอายุ</p>
          </div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#161a22] rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-[#8892a4]">ราคา</span>
            <span className="font-syne font-bold text-lg text-gray-900 dark:text-[#e8ecf4]">{extraKeyPrice} Points</span>
          </div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#161a22] rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-[#8892a4]">พอยท์คงเหลือ</span>
            <span className={`font-syne font-bold text-lg ${(user?.points || 0) >= extraKeyPrice ? 'text-emerald-500' : 'text-red-500'}`}>{user?.points || 0} Points</span>
          </div>
          {(user?.points || 0) < extraKeyPrice && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-[13px] font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              พอยท์ไม่เพียงพอ กรุณาเติมพอยท์ก่อน
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
