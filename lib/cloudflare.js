// lib/cloudflare.js
// Utility to manage Cloudflare DNS SRV records for VIP Custom Port

const CF_API = "https://api.cloudflare.com/client/v4";

/**
 * Create an SRV record for Minecraft Java Edition.
 * This allows players to connect via `subdomain.domain` without specifying a port.
 *
 * SRV format: _minecraft._tcp.{subdomain}.{domain} -> {target}:{port}
 */
export async function createSrvRecord({ zoneId, subdomain, domain, port, targetIp }) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set");
  if (!zoneId) throw new Error("Cloudflare Zone ID is not configured for this domain");

  const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "SRV",
      name: `_minecraft._tcp.${subdomain}.${domain}`,
      data: {
        service: "_minecraft",
        proto: "_tcp",
        name: `${subdomain}.${domain}`,
        priority: 0,
        weight: 5,
        port: port,
        target: domain, // points to the same domain (wildcard A record handles it)
      },
      ttl: 1, // auto
      comment: `Mineway VIP SRV for ${subdomain}.${domain}`,
    }),
  });

  const data = await res.json();
  if (!data.success) {
    console.error("Cloudflare SRV creation failed:", JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.message || "Failed to create SRV record");
  }

  return data.result;
}

/**
 * Delete an SRV record by its Cloudflare record ID.
 */
export async function deleteSrvRecord({ zoneId, recordId }) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set");

  const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records/${recordId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!data.success) {
    console.error("Cloudflare SRV deletion failed:", JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.message || "Failed to delete SRV record");
  }

  return true;
}

/**
 * List SRV records matching a pattern (for lookup/cleanup).
 */
export async function findSrvRecord({ zoneId, subdomain, domain }) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set");

  const searchName = `_minecraft._tcp.${subdomain}.${domain}`;
  const res = await fetch(
    `${CF_API}/zones/${zoneId}/dns_records?type=SRV&name=${encodeURIComponent(searchName)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  if (!data.success) return null;

  return data.result?.[0] || null;
}
