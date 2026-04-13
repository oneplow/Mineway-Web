"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext({});

export function useSettings() {
  return useContext(SettingsContext);
}

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    siteName: "Mineway",
    siteTagline: "Minecraft Server Gateway",
    siteDescription: "",
    footerText: "",
    homeAnnouncement: "",
    dashboardAnnouncement: "",
    discordUrl: "",
    contactEmail: "",
    customPortPrice: "500",
    defaultTunnelExpiryDays: "30",
    maintenanceMode: "false",
    maintenanceMessage: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.ok ? res.json() : {})
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {}); // silently fail, use defaults
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}
