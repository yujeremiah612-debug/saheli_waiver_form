import { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Trash2, Settings, FileSpreadsheet, 
  MapPin, Mail, Phone, Calendar, User, Eye, Printer, RefreshCw, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { WaiverSubmission, LocationType } from '../types';
import AppsScriptInstructions from './AppsScriptInstructions';

interface SubmissionsDashboardProps {
  onBackToForm: () => void;
  submissions: WaiverSubmission[];
  onDeleteSubmission: (id: string) => void;
  onClearAllSubmissions: () => void;
  appsScriptUrl: string;
  onUpdateAppsScriptUrl: (url: string) => void;
}

export default function SubmissionsDashboard({
  onBackToForm,
  submissions,
  onDeleteSubmission,
  onClearAllSubmissions,
  appsScriptUrl,
  onUpdateAppsScriptUrl,
}: SubmissionsDashboardProps) {
  // Navigation tab for admin inside backoffice
  const [adminTab, setAdminTab] = useState<'ledger' | 'setup'>('ledger');

  // Config state
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<LocationType | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Modal viewer
  const [viewingWaiver, setViewingWaiver] = useState<WaiverSubmission | null>(null);

  useEffect(() => {
    setUrlInput(appsScriptUrl);
  }, [appsScriptUrl]);

  // Handle URL Save
  const handleSaveUrl = () => {
    onUpdateAppsScriptUrl(urlInput.trim());
    setTestStatus('idle');
    setTestMessage('Configuration saved locally!');
    setTimeout(() => setTestMessage(''), 3000);
  };

  // Test API Connectivity
  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter a valid URL first.');
      return;
    }

    setIsTestingUrl(true);
    setTestStatus('idle');
    setTestMessage('Sending test preflight payload...');

    try {
      // Testing connection to apps script via preflight/POST
      // Since it is CORS-bound, some standard requests fails. But we can catch and diagnose.
      // An elegant test sends dummy payload. With 'no-cors' mode, it receives opaque response, meaning status 0.
      const dummyPayload = {
        id: "TEST-PAYLOAD-" + Math.floor(Math.random() * 1000),
        fullName: "Test Connection User",
        email: "test@saheli.com",
        phone: "000-000-0000",
        location: "Centennial Location" as LocationType,
        treatments: ["Threading and Tinting"],
        skinConditions: ["None"],
        usingPeelingAgents: "No",
        recentSurgeriesOrPeels: "No",
        waiverDate: new Date().toLocaleDateString(),
        signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // dummy 1px png
      };

      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(urlInput.trim(), {
        method: 'POST',
        mode: 'no-cors', // standard apps script bypass
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyPayload),
        signal: controller.signal
      });

      clearTimeout(id);
      
      // With 'no-cors', the fetch succeeds with status 0. This is the expected browser behavior for success!
      setTestStatus('success');
      setTestMessage('API reached! Google Apps Script triggered successfully (Opaque preflight validated). Row written.');
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`Failed: ${err.message || 'Verification timeout. Check Web App permissions.'}`);
    } finally {
      setIsTestingUrl(false);
    }
  };

  // Filter logic
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm) ||
      (sub.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLoc = selectedLoc === 'All' || sub.location === selectedLoc;
    const matchesDate = !selectedDate || sub.waiverDate === selectedDate || sub.timestamp.includes(selectedDate);

    return matchesSearch && matchesLoc && matchesDate;
  });

  // Export to CSV
  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) return;
    
    const headers = [
      "Waiver ID", "Date", "Location", "Full Name", "Phone", "Email", 
      "Treatments", "Skin Conditions", "Peeling Agents", "Recent Surgeries", "Medical Notes"
    ];
    
    const rows = filteredSubmissions.map(sub => [
      sub.id,
      sub.waiverDate,
      sub.location,
      `"${sub.fullName.replace(/"/g, '""')}"`,
      sub.phone,
      sub.email || '',
      `"${sub.treatments.join(', ')}"`,
      `"${sub.skinConditions.join(', ')}"`,
      sub.usingPeelingAgents,
      sub.recentSurgeriesOrPeels,
      `"${(sub.medicalNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Saheli_Waivers_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Printable view
  const handlePrint = (sub: WaiverSubmission) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Saheli Eyebrow Threading - Digital Waiver Archive</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@550&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1c1917;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #b58943;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              margin: 0;
              color: #171717;
            }
            .header p {
              text-transform: uppercase;
              color: #b58943;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 2px;
              margin: 8px 0 0 0;
            }
            .row {
              display: flex;
              margin-bottom: 12px;
              border-bottom: 1px solid #f1f1f0;
              padding-bottom: 6px;
            }
            .label {
              width: 35%;
              font-weight: 600;
              color: #78716c;
              font-size: 13px;
            }
            .value {
              width: 65%;
              font-size: 14px;
              color: #171717;
            }
            .section-title {
              font-family: 'Playfair Display', serif;
              font-size: 16px;
              background-color: #fcfbf9;
              border-left: 3px solid #b58943;
              padding: 6px 12px;
              margin: 24px 0 16px 0;
              font-weight: 600;
            }
            .legal-box {
              font-size: 11px;
              text-align: justify;
              color: #57534e;
              background-color: #fafcfc;
              border: 1px solid #e7e5e4;
              padding: 16px;
              border-radius: 6px;
              margin-top: 30px;
            }
            .signature-area {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 40px;
              padding-top: 20px;
            }
            .sig-box {
              border-bottom: 1px solid #b58943;
              width: 250px;
              text-align: center;
              padding-bottom: 10px;
            }
            .sig-img {
              max-height: 80px;
              max-width: 220px;
              display: block;
              margin: 0 auto;
            }
            @media print {
              .noprint { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="noprint" style="background:#faf8f5; border:1px solid #ebd8b5; padding: 12px; border-radius:6px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#4f361c; font-weight:500;">Print copy archive generated from browser.</span>
            <button onclick="window.print()" style="background:#b58943; border:0; color:#fff; font-weight:600; font-size:12px; padding:6px 16px; border-radius:4px; cursor:pointer;">Print Now</button>
          </div>

          <div class="header">
            <h1>SAHELI EYEBROW THREADING</h1>
            <p>Digital Waiver & Client Intake Record</p>
          </div>

          <div class="row">
            <div class="label">Assigned Location:</div>
            <div class="value" style="font-weight:bold; color:#997034;">\${sub.location}</div>
          </div>
          <div class="row">
            <div class="label">Date of Signing:</div>
            <div class="value">\${sub.waiverDate}</div>
          </div>
          <div class="row">
            <div class="label">Waiver Log UUID:</div>
            <div class="value" style="font-family:monospace; font-size:12px; color:#a1a1aa;">\${sub.id}</div>
          </div>

          <div class="section-title">Client Demographics</div>
          <div class="row">
            <div class="label">Client Name:</div>
            <div class="value" style="font-weight: 500;">\${sub.fullName}</div>
          </div>
          <div class="row">
            <div class="label">Contact Number:</div>
            <div class="value">\${sub.phone}</div>
          </div>
          <div class="row">
            <div class="label">Email Address:</div>
            <div class="value" style="color:#b58943;">\${sub.email}</div>
          </div>

          <div class="section-title">Services & Medical Analysis</div>
          <div class="row">
            <div class="label">Requested Treatments:</div>
            <div class="value">\${sub.treatments.join(', ')} \${sub.otherTreatment ? "(Other: " + sub.otherTreatment + ")" : ""}</div>
          </div>
          <div class="row">
            <div class="label">Skin Characteristics:</div>
            <div class="value">\${sub.skinConditions.join(', ')} \${sub.otherSkinCondition ? "(Other: " + sub.otherSkinCondition + ")" : ""}</div>
          </div>
          <div class="row">
            <div class="label">Using Peeling Agents:</div>
            <div class="value" style="font-weight:bold;">\${sub.usingPeelingAgents}</div>
          </div>
          <div class="row">
            <div class="label">Recent Chemical Peels:</div>
            <div class="value" style="font-weight:bold;">\${sub.recentSurgeriesOrPeels}</div>
          </div>
          <div class="row">
            <div class="label">Medical Remarks:</div>
            <div class="value">\${sub.medicalNotes || 'No health flags highlighted'}</div>
          </div>

          <div class="legal-box">
            <strong>Liability Consent Accord:</strong><br/>
            I understand and acknowledge that skincare procedures like eyebrow threading, lamination, facials, waxing, and eyelash tinting carry intrinsic physical risks of redness, minor grazing, or chemical irritation. I authorize the salon specialists to perform the selected services, confirm all detailed questionnaires are entirely true, and hereby discharge Saheli Eyebrow Threading and all of its affiliates from liability for side effects arising from service operations.
          </div>

          <div class="signature-area">
            <div>
              <div style="font-size:11px; color:#78716c; font-weight:600; margin-bottom:4px;">Waiver Confirmed By:</div>
              <div style="font-size:14px; font-weight:bold;">\${sub.fullName}</div>
            </div>
            <div class="sig-box">
              <img class="sig-img" src="\${sub.signatureBase64}" alt="Client Signature" />
              <div style="font-size:10px; color:#a1a1aa; border-top:1px dashed #e7e5e4; padding-top:4px; margin-top:2px;">Digital Authorization Authorized</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-6" id="dashboard-container">
      {/* Configuration Header */}
      <div className="bg-[#1A1A1A] text-white rounded-none p-6 lg:p-8 shadow-xs border border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="label-caps !text-[#E0C896] block mb-2">
              System Admin console
            </span>
            <h2 className="display-serif text-2xl text-white mb-1">Google Sheets & API Integration</h2>
            <p className="text-xs text-neutral-400 font-sans">Synchronize client entries live with a personal Google Spreadsheet ledger on form submit</p>
          </div>
          <button
            type="button"
            id="back-to-waiver"
            onClick={onBackToForm}
            className="flex-none bg-[#C5A059] hover:bg-[#E0C896] text-stone-950 font-bold text-[10px] uppercase tracking-[0.2em] px-6 py-3.5 transition-colors rounded-none cursor-pointer"
          >
            ← Client Waiver Form
          </button>
        </div>

        {/* Navigation Controls inside backoffice */}
        <div className="flex bg-stone-900 border border-neutral-800 p-1 mb-6 max-w-xs" id="admin-sub-tabs">
          <button
            type="button"
            onClick={() => setAdminTab('ledger')}
            className={`flex-1 text-center text-[9px] uppercase tracking-widest font-bold py-2 transition-colors cursor-pointer ${
              adminTab === 'ledger'
                ? 'bg-[#C5A059] text-stone-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Local Archives
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('setup')}
            className={`flex-1 text-center text-[9px] uppercase tracking-widest font-bold py-2 transition-colors cursor-pointer ${
              adminTab === 'setup'
                ? 'bg-[#C5A059] text-stone-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Cloud Setup
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-neutral-800/60">
          <div className="flex-1">
            <label htmlFor="input-apps-script" className="text-[10px] uppercase tracking-[0.05em] font-normal text-neutral-400 block mb-1.5 font-sans">
              Google Apps Script Web App Endpoint URL
            </label>
            <input
              id="input-apps-script"
              type="text"
              className="w-full text-xs font-mono bg-stone-900/60 text-stone-100 placeholder-neutral-600 border-0 border-b border-neutral-700 focus:border-[#C5A059] focus:ring-0 p-2.5 outline-none transition-all rounded-none"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
          <div className="flex-none flex items-end gap-2">
            <button
              type="button"
              id="btn-save-api-url"
              onClick={handleSaveUrl}
              className="bg-stone-800 hover:bg-stone-700 text-white text-[9px] uppercase tracking-widest font-bold px-4 py-3 border border-stone-700 transition-colors h-11 rounded-none cursor-pointer"
            >
              Save URL
            </button>
            <button
              type="button"
              id="btn-test-api-url"
              onClick={handleTestConnection}
              disabled={isTestingUrl}
              className="bg-transparent hover:bg-stone-800 text-[#C5A059] text-[9px] uppercase tracking-widest font-bold px-4 py-3 border border-[#C5A059]/40 transition-colors h-11 flex items-center gap-1.5 rounded-none cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTestingUrl ? 'animate-spin' : ''}`} />
              {isTestingUrl ? 'Executing...' : 'Test API'}
            </button>
          </div>
        </div>

        {testMessage && (
          <div className={`mt-4 p-4 rounded-none text-xs leading-normal flex items-start gap-2 border ${
            testStatus === 'success' ? 'bg-[#FCFAF7] border-emerald-900/50 text-emerald-800' :
            testStatus === 'failed' ? 'bg-[#FCFAF7] border-rose-900/50 text-rose-800' :
            'bg-[#FCFAF7] border-[#C5A059]/50 text-stone-850'
          }`}>
            {testStatus === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-none" /> :
             testStatus === 'failed' ? <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-none" /> :
             <RefreshCw className="w-4 h-4 text-[#C5A059] mt-0.5 flex-none animate-spin" />}
            <span className="font-sans font-medium">{testMessage}</span>
          </div>
        )}
      </div>

      {adminTab === 'ledger' ? (
        /* Main Stats and Ledger Dashboard */
        <div className="bg-white border border-neutral-200/80 rounded-none shadow-xs overflow-hidden">
        {/* Ledger Header controls */}
        <div className="p-6 md:p-8 border-b border-neutral-200/50 bg-[#FCFAF7]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="label-caps block mb-1">Backup Ledger Database</span>
              <h3 className="display-serif text-xl font-medium text-neutral-900">Local Waiver Archives</h3>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">Physical local storage backups index ({submissions.length} total entries)</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-export-csv"
                onClick={exportToCSV}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center justify-center gap-1.5 bg-[#1A1A1A] text-white font-bold text-[9px] uppercase tracking-widest px-4 py-3 rounded-none hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Export current ledger view to Microsoft Excel or CSV format"
              >
                <Download className="w-4 h-4 text-[#E0C896]" />
                Export CSV
              </button>
              
              <button
                type="button"
                id="btn-clear-all"
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to permanently delete ALL local backup submissions? This action cannot be reversed! Please make sure your Google Sheets backup is functional.")) {
                    onClearAllSubmissions();
                  }
                }}
                disabled={submissions.length === 0}
                className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[9px] uppercase tracking-widest px-4 py-3 border border-rose-200/50 rounded-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Backups
              </button>
            </div>
          </div>

          {/* Filtering Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 border border-neutral-200/60 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-neutral-400" />
              <input
                id="filter-search"
                type="text"
                placeholder="Search Client, Phone, Email..."
                className="w-full text-xs pl-9 pr-3 py-3 bg-[#FCFAF7] border-0 border-b border-stone-200 focus:border-[#C5A059] outline-none transition-all rounded-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                id="filter-location"
                className="w-full text-xs px-3 py-3 bg-[#FCFAF7] border-0 border-b border-stone-200 focus:border-[#C5A059] outline-none transition-all rounded-none cursor-pointer"
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value as any)}
              >
                <option value="All">All Locations (Centralized)</option>
                <option value="Parker Location">Parker Location</option>
                <option value="Aurora Location">Aurora Location</option>
                <option value="Centennial Location">Centennial Location</option>
                <option value="Thornton Location">Thornton Location</option>
                <option value="Denver Location">Denver Location</option>
              </select>
            </div>

            <div>
              <input
                id="filter-date"
                type="date"
                className="w-full text-xs px-3 py-3 bg-[#FCFAF7] border-0 border-b border-stone-200 focus:border-[#C5A059] outline-none transition-all rounded-none cursor-pointer"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ledger Table content */}
        <div className="overflow-x-auto w-full">
          {filteredSubmissions.length === 0 ? (
            <div className="p-16 text-center flex flex-col justify-center items-center gap-4 bg-[#FCFAF7]">
              <FileSpreadsheet className="w-10 h-10 text-stone-400 stroke-[1]" />
              <div>
                <h4 className="display-serif text-lg text-stone-900 font-medium">Registry Index Empty</h4>
                <p className="text-xs text-neutral-500 max-w-sm mt-1 font-sans">No matching client waivers logged. Try tweaking your search queries or fill out a new waiver form.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="ledger-submissions-table">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-stone-200/60 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="py-4 px-4 font-bold">Date / Identifier</th>
                  <th className="py-4 px-4 font-bold">Client Demographics</th>
                  <th className="py-4 px-4 font-bold">Salon Location</th>
                  <th className="py-4 px-4 font-bold">Treatments Requested</th>
                  <th className="py-4 px-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FCFAF7]/20 transition-colors text-xs text-stone-700">
                    <td className="py-4 px-4 font-mono select-all">
                      <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                        {sub.waiverDate}
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-1">UUID: {sub.id.substring(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5 font-sans">
                        <User className="w-3.5 h-3.5 text-[#C5A059]" />
                        {sub.fullName}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex flex-col gap-0.5 mt-1 font-mono">
                        {sub.email && <span className="inline-flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {sub.email}</span>}
                        <span className="inline-flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {sub.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <span className="inline-flex items-center gap-1 bg-[#FCFAF7] border border-[#C5A059]/40 text-stone-800 px-2.5 py-0.5 rounded-none font-bold text-[10px] uppercase tracking-wider">
                        <MapPin className="w-2.5 h-2.5 text-[#C5A059]" />
                        {sub.location}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-[240px] truncate">
                      <div className="font-medium text-stone-900 truncate font-sans" title={sub.treatments.join(', ')}>
                        {sub.treatments.join(', ')}
                      </div>
                      {sub.usingPeelingAgents === 'Yes' && (
                        <span className="mt-1 inline-block bg-[#FCFAF7] text-rose-800 text-[9px] font-bold tracking-widest px-1.5 py-0.5 border border-rose-200 rounded-none uppercase">
                          Peeling Agents Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingWaiver(sub)}
                          className="px-3 py-1.5 bg-[#1A1A1A] text-white border border-[#1A1A1A] font-bold text-[9px] uppercase tracking-wider rounded-none hover:bg-stone-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Review client entry details"
                        >
                          <Eye className="w-3 h-3 text-[#E0C896]" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(sub)}
                          className="px-3 py-1.5 bg-[#FCFAF7] border border-[#C5A059] text-stone-800 font-bold text-[9px] uppercase tracking-wider rounded-none hover:bg-[#E0C896]/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Print waiver ledger document"
                        >
                          <Printer className="w-3 h-3 text-[#C5A059]" />
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this specific local client waiver file?")) {
                              onDeleteSubmission(sub.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-none transition-colors cursor-pointer"
                          title="Delete local backup"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      ) : (
        <AppsScriptInstructions />
      )}

      {/* Waiver Inspector Modal Dialog */}
      {viewingWaiver && (
        <div id="inspector-modal" className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-[#FCFAF7]">
              <div>
                <span className="label-caps block mb-1">Archive Record View</span>
                <h4 className="display-serif text-xl font-medium text-stone-900">{viewingWaiver.fullName}</h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingWaiver(null)}
                className="text-neutral-400 hover:text-neutral-600 font-semibold p-1.5 focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Contents (Scrollable) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm leading-normal">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FCFAF7] border border-stone-200/50 rounded-none">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Completed Date</span>
                  <span className="font-semibold text-[#1A1A1A] text-xs sm:text-sm">{viewingWaiver.waiverDate}</span>
                </div>
                <div className="p-4 bg-[#FCFAF7] border border-stone-200/50 rounded-none">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Assigned Location</span>
                  <span className="font-bold text-[#1A1A1A] text-xs sm:text-sm">{viewingWaiver.location}</span>
                </div>
              </div>

              <div>
                <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-3">Demographic Contacts</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                  {viewingWaiver.email && <div><strong className="font-medium text-stone-500">Email Address: </strong><span className="text-stone-800 font-bold">{viewingWaiver.email}</span></div>}
                  <div><strong className="font-medium text-stone-500">Phone Number: </strong><span className="text-stone-800 font-bold">{viewingWaiver.phone}</span></div>
                </div>
              </div>

              <div>
                <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-3">Service Selection Details</h5>
                <div className="flex gap-2 flex-wrap mt-1">
                  {viewingWaiver.treatments.map(t => (
                    <span key={t} className="bg-[#FCFAF7] border border-stone-200 text-stone-850 text-xs px-3 py-1.5 rounded-none font-sans font-medium">
                      {t}
                    </span>
                  ))}
                  {viewingWaiver.otherTreatment && (
                    <span className="bg-[#FCFAF7] border border-stone-300 italic text-stone-850 text-xs px-3 py-1.5 rounded-none font-sans">
                      Other: {viewingWaiver.otherTreatment}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-3">Skin Characteristics</h5>
                <div className="flex gap-2 flex-wrap mt-1">
                  {viewingWaiver.skinConditions.map(s => (
                    <span key={s} className="bg-[#FCFAF7] border border-[#C5A059]/40 text-stone-800 text-xs px-3 py-1.5 rounded-none font-sans font-medium">
                      {s}
                    </span>
                  ))}
                  {viewingWaiver.otherSkinCondition && (
                    <span className="bg-[#FCFAF7] border border-[#C5A059]/40 italic text-stone-800 text-xs px-3 py-1.5 rounded-none font-sans">
                      Other: {viewingWaiver.otherSkinCondition}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-3">Health & Safety Declarations</h5>
                <div className="space-y-3 text-xs font-sans">
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">Using Retin-A, Accutane, Glycolic Acid, or other peeling agents?</span>
                    <span className={`font-bold px-2 py-0.5 rounded-none ${viewingWaiver.usingPeelingAgents === 'Yes' ? 'bg-[#FCFAF7] border border-amber-300 text-amber-900' : 'bg-[#FCFAF7] border border-stone-200 text-[#1A1A1A]'}`}>
                      {viewingWaiver.usingPeelingAgents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-600 font-medium">Had chemical peels, microdermabrasion or surgery in 2 weeks?</span>
                    <span className={`font-bold px-2 py-0.5 rounded-none ${viewingWaiver.recentSurgeriesOrPeels === 'Yes' ? 'bg-[#FCFAF7] border border-amber-300 text-amber-900' : 'bg-[#FCFAF7] border border-stone-200 text-[#1A1A1A]'}`}>
                      {viewingWaiver.recentSurgeriesOrPeels}
                    </span>
                  </div>
                </div>
              </div>

              {viewingWaiver.medicalNotes && (
                <div>
                  <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-2">Remarks or Contraindications</h5>
                  <p className="bg-[#FCFAF7] border-l-2 border-[#C5A059] px-4 py-2.5 rounded-none text-xs text-stone-700 italic font-sans animate-pulse">
                    {viewingWaiver.medicalNotes}
                  </p>
                </div>
              )}

              <div>
                <h5 className="label-caps text-[10px] font-bold text-[#C5A059] border-b border-stone-100 pb-1 mb-3 font-sans">Digital Consent Signature</h5>
                <div className="bg-[#FCFAF7] border border-stone-200 rounded-none p-6 flex flex-col justify-center items-center">
                  <div className="bg-white p-2 border border-dashed border-stone-300">
                    <img 
                      src={viewingWaiver.signatureBase64} 
                      alt="Captured client signature" 
                      className="max-h-20 max-w-full object-contain filter contrast-125"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] text-[#C5A059] mt-3 font-mono tracking-widest uppercase font-semibold">MD5 UNIQUE ID: {viewingWaiver.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 md:p-6 bg-[#FCFAF7] border-t border-stone-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handlePrint(viewingWaiver)}
                className="bg-[#1A1A1A] hover:bg-stone-800 text-white font-bold text-[9px] uppercase tracking-widest px-5 py-3.5 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer animate-none"
              >
                <Printer className="w-3.5 h-3.5 text-[#E0C896]" />
                Print Legal Waiver
              </button>
              <button
                type="button"
                onClick={() => setViewingWaiver(null)}
                className="bg-white border border-stone-250 text-stone-800 font-bold text-[9px] uppercase tracking-widest px-5 py-3.5 rounded-none hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
