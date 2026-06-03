import React, { useState, useEffect } from 'react';
import { 
  Lock, Sparkles, Database, FileText, Info, Key, ShieldCheck, MapPin, 
  HelpCircle, CheckCircle, Smartphone 
} from 'lucide-react';
import { WaiverSubmission, LocationType } from './types';
import WaiverForm from './components/WaiverForm';
import SubmissionsDashboard from './components/SubmissionsDashboard';
import AppsScriptInstructions from './components/AppsScriptInstructions';

// Initial dummy submission to show beautiful layout if empty
const sampleSubmissions: WaiverSubmission[] = [
  {
    id: "SB-A9K2L5N1X",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    location: "Centennial Location",
    fullName: "Aria Jenkins",
    phone: "303-555-0143",
    email: "aria.jenkins@gmail.com",
    treatments: ["Threading and Tinting", "Brow Lamination"],
    skinConditions: ["Sensitive Skin"],
    usingPeelingAgents: "No",
    recentSurgeriesOrPeels: "No",
    medicalNotes: "Slight redness usually occurs around eyebrow brow mapping, fades within 30 mins.",
    signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // placeholder
    consentAgreed: true,
    waiverDate: new Date().toISOString().slice(0, 10)
  },
  {
    id: "SB-F2X4M7P9Y",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    location: "Denver Location",
    fullName: "Sofia Patel",
    phone: "720-555-0199",
    email: "sofia.patel@yahoo.com",
    treatments: ["Facial", "Chemical Peel", "Eyelash Extensions"],
    skinConditions: ["Acne", "Hyperpigmentation"],
    usingPeelingAgents: "Yes",
    recentSurgeriesOrPeels: "No",
    medicalNotes: "Takes salicylic acid cleanser. Uses low-dose glycolic topical once a week.",
    signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // placeholder
    consentAgreed: true,
    waiverDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'instructions'>('form');
  const [submissions, setSubmissions] = useState<WaiverSubmission[]>([]);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationType>('Denver Location');
  
  // Security PIN flow for admin/instruction tab validation
  const [showPinGate, setShowPinGate] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingTab, setPendingTab] = useState<'admin' | 'instructions' | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false); // skips pin check once authorized in session

  // Initialize data on mount
  useEffect(() => {
    // 1. Load submissions database
    const localRecords = localStorage.getItem('saheli_waiver_submissions');
    if (localRecords) {
      setSubmissions(JSON.parse(localRecords));
    } else {
      // Prepopulate sample submissions for premium immediate demo
      localStorage.setItem('saheli_waiver_submissions', JSON.stringify(sampleSubmissions));
      setSubmissions(sampleSubmissions);
    }

    // 2. Load configured Web App endpoint
    const savedUrl = localStorage.getItem('saheli_app_script_url');
    if (savedUrl) {
      setAppsScriptUrl(savedUrl);
    }
  }, []);

  // Save specific submission
  const handleAddSubmission = async (newSub: WaiverSubmission) => {
    const updated = [newSub, ...submissions];
    setSubmissions(updated);
    localStorage.setItem('saheli_waiver_submissions', JSON.stringify(updated));
    return true;
  };

  // Delete specific submission
  const handleDeleteSubmission = (id: string) => {
    const filtered = submissions.filter(s => s.id !== id);
    setSubmissions(filtered);
    localStorage.setItem('saheli_waiver_submissions', JSON.stringify(filtered));
  };

  // Clear all local records
  const handleClearAllSubmissions = () => {
    setSubmissions([]);
    localStorage.setItem('saheli_waiver_submissions', JSON.stringify([]));
  };

  // Update Apps Script URL
  const handleUpdateAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    localStorage.setItem('saheli_app_script_url', url);
  };

  // Check pin when trying to select backoffice tabs
  const handleTabChangeAttempt = (targetTab: 'form' | 'admin' | 'instructions') => {
    if (targetTab === 'form') {
      setActiveTab('form');
      return;
    }

    if (isAuthorized) {
      setActiveTab(targetTab);
    } else {
      setPendingTab(targetTab);
      setShowPinGate(true);
      setPinCode('');
      setPinError('');
    }
  };

  // Confirm staff PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default secret Pin is 1234
    if (pinCode === '1234' || pinCode.toLowerCase() === 'saheli') {
      setIsAuthorized(true);
      setShowPinGate(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } else {
      setPinError('Incorrect PIN or passcode. Use default PIN: 1234');
      setPinCode('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col font-sans" id="applet-viewport">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-0 right-0 h-[320px] bg-gradient-to-b from-[#FCFAF7] via-[#FDFCFB]/80 to-transparent pointer-events-none select-none z-0" />

      {/* Luxury Brand Header */}
      <header className="relative border-b border-neutral-100/80 bg-transparent py-8 z-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-baseline md:items-end justify-between gap-6">
          
          {/* Logo Brand Panel (Artistic Flair Spec) */}
          <div className="flex items-center gap-4 text-left">
            <img 
              src="https://sahelispafranchise.com/assets/logo-Hp8b7ryN.png" 
              alt="Saheli Eyebrow Threading & Spa Logo"
              className="h-16 md:h-20 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col border-l border-neutral-200/60 pl-4 py-1">
              <h1 className="text-2xl md:text-3xl display-serif text-[#C5A059] leading-none tracking-tight font-normal">
                Saheli
              </h1>
              <h2 className="text-[9px] uppercase tracking-[0.2em] font-light mt-1 text-neutral-500">
                Eyebrow Threading & Spa
              </h2>
            </div>
          </div>

          {/* Clean header space (Navigation links removed for client-kiosk) */}
          <div className="flex items-center gap-2">
            {/* Logo on left, spacing on right */}
          </div>

        </div>
      </header>

      {/* Main Main Workspace Layout */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-10 relative z-10">
        
        {/* Workspace Active screen router */}
        {activeTab === 'form' && (
          <div className="space-y-8">
            {/* Elegant Header welcome card */}
            <div className="text-left max-w-xl space-y-2 mb-8 border-l border-[#C5A059]/40 pl-4">
              <span className="label-caps">Client Salon Intake • {selectedLocation}</span>
              <h2 className="display-serif text-3xl font-normal text-neutral-900">
                Digital Liability Release & Skin Intake
              </h2>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                Please complete your legal service release and health questionnaire prior to your appointment today. It takes about 2 minutes to authorize on our secure terminal.
              </p>
            </div>
            
            <WaiverForm 
              onSubmit={handleAddSubmission} 
              appsScriptUrl={appsScriptUrl}
              location={selectedLocation}
              setLocation={setSelectedLocation}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <SubmissionsDashboard
            onBackToForm={() => setActiveTab('form')}
            submissions={submissions}
            onDeleteSubmission={handleDeleteSubmission}
            onClearAllSubmissions={handleClearAllSubmissions}
            appsScriptUrl={appsScriptUrl}
            onUpdateAppsScriptUrl={handleUpdateAppsScriptUrl}
          />
        )}

        {activeTab === 'instructions' && (
          <AppsScriptInstructions />
        )}

      </main>

      {/* Ambient Footer (Artistic Flair Spec) */}
      <footer className="mt-auto border-t border-neutral-100 bg-[#FCFAF7] py-8 px-6 text-xs relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-neutral-400 bg-transparent flex items-center gap-1 font-sans">
            <span className="uppercase tracking-wider text-neutral-400">© {new Date().getFullYear()} Saheli Eyebrow Threading</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-semibold uppercase tracking-widest font-sans">
            {(['Parker Location', 'Aurora Location', 'Centennial Location', 'Thornton Location', 'Denver Location'] as LocationType[]).map((loc) => {
              const isActive = selectedLocation === loc;
              const displayName = loc.replace(' Location', '');
              return (
                <button
                  type="button"
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setActiveTab('form');
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                  className={`cursor-pointer hover:text-black transition-colors border-b pb-0.5 ${
                    isActive 
                      ? 'text-[#C5A059] border-[#C5A059] font-bold text-xs' 
                      : 'text-neutral-400 border-transparent hover:border-neutral-300'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Security Pin Locker Modal Gate */}
      {showPinGate && (
        <div id="pin-login-modal" className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleVerifyPin}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="text-center flex flex-col items-center">
              <img 
                src="https://sahelispafranchise.com/assets/logo-Hp8b7ryN.png" 
                alt="Saheli Salon Logo"
                className="h-12 w-auto object-contain mb-3"
                referrerPolicy="no-referrer"
              />
              <h3 className="display-serif text-lg font-medium text-[#1A1A1A]">Salon Staff Verification</h3>
              <p className="text-xs text-neutral-500 mt-1 font-sans">To ensure client privacy on shared tablet screens, enter the secret code PIN password below</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-pin-code" className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Enter PIN Code or Passcode
              </label>
              <input
                id="input-pin-code"
                type="password"
                placeholder="Hint default: 1234"
                className={`w-full text-center text-sm font-mono border ${pinError ? 'border-rose-500 focus:ring-rose-500' : 'border-neutral-205 focus:border-gold-500 focus:ring-gold-500'} rounded-xl px-4 py-3 outline-none transition-all`}
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  if (pinError) setPinError('');
                }}
                autoFocus
              />
              {pinError && <span className="text-[10px] text-rose-600 font-medium block text-center mt-1">{pinError}</span>}
            </div>

            <div className="flex gap-2 pt-1 text-xs">
              <button
                type="button"
                id="btn-close-pin-gate"
                onClick={() => {
                  setShowPinGate(false);
                  setPendingTab(null);
                }}
                className="w-1/2 bg-white border border-neutral-200 text-neutral-600 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                type="submit"
                id="btn-submit-pin"
                className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Verify & Open
              </button>
            </div>

            <div className="bg-neutral-50 rounded-lg p-2.5 text-[9px] text-neutral-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-gold-500" />
              <span>Session will persist authenticated until page refresh</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
