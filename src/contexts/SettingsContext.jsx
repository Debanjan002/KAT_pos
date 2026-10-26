import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();
const DEFAULT_CATEGORIES = [
  "Gent's Slipper", "Gent's Belt", "Gent's Hawai", "Gent's Shoe",
  "Ledie's Slipper", "Ledie's Belt", "ledie's Hawai", "Ledis's Shoe",
  'Kids Hawai', 'kids BOYS belt', 'kids GIRLS belt', 'kids BOYS Shoe',
  'kids GIRLS Shoe', 'kids BOYS SLIPPERS', 'kids GIRLS SLIPPERS',
  'DR. Hawai', 'local', 'Accessories',
];
const DEFAULT_PRODUCT_FIELDS = [
  { key: 'brand', label: 'Brand', type: 'text', required: false, options: [] },
  { key: 'size', label: 'Size', type: 'text', required: false, options: [] },
];
const DEFAULT_SHOP_SETTINGS = {
  name: 'KAT POS',
  address: '',
  phone: '',
  email: '',
  logo: '',
  taxRate: 0,
  gstNumber: '',
  returnPolicy: '',
  businessType: 'General',
  categories: ['General', 'Accessories'],
  productFields: [{ key: 'brand', label: 'Brand', type: 'text', required: false, options: [] }],
};

const normalizeShopSettings = (settings) => ({
  ...DEFAULT_SHOP_SETTINGS,
  ...settings,
  name: settings?.name === 'Sharma Shoe Palace' ? 'KAT POS' : settings?.name || DEFAULT_SHOP_SETTINGS.name,
  address: settings?.address === 'Shop No. 15, Gandhi Market, Connaught Place, New Delhi - 110001' ? '' : settings?.address ?? '',
  phone: settings?.phone === '+91 98765 43210' ? '' : settings?.phone ?? '',
  email: settings?.email === 'info@sharmashoes.com' ? '' : settings?.email ?? '',
  taxRate: settings?.taxRate === 18 && settings?.gstNumber === '07AABCS1234F1Z5' ? 0 : settings?.taxRate ?? 0,
  gstNumber: settings?.gstNumber === '07AABCS1234F1Z5' ? '' : settings?.gstNumber ?? '',
  returnPolicy: settings?.returnPolicy ?? '',
  businessType: settings?.businessType || 'General',
  categories: Array.isArray(settings?.categories) ? settings.categories : DEFAULT_CATEGORIES,
  productFields: Array.isArray(settings?.productFields) ? settings.productFields : DEFAULT_PRODUCT_FIELDS,
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [shopSettings, setShopSettings] = useState(DEFAULT_SHOP_SETTINGS);

  const [printerSettings, setPrinterSettings] = useState({
    paperSize: '40mm',
    receiptPaperSize: 'pos',
    printerModel: 'Epson TM-T20',
    printLogo: true,
    printTax: true,
    receiptFormat: {
      headerText: 'Thank you for shopping with us!',
      footerText: 'Visit again soon!',
      footerImage: '',
      footerImageSize: { width: 30, height: 15 },
      footerImagePosition: 'center',
      fontFamily: 'monospace',
      fontSize: '8px',
      headerFontSize: '10px',
      footerFontSize: '7px',
      showGST: true,
      showBarcode: true,
      customMessage: 'Exchange policy: 7 days with bill'
    }
  });

  useEffect(() => {
    loadSettings();
    initializeUsers();
  }, []);

  const loadSettings = () => {
    const storedShopSettings = localStorage.getItem('pos_shop_settings');
    const storedPrinterSettings = localStorage.getItem('pos_printer_settings');

    if (storedShopSettings) {
      const normalized = normalizeShopSettings(JSON.parse(storedShopSettings));
      setShopSettings(normalized);
      localStorage.setItem('pos_shop_settings', JSON.stringify(normalized));
    }

    if (storedPrinterSettings) {
      setPrinterSettings({ ...printerSettings, ...JSON.parse(storedPrinterSettings) });
    }
  };

  const initializeUsers = () => {
    const users = localStorage.getItem('pos_users');
    if (!users) {
      // Create default admin user
      const defaultUsers = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@store.com',
          password: 'admin123',
          role: 'admin'
        },
        {
          id: '2',
          name: 'Cashier',
          email: 'cashier@store.com',
          password: 'cashier123',
          role: 'cashier'
        }
      ];
      localStorage.setItem('pos_users', JSON.stringify(defaultUsers));
    }
  };

  const updateShopSettings = (newSettings) => {
    const normalized = normalizeShopSettings(newSettings);
    setShopSettings(normalized);
    localStorage.setItem('pos_shop_settings', JSON.stringify(normalized));
  };

  const updatePrinterSettings = (newSettings) => {
    const normalized = { ...printerSettings, ...newSettings };
    setPrinterSettings(normalized);
    localStorage.setItem('pos_printer_settings', JSON.stringify(normalized));
  };

  const value = {
    shopSettings,
    printerSettings,
    updateShopSettings,
    updatePrinterSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};