"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserProvider";
import { User, KeyRound, Mail, LogOut, Link as LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const { user, loading: userLoading, refreshUser } = useUser();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    image: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    setUserData(user);
    setFormData(prev => ({
      ...prev,
      username: user.username || "",
      image: user.image || ""
    }));
    setIsLoading(false);
  }, [user, userLoading]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          image: formData.image,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "อัพเดทข้อมูลไม่สำเร็จ");
      }

      toast.success("อัพเดทโปรไฟล์เรียบร้อย");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      const refreshedUser = await refreshUser();
      if (refreshedUser) {
        setUserData(refreshedUser);
        setFormData(prev => ({
          ...prev,
          username: refreshedUser.username || "",
          image: refreshedUser.image || "",
        }));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0a0c0f]">
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-[#1e2330] border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-[#f8fafc] dark:bg-[#0a0c0f]">

      <div className="pt-8 md:pt-12 pb-16 px-6 md:px-12 max-w-[1100px] mx-auto animate-fade-in">
        {/* Header section */}
        <div className="bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 shadow-sm">
          <div>
            <h1 className="font-syne text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-gray-900 dark:text-[#e8ecf4]">
              จัดการโปรไฟล์ (Profile)
            </h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">
              จัดการข้อมูลส่วนตัว รูปภาพ และรหัสผ่านสำหรับเข้าสู่ระบบ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Left Column - Summary Card */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#111318] p-8 rounded-2xl border border-gray-200 dark:border-[#1e2330] shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-[#4d8fff]/20 to-[#9d6fff]/20 dark:from-[#4d8fff]/10 dark:to-[#9d6fff]/10"></div>

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4d8fff] to-[#9d6fff] flex items-center justify-center text-3xl font-bold text-white shadow-xl relative z-10 mb-4 border-4 border-white dark:border-[#111318] overflow-hidden">
                {userData?.image ? (
                  <img src={userData.image} alt={userData.username} className="w-full h-full object-cover" />
                ) : (
                  userData?.username ? userData.username[0].toUpperCase() : "?"
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-[#e8ecf4] relative z-10 mb-1">{userData?.username || 'User'}</h2>
              <p className="text-sm text-gray-500 dark:text-[#8892a4] relative z-10 mb-6">{userData?.email}</p>

              <div className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#0a0c0f] rounded-2xl border border-gray-100 dark:border-[#1e2330] mb-3">
                <div className="text-sm font-semibold text-gray-500 dark:text-[#8892a4]">ระดับบัญชี</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-[#10d97e]">{userData?.plan?.displayName || "ไม่มีแพ็กเกจ"}</div>
              </div>

              <div className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#0a0c0f] rounded-2xl border border-gray-100 dark:border-[#1e2330]">
                <div className="text-sm font-semibold text-gray-500 dark:text-[#8892a4]">ยอดคงเหลือ</div>
                <div className="text-sm font-bold text-amber-500">{userData?.points?.toLocaleString() || 0} Pts</div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#111318] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-500 font-bold transition-colors shadow-sm"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>

          {/* Right Column - Forms */}
          <div className="xl:col-span-2 space-y-6">

            {/* Main Form */}
            <form onSubmit={handleSave} className="bg-white dark:bg-[#111318] p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-[#1e2330] shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#e8ecf4]">ข้อมูลส่วนตัว</h3>
                <p className="text-sm text-gray-500 dark:text-[#8892a4]">แก้ไขรูปโปรไฟล์ ชื่อ และรหัสผ่านสำหรับเข้าสู่ระบบ</p>
              </div>

              <div className="space-y-6">
                {/* Email (Readonly) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">อีเมล (ไม่สามารถเปลี่ยนได้)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={userData?.email || ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-[#0a0c0f] border border-gray-200 dark:border-[#1e2330] rounded-xl text-gray-500 dark:text-[#8892a4] text-[15px] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">ชื่อที่แสดง</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-[15px] text-gray-900 dark:text-[#e8ecf4] transition-all"
                      />
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">ลิงก์รูปโปรไฟล์ (Image URL)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-[15px] text-gray-900 dark:text-[#e8ecf4] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#1e2330]">
                  <h4 className="text-base font-bold text-gray-900 dark:text-[#e8ecf4] mb-4 flex items-center gap-2">
                    <KeyRound size={18} className="text-emerald-500" />
                    เปลี่ยนรหัสผ่าน
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">รหัสผ่านปัจจุบัน</label>
                      <input
                        type="password"
                        placeholder="ปล่อยว่างไว้หากไม่ต้องการเปลี่ยน"
                        value={formData.currentPassword}
                        onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-[15px] text-gray-900 dark:text-[#e8ecf4] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">รหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-[15px] text-gray-900 dark:text-[#e8ecf4] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-[#8892a4] mb-2">ยืนยันรหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-[#111318] border border-gray-200 dark:border-[#1e2330] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-[15px] text-gray-900 dark:text-[#e8ecf4] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-[#1e2330] justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || (formData.newPassword && !formData.currentPassword)}
                    className="px-8 py-3 rounded-xl font-bold text-sm text-black dark:text-[#0a0c0f] bg-[#10d97e] hover:brightness-110 shadow-[0_0_15px_rgba(16,217,126,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && <span className="w-4 h-4 border-2 border-black/30 dark:border-white/30 border-t-black dark:border-t-white rounded-full animate-spin" />}
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </div>
            </form>

          </div>

        </div>
      </div>
    </div>
  );
}
