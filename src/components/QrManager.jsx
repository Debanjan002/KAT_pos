import React, { useState } from 'react';
import QRCode from 'qrcode';

const HISTORY_KEY = 'pos_qr_history';
const QR_SETTINGS_KEY = 'pos_qr_settings';
const MAX_BATCH_SIZE = 100;
const DEFAULT_QR_SETTINGS = {
  prefix: 'KAT',
  nextNumber: 1,
  digits: 6,
  batchName: 'QR batch',
  labelTitle: 'KAT POS',
  labelFooter: '',
  paperWidth: '40mm',
};

const readJson = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return fallback;
  }
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const QrManager = () => {
  const [qrSettings, setQrSettings] = useState(() => ({
    ...DEFAULT_QR_SETTINGS,
    ...readJson(QR_SETTINGS_KEY, {}),
  }));
  const [history, setHistory] = useState(() => readJson(HISTORY_KEY, []));
  const [batchSize, setBatchSize] = useState('10');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);

  const updateQrSetting = (key, value) => {
    setQrSettings((current) => ({ ...current, [key]: value }));
  };

  const saveQrSettings = () => {
    try {
      localStorage.setItem(QR_SETTINGS_KEY, JSON.stringify(qrSettings));
      setMessage({ type: 'success', text: 'QR label settings saved.' });
    } catch (error) {
      console.error('Could not save QR settings:', error);
      setMessage({ type: 'error', text: 'Could not save QR settings. Check available browser storage.' });
    }
  };

  const generateBatch = () => {
    const count = Number(batchSize);
    const prefix = String(qrSettings.prefix || '').trim();
    const firstNumber = Number(qrSettings.nextNumber);
    const digits = Number(qrSettings.digits);

    if (!Number.isInteger(count) || count < 1 || count > MAX_BATCH_SIZE) {
      setMessage({ type: 'error', text: `Batch size must be between 1 and ${MAX_BATCH_SIZE}.` });
      return;
    }
    if (!/^[A-Za-z0-9_-]{1,12}$/.test(prefix)) {
      setMessage({ type: 'error', text: 'Prefix must contain 1–12 letters, numbers, hyphens, or underscores.' });
      return;
    }
    if (!Number.isSafeInteger(firstNumber) || firstNumber < 0) {
      setMessage({ type: 'error', text: 'Next number must be a non-negative whole number.' });
      return;
    }
    if (!Number.isInteger(digits) || digits < 1 || digits > 12) {
      setMessage({ type: 'error', text: 'Number length must be between 1 and 12 digits.' });
      return;
    }
    if (!String(qrSettings.batchName || '').trim() || !String(qrSettings.labelTitle || '').trim()) {
      setMessage({ type: 'error', text: 'Enter a batch name and label heading before generating.' });
      return;
    }

    const usedValues = new Set(history.flatMap((batch) => (batch.codes || []).map((code) => {
      const value = String(code.value ?? '');
      const previousNumber = String(code.number ?? value.match(/\d+$/)?.[0] ?? '');
      const previousPrefix = String(batch.settings?.prefix || '').trim();
      return previousPrefix && previousNumber
        ? `${previousPrefix}_${previousNumber.padStart(Number(batch.settings?.digits) || digits, '0')}`
        : value;
    })));
    const codes = [];
    let number = firstNumber;
    while (codes.length < count && number <= Number.MAX_SAFE_INTEGER) {
      const displayValue = `${prefix}_${String(number).padStart(digits, '0')}`;
      const value = displayValue;
      if (!usedValues.has(value)) codes.push({ value, number, displayValue });
      number += 1;
    }
    if (codes.length !== count) {
      setMessage({ type: 'error', text: 'Could not find enough unique QR numbers. Adjust the prefix or next number.' });
      return;
    }

    setWorking(true);
    setMessage(null);

    const settingsSnapshot = {
      prefix,
      digits,
      batchName: String(qrSettings.batchName).trim(),
      labelTitle: String(qrSettings.labelTitle).trim(),
      labelFooter: String(qrSettings.labelFooter || '').trim(),
      paperWidth: qrSettings.paperWidth,
    };
    const batch = {
      id: `QRB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      name: String(qrSettings.batchName).trim(),
      codes: codes.map(({ value, number: codeNumber, displayValue }) => ({
        value,
        number: codeNumber,
        displayValue,
      })),
      settings: settingsSnapshot,
    };

    try {
      const nextHistory = [batch, ...history];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      const nextQrSettings = { ...qrSettings, nextNumber: number };
      localStorage.setItem(QR_SETTINGS_KEY, JSON.stringify(nextQrSettings));
      setHistory(nextHistory);
      setQrSettings(nextQrSettings);
      setMessage({ type: 'success', text: `${codes.length} unique QR codes saved to batch history.` });
    } catch (error) {
      console.error('Could not save generated QR history:', error);
      setMessage({ type: 'error', text: 'Could not save QR history. Check available browser storage.' });
    } finally {
      setWorking(false);
    }
  };

  const printBatch = async (batch) => {
    let printWindow;
    try {
      const settings = { ...DEFAULT_QR_SETTINGS, ...(batch.settings || {}) };
      const isA4 = settings.paperWidth === 'A4';
      const pageSize = isA4 ? 'A4 portrait' : `${settings.paperWidth} auto`;
      const pageMargin = isA4 ? '8mm' : '2mm';
      const qrImages = await Promise.all(batch.codes.map((code) => QRCode.toDataURL(code.value, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
      })));
      printWindow = window.open('', '_blank', 'width=500,height=700');
      if (!printWindow) {
        setMessage({ type: 'error', text: 'Allow pop-ups to open QR labels for printing.' });
        return;
      }
      const labels = batch.codes.map((code, index) => `
        <article class="label${isA4 ? ' a4-label' : ''}">
          <strong class="title">${escapeHtml(settings.labelTitle)}</strong>
          <img class="qr" src="${qrImages[index]}" alt="QR code ${escapeHtml(code.displayValue || code.value)}" />
          <div class="code">${escapeHtml(code.displayValue || `${settings.prefix}${String(code.value).padStart(settings.digits, '0')}`)}</div>
          ${settings.labelFooter ? `<div class="footer">${escapeHtml(settings.labelFooter)}</div>` : ''}
        </article>
      `).join('');
      printWindow.document.write(`<!doctype html>
        <html><head><meta charset="utf-8"><title>QR Labels - ${escapeHtml(batch.name || batch.productName || batch.id)}</title>
        <style>
          @page { size: ${pageSize}; margin: ${pageMargin}; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
          .labels { width: 100%; }
          .label { width: 100%; min-height: 30mm; padding: 2mm 1mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; break-after: page; overflow-wrap: anywhere; }
          .title { font-size: 9pt; line-height: 1.15; }
          .footer { font-size: 7pt; margin-top: 1mm; }
          .qr { display: block; width: 24mm; height: 24mm; object-fit: contain; margin: 1mm auto; }
          .code { font-family: monospace; font-size: 8pt; font-weight: 700; letter-spacing: .3pt; }
          ${isA4 ? `
            @media print {
              .labels { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; align-content: start; }
              .a4-label { min-height: 62mm; padding: 3mm 1mm; page-break-after: auto; break-after: auto; page-break-inside: avoid; break-inside: avoid; }
              .a4-label .qr { width: 34mm; height: 34mm; }
            }
            @media screen {
              body { background: #ddd; }
              .labels { width: 210mm; min-height: 297mm; padding: 8mm; margin: 4mm auto; background: white; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; align-content: start; box-shadow: 0 1px 5px #777; }
              .a4-label { min-height: 62mm; padding: 3mm 1mm; }
              .a4-label .qr { width: 34mm; height: 34mm; }
            }
          ` : `
            @media screen { body { background: #ddd; } .label { width: ${escapeHtml(settings.paperWidth)}; min-height: 35mm; background: white; margin: 4mm auto; box-shadow: 0 1px 5px #777; } }
          `}
        </style></head><body><div class="labels">${labels}</div>
        <script>window.addEventListener('load', () => { Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }))).then(() => setTimeout(() => window.print(), 200)); });</script>
        </body></html>`);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error('Could not prepare QR labels for printing:', error);
      if (printWindow && !printWindow.closed) printWindow.close();
      setMessage({ type: 'error', text: 'Could not create printable QR labels.' });
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-white">QR Batch Generator</h1>
        <p className="mt-1 text-slate-400">Generate general-purpose QR codes in batches of up to {MAX_BATCH_SIZE}. Each QR encodes one unique ID in the format initials_number, such as KAT_001, and is independent of inventory.</p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Generate a batch</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
              Batch name
              <input value={qrSettings.batchName} onChange={(event) => updateQrSetting('batchName', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              QR prefix
              <input value={qrSettings.prefix} maxLength={12} onChange={(event) => updateQrSetting('prefix', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Next number
              <input type="number" min="0" step="1" value={qrSettings.nextNumber} onChange={(event) => updateQrSetting('nextNumber', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Number length (zero padding)
              <input type="number" min="1" max="12" step="1" value={qrSettings.digits} onChange={(event) => updateQrSetting('digits', Number(event.target.value))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Batch size (1–100)
              <input type="number" min="1" max={MAX_BATCH_SIZE} step="1" value={batchSize} onChange={(event) => setBatchSize(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
            </label>
          </div>

          <div className="border-t border-slate-800 pt-5">
            <h3 className="mb-4 font-semibold text-white">Print format and label details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Label heading
                <input value={qrSettings.labelTitle} onChange={(event) => updateQrSetting('labelTitle', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Label footer
                <input value={qrSettings.labelFooter} onChange={(event) => updateQrSetting('labelFooter', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100" />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                Paper width
                <select value={qrSettings.paperWidth} onChange={(event) => updateQrSetting('paperWidth', event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100">
                  <option value="40mm">40 mm</option>
                  <option value="50mm">50 mm</option>
                  <option value="58mm">58 mm</option>
                  <option value="80mm">80 mm</option>
                  <option value="A4">A4 sheet</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={saveQrSettings} className="rounded-lg border border-slate-700 px-4 py-3 font-medium text-slate-200 hover:bg-slate-800">Save label settings</button>
            <button type="button" onClick={generateBatch} disabled={working} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              {working ? 'Generating…' : `Generate ${batchSize || 0} QR codes`}
            </button>
          </div>
          {message && <p role="status" className={`text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{message.text}</p>}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-1 text-lg font-semibold text-white">QR batch history</h2>
          <p className="mb-4 text-sm text-slate-400">Saved on this device. Reprint labels from any previous batch.</p>
          {history.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">No QR batches generated yet.</p>
          ) : (
            <div className="max-h-[680px] space-y-3 overflow-auto pr-1">
              {history.map((batch) => (
                <article key={batch.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-100">{batch.name || batch.productName || 'QR batch'}</h3>
                      <p className="mt-1 text-xs text-slate-400">{new Date(batch.createdAt).toLocaleString()} · {batch.codes.length} QR code(s)</p>
                      <p className="mt-1 break-all font-mono text-xs text-cyan-300">
                        {batch.codes[0]?.displayValue || `${batch.settings?.prefix || ''}${batch.codes[0]?.value}`}
                        {batch.codes.length > 1 ? ` … ${batch.codes[batch.codes.length - 1].displayValue || `${batch.settings?.prefix || ''}${batch.codes[batch.codes.length - 1].value}`}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => printBatch(batch)} className="rounded-lg border border-cyan-700/60 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-950/40">Print batch</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default QrManager;
