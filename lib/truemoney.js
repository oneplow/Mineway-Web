/**
 * TrueMoney Gift Voucher (Angpao) Claimer
 * Handles redeeming TrueMoney gift links via their campaign API.
 */

class TrueMoneyGiftClaimer {
  constructor(mobile) {
    this.baseUrl = "https://gift.truemoney.com/campaign";
    this.mobile = mobile.replace(/\D/g, "");
    if (!/^0[689]\d{8}$/.test(this.mobile)) {
      throw new Error("เบอร์โทรไม่ถูกต้อง (ต้องเป็นเบอร์ไทย 10 หลัก)");
    }
  }

  getHeaders() {
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "th-TH,th;q=0.9",
      "Content-Type": "application/json",
      "Origin": "https://gift.truemoney.com",
      "Referer": "https://gift.truemoney.com/campaign/",
    };
  }

  async redeem(voucherUrlOrCode, customMobile) {
    const code = this.extractCode(voucherUrlOrCode);
    const phone = customMobile?.replace(/\D/g, "") || this.mobile;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}/vouchers/${code}/redeem`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ mobile: phone }),
        });

        const text = await res.text();

        // Cloudflare HTML block detection
        if (text.trim().startsWith("<")) {
          console.error("TrueMoney API blocked by Cloudflare (attempt " + attempt + ")");
          if (attempt === 3) {
            return {
              success: false,
              amount: 0,
              message: "ระบบเติมเงินขัดข้อง (TrueMoney บล็อคการเชื่อมต่อ) กรุณาติดต่อแอดมิน",
              code: "CLOUDFLARE_BLOCKED",
            };
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }

        const data = JSON.parse(text);
        const statusCode = data.status?.code || data.code || "UNKNOWN";

        if (statusCode === "SUCCESS" || statusCode === "SUCCESS_FOR_TOPUP") {
          return {
            success: true,
            amount: data.data?.my_ticket?.amount_baht ?? data.data?.amount,
            sender: data.data?.my_ticket?.owner_name,
            message: "รับเงินสำเร็จ",
            code: statusCode,
            raw: data,
          };
        }

        const errorMap = {
          CANNOT_GET_OWN_VOUCHER: "รับซองตัวเองไม่ได้ (เบอร์ผู้ส่งตรงกับเบอร์คุณ)",
          VOUCHER_NOT_FOUND: "ไม่พบซองนี้หรือลิงก์ผิด",
          VOUCHER_EXPIRED: "ซองหมดอายุแล้ว",
          VOUCHER_OUT_OF_STOCK: "ซองถูกรับหมดแล้ว",
          CANNOT_GET_MORE_ONE: "ซองนี้รับได้เพียง 1 คน",
          TARGET_USER_NOT_FOUND: "เบอร์นี้ยังไม่ได้สมัคร TrueMoney Wallet",
          INTERNAL_ERROR: "ระบบ TrueMoney ขัดข้องชั่วคราว",
        };

        return {
          success: false,
          amount: 0,
          message: errorMap[statusCode] || data.status?.message || data.message || "เกิดข้อผิดพลาด",
          code: statusCode,
          raw: data,
        };
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    throw new Error("ไม่สามารถเชื่อมต่อ TrueMoney API ได้");
  }

  extractCode(urlOrCode) {
    const match =
      urlOrCode.match(/[?&]v=([A-Za-z0-9]+)/) ||
      urlOrCode.match(/^([A-Za-z0-9]+)$/);
    if (!match) throw new Error("ไม่พบ voucher code");
    return match[1];
  }
}

/**
 * Redeem a TrueMoney voucher link.
 * @param {string} phoneNumber - Thai phone number (10 digits)
 * @param {string} voucherUrl  - Gift link or raw voucher code
 * @returns {Promise<{success: boolean, amount: number, code: string, message: string, sender?: string, raw?: any}>}
 *          amount is in satang (1000 = 10 baht)
 */
export async function redeemVoucher(phoneNumber, voucherUrl) {
  try {
    const claimer = new TrueMoneyGiftClaimer(phoneNumber);
    const result = await claimer.redeem(voucherUrl);

    const amountSatang =
      typeof result.amount === "number" ? Math.round(result.amount * 100) : 0;

    return {
      success: result.success,
      amount: amountSatang,
      code: result.code,
      message: result.message,
      sender: result.sender,
      raw: result.raw,
    };
  } catch (err) {
    console.error("TrueMoney redeem error:", err);
    return {
      success: false,
      amount: 0,
      code:
        err.message?.includes("fetch") || err.message?.includes("network")
          ? "NETWORK_ERROR"
          : "UPSTREAM_ERROR",
      message: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ TrueMoney",
    };
  }
}
