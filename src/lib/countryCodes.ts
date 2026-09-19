export const DEFAULT_DIAL_CODE = "+971";

export const COUNTRY_CODES: { name: string; dial: string }[] = [
  { name: "UAE", dial: "+971" },
  { name: "Philippines", dial: "+63" },
  { name: "India", dial: "+91" },
  { name: "Pakistan", dial: "+92" },
  { name: "Bangladesh", dial: "+880" },
  { name: "Sri Lanka", dial: "+94" },
  { name: "Nepal", dial: "+977" },
  { name: "Saudi Arabia", dial: "+966" },
  { name: "Qatar", dial: "+974" },
  { name: "Kuwait", dial: "+965" },
  { name: "Bahrain", dial: "+973" },
  { name: "Oman", dial: "+968" },
  { name: "Egypt", dial: "+20" },
  { name: "Jordan", dial: "+962" },
  { name: "Lebanon", dial: "+961" },
  { name: "Turkey", dial: "+90" },
  { name: "United Kingdom", dial: "+44" },
  { name: "Ireland", dial: "+353" },
  { name: "USA / Canada", dial: "+1" },
  { name: "Australia", dial: "+61" },
  { name: "New Zealand", dial: "+64" },
  { name: "Singapore", dial: "+65" },
  { name: "Malaysia", dial: "+60" },
  { name: "Indonesia", dial: "+62" },
  { name: "Thailand", dial: "+66" },
  { name: "Vietnam", dial: "+84" },
  { name: "Hong Kong", dial: "+852" },
  { name: "China", dial: "+86" },
  { name: "Japan", dial: "+81" },
  { name: "South Korea", dial: "+82" },
  { name: "Germany", dial: "+49" },
  { name: "France", dial: "+33" },
  { name: "Italy", dial: "+39" },
  { name: "Spain", dial: "+34" },
  { name: "Netherlands", dial: "+31" },
  { name: "Russia", dial: "+7" },
  { name: "South Africa", dial: "+27" },
  { name: "Nigeria", dial: "+234" },
  { name: "Kenya", dial: "+254" },
];

export function buildPhone(dial: string, national: string) {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return { digits, full: `${dial} ${digits}` };
}
