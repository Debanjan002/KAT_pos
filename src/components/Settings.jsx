import React, { useEffect, useState } from 'react';

import { useSettings } from '../contexts/SettingsContext';

import { 

  Store, 

  Printer, 

  Save, 

  Upload,

  Settings as SettingsIcon,

  MapPin,

  Phone,

  Mail,

  Download

} from 'lucide-react';

const BUSINESS_TEMPLATES = {
  Shoes: {
    categories: ["Gent's Slipper", "Gent's Belt", "Gent's Hawai", "Gent's Shoe", "Ledie's Slipper", "Ledie's Belt", "Ledis's Shoe", 'Kids Shoes', 'Accessories'],
    productFields: [
      { key: 'brand', label: 'Brand', type: 'text', required: false, options: [] },
      { key: 'size', label: 'Size', type: 'text', required: false, options: [] },
    ],
  },
  Grocery: {
    categories: ['Produce', 'Dairy', 'Bakery', 'Packaged food', 'Beverages', 'Household'],
    productFields: [
      { key: 'brand', label: 'Brand', type: 'text', required: false, options: [] },
      { key: 'unit', label: 'Unit (e.g. kg, litre, pack)', type: 'text', required: true, options: [] },
      { key: 'expiryDate', label: 'Expiry date', type: 'date', required: false, options: [] },
    ],
  },
  Electronics: {
    categories: ['Computers', 'Phones', 'Audio', 'Appliances', 'Accessories'],
    productFields: [
      { key: 'brand', label: 'Brand', type: 'text', required: false, options: [] },
      { key: 'model', label: 'Model', type: 'text', required: false, options: [] },
      { key: 'warranty', label: 'Warranty', type: 'text', required: false, options: [] },
    ],
  },
  General: {
    categories: ['General', 'Accessories'],
    productFields: [{ key: 'brand', label: 'Brand', type: 'text', required: false, options: [] }],
  },
};

const Settings = () => {

  const { shopSettings, printerSettings, updateShopSettings, updatePrinterSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('shop');

  const [tempShopSettings, setTempShopSettings] = useState(shopSettings);
  const [tempPrinterSettings, setTempPrinterSettings] = useState(printerSettings);

  const [categoriesDraft, setCategoriesDraft] = useState((shopSettings.categories || []).join('\n'));

  useEffect(() => {
    setTempShopSettings(shopSettings);
    setCategoriesDraft((shopSettings.categories || []).join('\n'));
  }, [shopSettings]);

  useEffect(() => {
    setTempPrinterSettings(printerSettings);
  }, [printerSettings]);


  const handleShopSave = () => {
    const fieldLabels = (tempShopSettings.productFields || []).map((field) => String(field.label || '').trim().toLowerCase());
    if (fieldLabels.some((label) => !label)) {
      alert('Please enter a label for each product field.');
      return;
    }
    if (new Set(fieldLabels).size !== fieldLabels.length) {
      alert('Product field labels must be unique.');
      return;
    }
    const categories = [...new Set(categoriesDraft.split(/\r?\n/).map((category) => category.trim()).filter(Boolean))];
    updateShopSettings({ ...tempShopSettings, categories });
    setCategoriesDraft(categories.join('\n'));
    alert('Business settings saved successfully!');
  };

  const applyBusinessTemplate = () => {
    const template = BUSINESS_TEMPLATES[tempShopSettings.businessType] || BUSINESS_TEMPLATES.General;
    if (!window.confirm(`Replace the current category and product-field setup with ${tempShopSettings.businessType} suggestions? Existing product data will be kept.`)) return;
    setTempShopSettings((current) => ({
      ...current,
      categories: template.categories,
      productFields: template.productFields,
    }));
    setCategoriesDraft(template.categories.join('\n'));
  };

  const updateProductField = (index, changes) => {
    setTempShopSettings((current) => ({
      ...current,
      productFields: current.productFields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...changes } : field
      ),
    }));
  };



  const handlePrinterSave = () => {

    updatePrinterSettings(tempPrinterSettings);

    alert('Printer settings saved successfully!');

  };



  const handleLogoUpload = (e) => {

    const file = e.target.files[0];

    if (file) {

      const reader = new FileReader();

      reader.onload = (e) => {

        setTempShopSettings({

          ...tempShopSettings,

          logo: e.target.result

        });

      };

      reader.readAsDataURL(file);

    }

  };



  const tabs = [
    { id: 'shop', label: 'Shop Details', icon: Store },
    { id: 'business', label: 'Business & Products', icon: SettingsIcon },
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'data', label: 'Data Management', icon: SettingsIcon }
  ];



  const exportData = () => {

    const data = {

      products: JSON.parse(localStorage.getItem('pos_products') || '[]'),

      sales: JSON.parse(localStorage.getItem('pos_sales') || '[]'),

      dues: JSON.parse(localStorage.getItem('pos_dues') || '[]'),

      duePayments: JSON.parse(localStorage.getItem('pos_due_payments') || '[]'),

      users: JSON.parse(localStorage.getItem('pos_users') || '[]'),

      settings: {

        shop: shopSettings,

        printer: printerSettings

      }

    };



    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `business-data-${new Date().toISOString().split('T')[0]}.json`;

    a.click();

    URL.revokeObjectURL(url);

  };



  const importData = (event) => {

    const file = event.target.files[0];

    if (!file) return;



    const reader = new FileReader();

    reader.onload = (e) => {

      try {

        const data = JSON.parse(e.target.result);



        if (data.products) localStorage.setItem('pos_products', JSON.stringify(data.products));

        if (data.sales) localStorage.setItem('pos_sales', JSON.stringify(data.sales));

        if (data.dues) localStorage.setItem('pos_dues', JSON.stringify(data.dues));

        if (data.duePayments) localStorage.setItem('pos_due_payments', JSON.stringify(data.duePayments));

        if (data.users) localStorage.setItem('pos_users', JSON.stringify(data.users));

        if (data.settings?.shop) updateShopSettings(data.settings.shop);

        if (data.settings?.printer) updatePrinterSettings(data.settings.printer);



        alert('Data imported successfully! Please refresh the page.');

      } catch (error) {

        alert('Error importing data. Please check the file format.');

      }

    };

    reader.readAsText(file);

  };



  return (

    <div className="space-y-6 text-slate-100">

      {/* Header */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6">

        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">

          <SettingsIcon className="w-6 h-6 text-blue-400" />

          Settings

        </h1>

        <p className="text-slate-400 mt-1">Configure your store settings and preferences</p>

      </div>



      {/* Tabs */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">

        <div className="border-slate-800">

          <nav className="flex">

            {tabs.map((tab) => (

              <button

                key={tab.id}

                onClick={() => setActiveTab(tab.id)}

                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${

                  activeTab === tab.id

                    ? 'border-blue-500 text-blue-400 bg-blue-950/40'

                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800'

                }`}

              >

                <tab.icon className="w-4 h-4" />

                {tab.label}

              </button>

            ))}

          </nav>

        </div>



        <div className="p-6">

          {activeTab === 'shop' && (

            <div className="space-y-6 text-slate-100">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Business Name *

                  </label>

                  <div className="relative">

                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />

                    <input

                      type="text"

                      value={tempShopSettings.name}

                      onChange={(e) => setTempShopSettings({...tempShopSettings, name: e.target.value})}

                      className="w-full pl-10 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                      placeholder="Your business name"

                    />

                  </div>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Phone Number

                  </label>

                  <div className="relative">

                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />

                    <input

                      type="tel"

                      value={tempShopSettings.phone}

                      onChange={(e) => setTempShopSettings({...tempShopSettings, phone: e.target.value})}

                      className="w-full pl-10 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                      placeholder="+91 98765 43210"

                    />

                  </div>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Email Address

                  </label>

                  <div className="relative">

                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />

                    <input

                      type="email"

                      value={tempShopSettings.email}

                      onChange={(e) => setTempShopSettings({...tempShopSettings, email: e.target.value})}

                      className="w-full pl-10 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                      placeholder="info@sharmashoes.com"

                    />

                  </div>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Tax Rate (%) *

                  </label>

                  <input

                    type="number"

                    step="0.01"

                    min="0"

                    max="100"

                    value={tempShopSettings.taxRate}

                    onChange={(e) => setTempShopSettings({...tempShopSettings, taxRate: parseFloat(e.target.value)})}

                    className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="18"

                    required

                  />

                  <p className="text-xs text-slate-400 mt-1">

                    Enter the percentage tax rate applied to sales.

                  </p>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Tax Registration Number

                  </label>

                  <input

                    type="text"

                    value={tempShopSettings.gstNumber}

                    onChange={(e) => setTempShopSettings({...tempShopSettings, gstNumber: e.target.value})}

                    className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="Optional tax registration number"

                  />

                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Return / Exchange Policy
                  </label>
                  <input
                    type="text"
                    value={tempShopSettings.returnPolicy || ''}
                    onChange={(e) => setTempShopSettings({ ...tempShopSettings, returnPolicy: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Returns subject to store policy"
                  />
                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">

                  Shop Address

                </label>

                <div className="relative">

                  <MapPin className="absolute left-3 top-3 text-slate-500 w-4 h-4" />

                  <textarea

                    value={tempShopSettings.address}

                    onChange={(e) => setTempShopSettings({...tempShopSettings, address: e.target.value})}

                    rows="3"

                    className="w-full pl-10 pr-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="Shop No. 15, Gandhi Market, Connaught Place, New Delhi - 110001"

                  />

                </div>

              </div>



              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">

                  Shop Logo

                </label>

                <div className="flex items-center gap-4">

                  {tempShopSettings.logo && (

                    <img

                      src={tempShopSettings.logo}

                      alt="Shop Logo"

                      className="w-16 h-16 object-contain border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    />

                  )}

                  <div className="flex-1">

                    <input

                      type="file"

                      accept="image/*"

                      onChange={handleLogoUpload}

                      className="hidden"

                      id="logo-upload"

                    />

                    <label

                      htmlFor="logo-upload"

                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"

                    >

                      <Upload className="w-4 h-4" />

                      {tempShopSettings.logo ? 'Change Logo' : 'Upload Logo'}

                    </label>

                    <p className="text-xs text-slate-400 mt-1">

                      Recommended: square PNG or JPG. Save business settings to apply it as the browser tab icon.

                    </p>

                  </div>

                </div>

              </div>



              <div className="flex justify-end">

                <button

                  onClick={handleShopSave}

                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 font-medium"

                >

                  <Save className="w-4 h-4" />

                  Save Settings

                </button>

              </div>

            </div>

          )}


          {activeTab === 'business' && (
            <div className="space-y-8 text-slate-100">
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Business setup</h2>
                  <p className="mt-1 text-sm text-slate-400">Choose a business type for suggested defaults, then customize categories and product fields for your business.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div>
                    <label htmlFor="business-type" className="mb-2 block text-sm font-medium text-slate-300">Business type</label>
                    <select
                      id="business-type"
                      value={tempShopSettings.businessType || 'General'}
                      onChange={(event) => setTempShopSettings({ ...tempShopSettings, businessType: event.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                    >
                      {Object.keys(BUSINESS_TEMPLATES).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={applyBusinessTemplate} className="rounded-lg border border-blue-500/40 bg-blue-950/40 px-4 py-3 text-sm font-medium text-blue-200 hover:bg-blue-950/70">
                    Load type suggestions
                  </button>
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-800 pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Product categories</h2>
                  <p className="mt-1 text-sm text-slate-400">Enter one category per line. Categories can be changed without affecting existing products.</p>
                </div>
                <textarea
                  value={categoriesDraft}
                  onChange={(event) => setCategoriesDraft(event.target.value)}
                  rows={7}
                  aria-label="Product categories, one per line"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
                  placeholder={'Food\nBeverages\nHousehold'}
                />
              </section>

              <section className="space-y-4 border-t border-slate-800 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Custom product fields</h2>
                    <p className="mt-1 text-sm text-slate-400">These fields appear when adding or editing products and are saved with product data on this device.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempShopSettings((current) => ({
                      ...current,
                      productFields: [...current.productFields, {
                        key: `custom_${Date.now()}`,
                        label: '',
                        type: 'text',
                        required: false,
                        options: [],
                      }],
                    }))}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Add field
                  </button>
                </div>

                {(tempShopSettings.productFields || []).length === 0 && (
                  <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">No custom product fields. You can add any fields your business needs.</p>
                )}
                {(tempShopSettings.productFields || []).map((field, index) => (
                  <div key={field.key || index} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(150px,0.8fr)_minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-400">Field label</label>
                      <input
                        value={field.label || ''}
                        onChange={(event) => updateProductField(index, { label: event.target.value })}
                        placeholder="e.g. Expiry date"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-400">Field type</label>
                      <select
                        value={field.type || 'text'}
                        onChange={(event) => updateProductField(index, { type: event.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Yes / no</option>
                      </select>
                    </div>
                    {field.type === 'select' ? (
                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">Options (comma-separated)</label>
                        <input
                          value={(field.options || []).join(', ')}
                          onChange={(event) => updateProductField(index, { options: event.target.value.split(',').map((option) => option.trim()).filter(Boolean) })}
                          placeholder="Small, Medium, Large"
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100"
                        />
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 pb-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(event) => updateProductField(index, { required: event.target.checked })}
                        />
                        Required
                      </label>
                    )}
                    <div className="flex items-center gap-3">
                      {field.type === 'select' && (
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(event) => updateProductField(index, { required: event.target.checked })}
                          />
                          Required
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => setTempShopSettings((current) => ({
                          ...current,
                          productFields: current.productFields.filter((_, fieldIndex) => fieldIndex !== index),
                        }))}
                        className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/30"
                        aria-label={`Remove ${field.label || 'custom'} field`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              <div className="flex justify-end border-t border-slate-800 pt-5">
                <button onClick={handleShopSave} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500">
                  <Save className="h-4 w-4" />
                  Save Business Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (

            <div className="space-y-6 text-slate-100">

              {/* Basic Printer Settings */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Receipt / Bill Format
                  </label>
                  <select
                    value={tempPrinterSettings.receiptPaperSize || 'pos'}
                    onChange={(e) => setTempPrinterSettings({
                      ...tempPrinterSettings,
                      receiptPaperSize: e.target.value,
                    })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="pos">POS / Thermal receipt</option>
                    <option value="A4">A4 bill</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    Applies to sale, return and due-collection receipts, plus report reprints.
                  </p>
                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Paper Size

                  </label>

                  <select

                    value={tempPrinterSettings.paperSize}

                    onChange={(e) => setTempPrinterSettings({...tempPrinterSettings, paperSize: e.target.value})}

                    className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                  >

                    <option value="40mm">40mm (Thermal)</option>

                    <option value="58mm">58mm</option>

                    <option value="80mm">80mm</option>

                  </select>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Printer Model

                  </label>

                  <select

                    value={tempPrinterSettings.printerModel}

                    onChange={(e) => setTempPrinterSettings({...tempPrinterSettings, printerModel: e.target.value})}

                    className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                  >

                    <option value="Epson TM-T20">Epson TM-T20</option>

                    <option value="Epson TM-T88V">Epson TM-T88V</option>

                    <option value="Star TSP143">Star TSP143</option>

                    <option value="Bixolon SRP-350">Bixolon SRP-350</option>

                    <option value="Generic">Generic Thermal Printer</option>

                  </select>

                </div>

              </div>



              <div className="space-y-6 text-slate-100">

                <h3 className="text-lg font-medium text-slate-100">Receipt Options</h3>



                <div className="space-y-3">

                  <label className="flex items-center gap-3">

                    <input

                      type="checkbox"

                      checked={tempPrinterSettings.printLogo}

                      onChange={(e) => setTempPrinterSettings({...tempPrinterSettings, printLogo: e.target.checked})}

                      className="w-4 h-4 text-blue-400 border-slate-700 rounded focus:ring-blue-500/50 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    />

                    <span className="text-sm font-medium text-slate-300">Print shop logo on receipts</span>

                  </label>



                  <label className="flex items-center gap-3">

                    <input

                      type="checkbox"

                      checked={tempPrinterSettings.printTax}

                      onChange={(e) => setTempPrinterSettings({...tempPrinterSettings, printTax: e.target.checked})}

                      className="w-4 h-4 text-blue-400 border-slate-700 rounded focus:ring-blue-500/50 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    />

                    <span className="text-sm font-medium text-slate-300">Show GST breakdown (CGST/SGST)</span>

                  </label>



                  <label className="flex items-center gap-3">

                    <input

                      type="checkbox"

                      checked={tempPrinterSettings.receiptFormat?.showBarcode}

                      onChange={(e) => setTempPrinterSettings({

                        ...tempPrinterSettings, 

                        receiptFormat: {...tempPrinterSettings.receiptFormat, showBarcode: e.target.checked}

                      })}

                      className="w-4 h-4 text-blue-400 border-slate-700 rounded focus:ring-blue-500/50 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    />

                    <span className="text-sm font-medium text-slate-300">Show barcode on receipts</span>

                  </label>

                </div>

              </div>



              {/* Receipt Format Customization */}

              <div className="space-y-6 border-t border-slate-800 pt-6">

                <h3 className="text-lg font-medium text-slate-100">Receipt Format Customization</h3>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">

                      Font Family

                    </label>

                    <select

                      value={tempPrinterSettings.receiptFormat?.fontFamily || 'monospace'}

                      onChange={(e) => setTempPrinterSettings({

                        ...tempPrinterSettings,

                        receiptFormat: {...tempPrinterSettings.receiptFormat, fontFamily: e.target.value}

                      })}

                      className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    >

                      <option value="monospace">Monospace</option>

                      <option value="Arial, sans-serif">Arial</option>

                      <option value="Times New Roman, serif">Times New Roman</option>

                      <option value="Courier New, monospace">Courier New</option>

                    </select>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">

                      Font Size

                    </label>

                    <select

                      value={tempPrinterSettings.receiptFormat?.fontSize || '12px'}

                      onChange={(e) => setTempPrinterSettings({

                        ...tempPrinterSettings,

                        receiptFormat: {...tempPrinterSettings.receiptFormat, fontSize: e.target.value}

                      })}

                      className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    >

                      <option value="6px">6px (Very Small)</option>

                      <option value="7px">7px (Small)</option>

                      <option value="8px">8px (Compact)</option>

                      <option value="10px">10px</option>

                      <option value="12px">12px</option>

                      <option value="14px">14px</option>

                      <option value="16px">16px</option>

                    </select>

                  </div>

                </div>



                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">

                      Header Font Size

                    </label>

                    <select

                      value={tempPrinterSettings.receiptFormat?.headerFontSize || '14px'}

                      onChange={(e) => setTempPrinterSettings({

                        ...tempPrinterSettings,

                        receiptFormat: {...tempPrinterSettings.receiptFormat, headerFontSize: e.target.value}

                      })}

                      className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    >

                      <option value="8px">8px</option>

                      <option value="10px">10px</option>

                      <option value="12px">12px</option>

                      <option value="14px">14px</option>

                      <option value="16px">16px</option>

                    </select>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">

                      Footer Font Size

                    </label>

                    <select

                      value={tempPrinterSettings.receiptFormat?.footerFontSize || '10px'}

                      onChange={(e) => setTempPrinterSettings({

                        ...tempPrinterSettings,

                        receiptFormat: {...tempPrinterSettings.receiptFormat, footerFontSize: e.target.value}

                      })}

                      className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    >

                      <option value="6px">6px</option>

                      <option value="7px">7px</option>

                      <option value="8px">8px</option>

                      <option value="10px">10px</option>

                      <option value="12px">12px</option>

                    </select>

                  </div>

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Header Text

                  </label>

                  <input

                    type="text"

                    value={tempPrinterSettings.receiptFormat?.headerText || ''}

                    onChange={(e) => setTempPrinterSettings({

                      ...tempPrinterSettings,

                      receiptFormat: {...tempPrinterSettings.receiptFormat, headerText: e.target.value}

                    })}

                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="Thank you for shopping with us!"

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Footer Text

                  </label>

                  <input

                    type="text"

                    value={tempPrinterSettings.receiptFormat?.footerText || ''}

                    onChange={(e) => setTempPrinterSettings({

                      ...tempPrinterSettings,

                      receiptFormat: {...tempPrinterSettings.receiptFormat, footerText: e.target.value}

                    })}

                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="Visit again soon!"

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-slate-300 mb-2">

                    Custom Message

                  </label>

                  <textarea

                    value={tempPrinterSettings.receiptFormat?.customMessage || ''}

                    onChange={(e) => setTempPrinterSettings({

                      ...tempPrinterSettings,

                      receiptFormat: {...tempPrinterSettings.receiptFormat, customMessage: e.target.value}

                    })}

                    rows="2"

                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                    placeholder="Exchange policy: 7 days with bill"

                  />

                </div>



                {/* Footer Image Settings */}

                <div className="space-y-4">

                  <h4 className="font-medium text-slate-100">Footer Image Settings</h4>



                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">

                      Footer Image

                    </label>

                    <div className="flex items-center gap-4">

                      {tempPrinterSettings.receiptFormat?.footerImage && (

                        <img

                          src={tempPrinterSettings.receiptFormat.footerImage}

                          alt="Footer"

                          className="w-16 h-16 object-contain border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder:text-slate-500"

                        />

                      )}

                      <div className="flex-1">

                        <input

                          type="file"

                          accept="image/*"

                          onChange={(e) => {

                            const file = e.target.files[0];

                            if (file) {

                              const reader = new FileReader();

                              reader.onload = (e) => {

                                setTempPrinterSettings({

                                  ...tempPrinterSettings,

                                  receiptFormat: {

                                    ...tempPrinterSettings.receiptFormat,

                                    footerImage: e.target.result

                                  }

                                });

                              };

                              reader.readAsDataURL(file);

                            }

                          }}

                          className="hidden"

                          id="footer-image-upload"

                        />

                        <label

                          htmlFor="footer-image-upload"

                          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"

                        >

                          <Upload className="w-4 h-4" />

                          Upload Footer Image

                        </label>

                      </div>

                    </div>

                  </div>



                  <div className="grid grid-cols-3 gap-4">

                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">

                        Image Width (px)

                      </label>

                      <input

                        type="number"

                        value={tempPrinterSettings.receiptFormat?.footerImageSize?.width || 30}

                        onChange={(e) => setTempPrinterSettings({

                          ...tempPrinterSettings,

                          receiptFormat: {

                            ...tempPrinterSettings.receiptFormat,

                            footerImageSize: {

                              ...tempPrinterSettings.receiptFormat?.footerImageSize,

                              width: parseInt(e.target.value)

                            }

                          }

                        })}

                        className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                        min="10"

                        max="100"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">

                        Image Height (px)

                      </label>

                      <input

                        type="number"

                        value={tempPrinterSettings.receiptFormat?.footerImageSize?.height || 15}

                        onChange={(e) => setTempPrinterSettings({

                          ...tempPrinterSettings,

                          receiptFormat: {

                            ...tempPrinterSettings.receiptFormat,

                            footerImageSize: {

                              ...tempPrinterSettings.receiptFormat?.footerImageSize,

                              height: parseInt(e.target.value)

                            }

                          }

                        })}

                        className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                        min="10"

                        max="50"

                      />

                    </div>



                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">

                        Image Position

                      </label>

                      <select

                        value={tempPrinterSettings.receiptFormat?.footerImagePosition || 'center'}

                        onChange={(e) => setTempPrinterSettings({

                          ...tempPrinterSettings,

                          receiptFormat: {

                            ...tempPrinterSettings.receiptFormat,

                            footerImagePosition: e.target.value

                          }

                        })}

                        className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-950 text-slate-100 placeholder:text-slate-500"

                      >

                        <option value="left">Left</option>

                        <option value="center">Center</option>

                        <option value="right">Right</option>

                      </select>

                    </div>

                  </div>

                </div>

              </div>



              <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4">

                <h4 className="font-medium text-amber-200 mb-2">40mm Thermal Printer Settings</h4>

                <p className="text-sm text-amber-300 mb-3">

                  Optimized for small thermal printers. Font sizes are automatically adjusted for better readability on narrow paper.

                </p>

                <div className="text-xs text-amber-400">

                  <p>• Recommended font size: 6-8px</p>

                  <p>• Image size: 30x15px maximum</p>

                  <p>• Keep text concise for better formatting</p>

                </div>

              </div>



              <div className="bg-blue-950/40 border border-blue-800 rounded-lg p-4">

                <h4 className="font-medium text-blue-200 mb-2">Printer Connection</h4>

                <p className="text-sm text-blue-300 mb-3">

                  Make sure your thermal printer is connected via USB or network and has the correct drivers installed.

                </p>

                <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">

                  Test Print

                </button>

              </div>



              <div className="flex justify-end">

                <button

                  onClick={handlePrinterSave}

                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 font-medium"

                >

                  <Save className="w-4 h-4" />

                  Save Printer Settings

                </button>

              </div>

            </div>

          )}



          {activeTab === 'data' && (

            <div className="space-y-6 text-slate-100">

              <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-6">

                <h3 className="text-lg font-medium text-slate-100 mb-4">Data Management</h3>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">

                    <h4 className="font-medium text-slate-100">Export Data</h4>

                    <p className="text-sm text-slate-400">

                      Export all your shop data including products, sales, users, and settings.

                    </p>

                    <button

                      onClick={exportData}

                      className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"

                    >

                      <Download className="w-4 h-4" />

                      Export All Data

                    </button>

                  </div>



                  <div className="space-y-4">

                    <h4 className="font-medium text-slate-100">Import Data</h4>

                    <p className="text-sm text-slate-400">

                      Import data from a previously exported file. This will overwrite existing data.

                    </p>

                    <div>

                      <input

                        type="file"

                        accept=".json"

                        onChange={importData}

                        className="hidden"

                        id="import-data"

                      />

                      <label

                        htmlFor="import-data"

                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"

                      >

                        <Upload className="w-4 h-4" />

                        Import Data

                      </label>

                    </div>

                  </div>

                </div>



                <div className="mt-8 p-4 bg-yellow-950/30 border border-yellow-800 rounded-lg">

                  <h4 className="font-medium text-yellow-200 mb-2">⚠️ Important Notes</h4>

                  <ul className="text-sm text-yellow-300 space-y-1">

                    <li>• Always backup your data before importing new data</li>

                    <li>• Import will overwrite all existing data</li>

                    <li>• Make sure the import file is from the same POS system</li>

                    <li>• Refresh the page after importing data</li>

                    <li>• Returns and dues (including collections) are included in export/import</li>

                  </ul>

                </div>

              </div>



              <div className="flex justify-end">

                <button

                  onClick={() => alert('Data management settings saved!')}

                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 font-medium"

                >

                  <Save className="w-4 h-4" />

                  Save Settings

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

};



export default Settings;
