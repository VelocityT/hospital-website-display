/**
 * Rupee amounts spelled out, Indian style (thousand / lakh / crore).
 *
 * Printed bills are read by patients, insurers and auditors, and the words line
 * is what makes a figure hard to alter after the fact — so this must never be
 * approximate. Western grouping (million/billion) is deliberately NOT used:
 * an Indian hospital bill reading "three million" would look wrong to every
 * person who handles it.
 *
 * Paise are rounded to 2 dp and spelled separately, matching how bills are
 * written by hand here ("... and Fifty Paise Only").
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

/** 0–99 */
const twoDigits = (n) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

/** 0–999 */
const threeDigits = (n) => {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [
    hundred ? `${ONES[hundred]} Hundred` : "",
    rest ? twoDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * Whole rupees to words using Indian place values.
 * Groups are crore (10^7), lakh (10^5), thousand (10^3), then the last 3.
 */
const rupeesToWords = (amount) => {
  if (amount === 0) return "Zero";

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = amount % 1000;

  return [
    crore ? `${threeDigits(crore)} Crore` : "",
    lakh ? `${threeDigits(lakh)} Lakh` : "",
    thousand ? `${threeDigits(thousand)} Thousand` : "",
    remainder ? threeDigits(remainder) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * @param {number} value  amount in rupees, may carry paise
 * @returns {string} e.g. "Three Thousand Six Hundred Fifty Rupees Only"
 */
export const amountInWords = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Zero Rupees Only";

  const negative = num < 0;
  // Round to paise FIRST, so 0.005 cannot spell as zero rupees zero paise
  // while the printed figure shows 0.01.
  const rounded = Math.round(Math.abs(num) * 100) / 100;

  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const parts = [`${rupeesToWords(rupees)} Rupees`];
  if (paise > 0) parts.push(`and ${twoDigits(paise)} Paise`);

  return `${negative ? "Minus " : ""}${parts.join(" ")} Only`;
};

export default amountInWords;
