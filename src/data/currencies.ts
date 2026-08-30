export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  country: string;
  flag: string;
}

export const GLOBAL_CURRENCIES: CurrencyOption[] = [
  // Major & Global
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", country: "European Union", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom", flag: "🇬🇧" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", country: "Canada", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", country: "Australia", flag: "🇦🇺" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", country: "New Zealand", flag: "🇳🇿" },
  { code: "CHF", symbol: "CHF ", name: "Swiss Franc", country: "Switzerland", flag: "🇨🇭" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", country: "Japan", flag: "🇯🇵" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", country: "China", flag: "🇨🇳" },

  // Africa (Major retail & kiosk markets)
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", country: "Nigeria", flag: "🇳🇬" },
  { code: "KES", symbol: "KSh ", name: "Kenyan Shilling", country: "Kenya", flag: "🇰🇪" },
  { code: "GHS", symbol: "GH₵ ", name: "Ghanaian Cedi", country: "Ghana", flag: "🇬🇭" },
  { code: "ZAR", symbol: "R ", name: "South African Rand", country: "South Africa", flag: "🇿🇦" },
  { code: "EGP", symbol: "E£ ", name: "Egyptian Pound", country: "Egypt", flag: "🇪🇬" },
  { code: "UGX", symbol: "USh ", name: "Ugandan Shilling", country: "Uganda", flag: "🇺🇬" },
  { code: "TZS", symbol: "TSh ", name: "Tanzanian Shilling", country: "Tanzania", flag: "🇹🇿" },
  { code: "RWF", symbol: "FRw ", name: "Rwandan Franc", country: "Rwanda", flag: "🇷🇼" },
  { code: "ETB", symbol: "Br ", name: "Ethiopian Birr", country: "Ethiopia", flag: "🇪🇹" },
  { code: "ZMW", symbol: "ZK ", name: "Zambian Kwacha", country: "Zambia", flag: "🇿🇲" },
  { code: "XOF", symbol: "CFA ", name: "West African CFA Franc", country: "Senegal, Ivory Coast, Benin", flag: "🌍" },
  { code: "XAF", symbol: "FCFA ", name: "Central African CFA Franc", country: "Cameroon, Gabon, Congo", flag: "🌍" },
  { code: "MAD", symbol: "MAD ", name: "Moroccan Dirham", country: "Morocco", flag: "🇲🇦" },
  { code: "DZD", symbol: "DA ", name: "Algerian Dinar", country: "Algeria", flag: "🇩🇿" },
  { code: "BWP", symbol: "P ", name: "Botswana Pula", country: "Botswana", flag: "🇧🇼" },
  { code: "MWK", symbol: "MK ", name: "Malawian Kwacha", country: "Malawi", flag: "🇲🇼" },
  { code: "MZN", symbol: "MT ", name: "Mozambican Metical", country: "Mozambique", flag: "🇲🇿" },
  { code: "NAD", symbol: "N$ ", name: "Namibian Dollar", country: "Namibia", flag: "🇳🇦" },
  { code: "SLE", symbol: "Le ", name: "Sierra Leonean Leone", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "LRD", symbol: "L$ ", name: "Liberian Dollar", country: "Liberia", flag: "🇱🇷" },
  { code: "GMD", symbol: "D ", name: "Gambian Dalasi", country: "Gambia", flag: "🇬🇲" },

  // Asia & Middle East
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", flag: "🇮🇳" },
  { code: "PKR", symbol: "₨ ", name: "Pakistani Rupee", country: "Pakistan", flag: "🇵🇰" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", country: "Bangladesh", flag: "🇧🇩" },
  { code: "LKR", symbol: "Rs ", name: "Sri Lankan Rupee", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "NPR", symbol: "रू ", name: "Nepalese Rupee", country: "Nepal", flag: "🇳🇵" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", country: "Philippines", flag: "🇵🇭" },
  { code: "IDR", symbol: "Rp ", name: "Indonesian Rupiah", country: "Indonesia", flag: "🇮🇩" },
  { code: "MYR", symbol: "RM ", name: "Malaysian Ringgit", country: "Malaysia", flag: "🇲🇾" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", country: "Singapore", flag: "🇸🇬" },
  { code: "THB", symbol: "฿", name: "Thai Baht", country: "Thailand", flag: "🇹🇭" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", country: "Vietnam", flag: "🇻🇳" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", country: "South Korea", flag: "🇰🇷" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", country: "Hong Kong", flag: "🇭🇰" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar", country: "Taiwan", flag: "🇹🇼" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SAR", symbol: "SAR ", name: "Saudi Riyal", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "QAR", symbol: "QR ", name: "Qatari Riyal", country: "Qatar", flag: "🇶🇦" },
  { code: "KWD", symbol: "KD ", name: "Kuwaiti Dinar", country: "Kuwait", flag: "🇰🇼" },
  { code: "BHD", symbol: "BD ", name: "Bahraini Dinar", country: "Bahrain", flag: "🇧🇭" },
  { code: "OMR", symbol: "OMR ", name: "Omani Rial", country: "Oman", flag: "🇴🇲" },
  { code: "JOD", symbol: "JD ", name: "Jordanian Dinar", country: "Jordan", flag: "🇯🇴" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", country: "Turkey", flag: "🇹🇷" },
  { code: "ILS", symbol: "₪", name: "Israeli New Shekel", country: "Israel", flag: "🇮🇱" },

  // Latin America & Caribbean
  { code: "BRL", symbol: "R$", name: "Brazilian Real", country: "Brazil", flag: "🇧🇷" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso", country: "Mexico", flag: "🇲🇽" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso", country: "Colombia", flag: "🇨🇴" },
  { code: "ARS", symbol: "ARS$", name: "Argentine Peso", country: "Argentina", flag: "🇦🇷" },
  { code: "CLP", symbol: "CLP$", name: "Chilean Peso", country: "Chile", flag: "🇨🇱" },
  { code: "PEN", symbol: "S/ ", name: "Peruvian Sol", country: "Peru", flag: "🇵🇪" },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar", country: "Jamaica", flag: "🇯🇲" },
  { code: "TTD", symbol: "TT$", name: "Trinidad & Tobago Dollar", country: "Trinidad & Tobago", flag: "🇹🇹" },
  { code: "DOP", symbol: "RD$", name: "Dominican Peso", country: "Dominican Republic", flag: "🇩🇴" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón", country: "Costa Rica", flag: "🇨🇷" },
  { code: "GTQ", symbol: "Q ", name: "Guatemalan Quetzal", country: "Guatemala", flag: "🇬🇹" },

  // Europe (Non-Euro)
  { code: "SEK", symbol: "kr ", name: "Swedish Krona", country: "Sweden", flag: "🇸🇪" },
  { code: "NOK", symbol: "kr ", name: "Norwegian Krone", country: "Norway", flag: "🇳🇴" },
  { code: "DKK", symbol: "kr.", name: "Danish Krone", country: "Denmark", flag: "🇩🇰" },
  { code: "PLN", symbol: "zł ", name: "Polish Zloty", country: "Poland", flag: "🇵🇱" },
  { code: "CZK", symbol: "Kč ", name: "Czech Koruna", country: "Czech Republic", flag: "🇨🇿" },
  { code: "HUF", symbol: "Ft ", name: "Hungarian Forint", country: "Hungary", flag: "🇭🇺" },
  { code: "RON", symbol: "lei ", name: "Romanian Leu", country: "Romania", flag: "🇷🇴" },
  { code: "BGN", symbol: "лв ", name: "Bulgarian Lev", country: "Bulgaria", flag: "🇧🇬" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", country: "Ukraine", flag: "🇺🇦" },
];
