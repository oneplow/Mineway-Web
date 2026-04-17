/**
 * PromptPay QR Code Payload Generator
 * Based on EMVCo QR Code specification for PromptPay (Thailand)
 * Generates a valid QR payload string for use with any QR rendering library.
 */

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(tag, value) {
  return tag + String(value.length).padStart(2, "0") + value;
}

/**
 * Generate a PromptPay EMVCo QR payload string.
 * @param {string} id - Phone number (e.g. "0812345678") or National ID (13 digits)
 * @param {number} amount - Amount in THB (e.g. 100.37)
 * @returns {string} EMVCo QR payload string ready to be rendered as a QR code
 */
export function generatePromptPayPayload(id, amount) {
  const sanitized = id.replace(/[^0-9]/g, "");

  let aid;
  if (sanitized.length >= 13) {
    // National ID (13 digits)
    aid = sanitized.slice(-13);
  } else {
    // Phone number — convert 0xx to 66xx
    let phone = sanitized;
    if (phone.startsWith("0")) {
      phone = "66" + phone.substring(1);
    }
    aid = ("0000000000000" + phone).slice(-13);
  }

  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += tlv("01", "12"); // Point of Initiation (dynamic QR)

  // Merchant Account Info (tag 29 for PromptPay)
  const merchantData =
    tlv("00", "A000000677010111") + // PromptPay AID
    tlv("01", aid); // Account ID
  payload += tlv("29", merchantData);

  payload += tlv("53", "764"); // Currency (THB)

  if (amount !== undefined && amount !== null && amount > 0) {
    const amountStr = amount.toFixed(2);
    payload += tlv("54", amountStr); // Transaction Amount
  }

  payload += tlv("58", "TH"); // Country Code
  payload += "6304"; // CRC tag + length placeholder

  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}
