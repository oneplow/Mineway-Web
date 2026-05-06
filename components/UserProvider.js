"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const inFlightRequestRef = useRef(null);

  const fetchUser = useCallback(async () => {
    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current;
    }

    const request = (async () => {
      try {
        const res = await fetch("/api/user?t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          return data;
        }

        setUser(null);
        return null;
      } catch (err) {
        console.error("UserProvider fetch error:", err);
        setUser(null);
        return null;
      } finally {
        setLoading(false);
        inFlightRequestRef.current = null;
      }
    })();

    inFlightRequestRef.current = request;

    try {
      return await request;
    } finally {
      // handled inside request
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // If the user navigates into a protected page and user is null, attempt to refresh.
    if (
      !loading &&
      !user &&
      pathname !== "/auth/login" &&
      pathname !== "/auth/register" &&
      pathname !== "/"
    ) {
      fetchUser();
    }
  }, [pathname, fetchUser, loading, user]);

  // refreshUser can be called from any page after points/plan changes
  const refreshUser = useCallback(() => {
    return fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}
