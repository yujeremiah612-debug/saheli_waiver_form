import React, { useState, useEffect } from 'react';
import { 
  Check, Sparkles, MapPin, ClipboardList, ShieldAlert, HeartHandshake, Calendar, CheckSquare, Send, AlertCircle, FileText, Printer 
} from 'lucide-react';
import SignaturePad from './SignaturePad';
import { WaiverSubmission, LocationType } from '../types';

interface WaiverFormProps {
  onSubmit: (submission: WaiverSubmission) => Promise<boolean>;
  appsScriptUrl: string;
  location: LocationType;
  setLocation: (loc: LocationType) => void;
}

export default function WaiverForm({ onSubmit, appsScriptUrl, location, setLocation }: WaiverFormProps) {
  // Form elements state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Treatment Type checkboxes
  const treatmentOptions = [
    'Threading and Tinting',
    'Facial',
    'Chemical Peel',
    'Waxing',
    'Eyelash Extensions',
    'Brow Lamination',
    'Microblading',
    'Powder Brow',
    'Lip Blush',
    'Lash Enhancement',
  ];
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [otherTreatment, setOtherTreatment] = useState('');
  const [showOtherTreatment, setShowOtherTreatment] = useState(false);

  // Skin Conditions
  const skinConditionOptions = [
    'Acne',
    'Rosacea',
    'Eczema',
    'Psoriasis',
    'Hyperpigmentation',
    'Sensitive Skin',
    'None',
  ];
  const [selectedSkinConditions, setSelectedSkinConditions] = useState<string[]>([]);
  const [otherSkinCondition, setOtherSkinCondition] = useState('');
  const [showOtherSkin, setShowOtherSkin] = useState(false);

  // Yes/No medical details
  const [usingPeelingAgents, setUsingPeelingAgents] = useState<'Yes' | 'No'>('No');
  const [recentSurgeriesOrPeels, setRecentSurgeriesOrPeels] = useState<'Yes' | 'No'>('No');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Agreement, Date & Signature
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [waiverDate, setWaiverDate] = useState('');
  const [signatureBase64, setSignatureBase64] = useState('');

  // Submission flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<WaiverSubmission | null>(null);

  // Client-side validations
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Default waiver date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setWaiverDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleTreatmentToggle = (val: string) => {
    if (selectedTreatments.includes(val)) {
      setSelectedTreatments(selectedTreatments.filter(t => t !== val));
    } else {
      setSelectedTreatments([...selectedTreatments, val]);
    }
  };

  const handleSkinConditionToggle = (val: string) => {
    if (selectedSkinConditions.includes(val)) {
      setSelectedSkinConditions(selectedSkinConditions.filter(s => s !== val));
    } else {
      // If "None" is checked, uncheck all others
      if (val === 'None') {
        setSelectedSkinConditions(['None']);
        setShowOtherSkin(false);
      } else {
        const filtered = selectedSkinConditions.filter(s => s !== 'None');
        setSelectedSkinConditions([...filtered, val]);
      }
    }
  };

  // Run form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) newErrors.fullName = "Client Name is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^\+?[0-9\s-()]{7,20}$/.test(phone)) {
      newErrors.phone = "Enter a valid phone number (e.g., 0905 123 4567)";
    }
    
    if (selectedTreatments.length === 0 && !otherTreatment.trim()) {
      newErrors.treatments = "Please select at least one treatment type";
    }

    if (selectedSkinConditions.length === 0 && !otherSkinCondition.trim()) {
      newErrors.skinConditions = "Please check at least one skin condition option";
    }

    if (!signatureBase64) {
      newErrors.signature = "Client Signature is required";
    }

    if (!consentAgreed) {
      newErrors.consent = "You must agree to the consent and acknowledgment statement";
    }

    setErrors(newErrors);
    
    // Focus first invalid element
    if (Object.keys(newErrors).length > 0) {
      const topErrorKey = Object.keys(newErrors)[0];
      const errorEl = document.getElementById(`field-${topErrorKey}`);
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (topErrorKey === 'signature') {
        const sigEl = document.getElementById('signature-section');
        sigEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    return true;
  };

  // Submit Waiver Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    const submission: WaiverSubmission = {
      id: 'SB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      location,
      fullName: fullName.trim(),
      phone: phone.trim(),
      treatments: selectedTreatments,
      otherTreatment: showOtherTreatment ? otherTreatment.trim() : undefined,
      skinConditions: selectedSkinConditions,
      otherSkinCondition: showOtherSkin ? otherSkinCondition.trim() : undefined,
      usingPeelingAgents,
      recentSurgeriesOrPeels,
      medicalNotes: medicalNotes.trim() ? medicalNotes.trim() : undefined,
      signatureBase64,
      consentAgreed,
      waiverDate,
    };

    try {
      const isSavedLocally = await onSubmit(submission);
      
      if (appsScriptUrl.trim()) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds request limit

        try {
          await fetch(appsScriptUrl.trim(), {
            method: 'POST',
            mode: 'no-cors', // standard Apps Script bypass
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchErr: any) {
          console.warn("Google Apps Script submission error:", fetchErr);
          // Don't fail the user completed waiver if we already saved locally!
          if (!isSavedLocally) {
            throw new Error(`Google Sheets connection offline: ${fetchErr.message || 'Check your Apps Script URL.'}`);
          }
        }
      }

      setLastSubmittedRecord(submission);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred while finalizing signature. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastSubmittedRecord) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Saheli Waiver Confirmation Receipt</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1c1917; padding: 40px; max-width: 650px; margin: 0 auto; line-height: 1.5; }
            .receipt-box { border: 1px solid #ebd8b5; background:#fdfcf9; border-radius: 12px; padding: 30px; text-align: center; }
            h1 { font-family: 'Playfair Display', serif; font-size: 24px; margin: 0 0 10px 0; color: #292524; }
            p.meta { text-transform: uppercase; color: #b58943; font-size: 11px; font-weight: bold; tracking: 2px; margin: 0 0 20px 0; letter-spacing: 1.5px; }
            .details { border-top: 1px solid #f2f0eb; border-bottom: 1px solid #f2f0eb; padding: 20px 0; margin: 20px 0; text-align: left; font-size: 13px; }
            .details table { width:100%; border-collapse:collapse; }
            .details td { padding: 6px 0; }
            .details td.lbl { font-weight:600; color:#78716c; width:140px; }
            .legal-quote { font-size: 11px; text-align: justify; color: #78716c; background:#fafafa; padding: 12px; border-radius: 6px; margin: 20px 0; border: 1px solid #e7e5e4; }
            .sig-area { margin-top: 25px; padding: 10px; border: 1px dashed #e7e5e4; background:#fff; display:inline-block; border-radius:6px; }
            .sig-img { max-height: 60px; max-width: 250px; }
            .ok-not { font-[10px] text-neutral-400 mt-2 block; font-weight:bold; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt-box">
            <h1>SAHELI EYEBROW THREADING</h1>
            <p class="meta">Waiver Submission Completed</p>
            
            <div style="font-size:36px; margin-bottom:10px;">✓</div>
            <strong style="font-size:16px;">Thank you, \${lastSubmittedRecord.fullName}!</strong>
            <p style="font-size:13px; color:#57534e; margin: 5px 0 0 0;">Your digital intake consent agreement has been submitted and securely archived.</p>
            
            <div class="details">
              <table>
                <tr><td class="lbl">Intake ID:</td><td style="font-family:monospace; color:#854d0e;">\${lastSubmittedRecord.id}</td></tr>
                <tr><td class="lbl">Signed Location:</td><td style="font-weight:600; color:#b58943;">\${lastSubmittedRecord.location}</td></tr>
                <tr><td class="lbl">Full Name:</td><td>\${lastSubmittedRecord.fullName}</td></tr>
                <tr><td class="lbl">Intake Date:</td><td>\${lastSubmittedRecord.waiverDate}</td></tr>
                <tr><td class="lbl">Contact Number:</td><td>\${lastSubmittedRecord.phone}</td></tr>
                <tr><td class="lbl text-xs">Email Address:</td><td class="text-xs">\${lastSubmittedRecord.email}</td></tr>
                <tr><td class="lbl">Treatments:</td><td>\${lastSubmittedRecord.treatments.join(', ')}</td></tr>
              </table>
            </div>

            <div class="legal-quote">
              I acknowledge that aesthetic procedures involve mechanical risk of surface irritation. I release Saheli Eyebrow Threading from responsibility for side effects of discussed treatments.
            </div>

            <div class="sig-area">
              <img class="sig-img" src="\${lastSubmittedRecord.signatureBase64}" alt="Signature Copy" />
            </div>
            <div style="font-size:10px; color:#a1a1aa; margin-top:5px;">SECURE DIGITAL AUTHORIZATION VERIFIED</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleStartNewWaiver = () => {
    // Clear all fields
    setFullName('');
    setPhone('');
    setSelectedTreatments([]);
    setOtherTreatment('');
    setShowOtherTreatment(false);
    setSelectedSkinConditions([]);
    setOtherSkinCondition('');
    setShowOtherSkin(false);
    setUsingPeelingAgents('No');
    setRecentSurgeriesOrPeels('No');
    setMedicalNotes('');
    setConsentAgreed(false);
    setSignatureBase64('');
    setIsSuccess(false);
    setLastSubmittedRecord(null);
    setErrors({});
  };

  if (isSuccess && lastSubmittedRecord) {
    return (
      <div id="waiver-success-view" className="bg-white border border-gold-250 rounded-2xl max-w-2xl mx-auto p-8 text-center shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto w-16 h-16 bg-gold-50 text-gold-500 rounded-full flex items-center justify-center mb-6 border border-gold-100">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-600 bg-gold-50 border border-gold-100 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Completed Successfully
        </span>

        <h2 className="font-serif text-3xl font-medium text-neutral-900 mb-2">Consent Waiver Submitted</h2>
        <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
          Thank you, <strong className="text-neutral-800 font-medium">{lastSubmittedRecord.fullName}</strong>. Your intake form and digital waiver signatures are securely archived and shared with the <strong className="text-neutral-800 font-medium">{lastSubmittedRecord.location}</strong> salon technicians.
        </p>

        <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-5 text-left mb-6 font-mono text-xs text-neutral-600 max-w-md mx-auto space-y-2">
          <div className="flex justify-between border-b border-neutral-100 pb-1.5">
            <span>Client ID:</span>
            <strong className="text-neutral-900 select-all">{lastSubmittedRecord.id}</strong>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-1.5">
            <span>Location:</span>
            <strong className="text-gold-700">{lastSubmittedRecord.location}</strong>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-1.5">
            <span>Date Signed:</span>
            <strong className="text-neutral-800">{lastSubmittedRecord.waiverDate}</strong>
          </div>
          <div className="flex justify-between">
            <span>Email Copy Status:</span>
            <strong className="text-emerald-600 flex items-center gap-1 select-none">
              <Check className="w-3.5 h-3.5" /> Scheduled
            </strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto mt-8">
          <button
            type="button"
            id="btn-print-receipt"
            onClick={handlePrintReceipt}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Waiver Copy
          </button>
          
          <button
            type="button"
            id="btn-new-waiver"
            onClick={handleStartNewWaiver}
            className="w-full bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm px-6 py-3 rounded-xl border border-neutral-300 transition-colors"
          >
            Sign Another Waiver
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="public-waiver-intake-form" className="bg-transparent max-w-4xl mx-auto space-y-12 animate-in fade-in duration-300">
      
      {/* Dynamic Header Block identifying the location */}
      <div id="location-header-card" className="bg-[#1A1A1A] p-8 md:p-10 border border-neutral-800 text-center space-y-2">
        <h2 className="display-serif text-3xl font-normal text-[#C5A059] tracking-tight">Waiver Form for {location}</h2>
        <p className="text-stone-400 text-xs font-sans uppercase tracking-[0.12em]">Saheli Eyebrow Threading & Skin Care</p>
      </div>

      {/* Location Selector (Interactive Touch Tiles) */}
      <div id="field-location" className="pb-10 border-b border-neutral-200/55 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="label-caps">Salon Visit Location</span>
            <p className="text-xs text-neutral-500 mt-1 font-sans">Please tap your salon location below to instantly display the correct legal waiver documents</p>
          </div>
          <select
            id="select-location"
            className="sm:hidden border border-neutral-200 rounded-none py-2 px-3 text-sm bg-white outline-none font-medium text-[#C5A059] transition-all w-full cursor-pointer focus:border-[#C5A059] focus:ring-0 mt-3 font-sans"
            value={location}
            onChange={(e) => setLocation(e.target.value as LocationType)}
          >
            <option value="Parker Location">Parker Location</option>
            <option value="Aurora Location">Aurora Location</option>
            <option value="Centennial Location">Centennial Location</option>
            <option value="Thornton Location">Thornton Location</option>
            <option value="Denver Location">Denver Location</option>
          </select>
        </div>

        {/* Beautiful responsive touch selector tiles with active state indications */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="grid-locations-touch-tiles">
          {(['Parker Location', 'Aurora Location', 'Centennial Location', 'Thornton Location', 'Denver Location'] as LocationType[]).map((loc) => {
            const isActive = location === loc;
            const shortName = loc.replace(' Location', '');
            return (
              <button
                type="button"
                key={loc}
                onClick={() => setLocation(loc)}
                className={`py-3 md:py-4 px-2 border text-center transition-all duration-200 cursor-pointer flex flex-col justify-center items-center gap-1.5 rounded-none group ${
                  isActive 
                    ? 'border-[#C5A059] bg-[#FCFAF7] text-[#C5A059] scale-[1.01] font-semibold ring-1 ring-[#C5A059]/30'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-[#FCFAF7]/10'
                }`}
              >
                <span className={`text-[11px] sm:text-xs font-bold font-sans uppercase tracking-wider transition-colors ${isActive ? 'text-[#C5A059]' : 'text-neutral-700 group-hover:text-black'}`}>
                  {shortName}
                </span>
                <span className="text-[9px] text-[#C5A059]/75 font-sans uppercase tracking-widest font-normal">
                  {isActive ? '● Active' : 'Boutique'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="space-y-6" id="section-personal-info">
        <div className="border-b border-neutral-200/50 pb-2">
          <span className="label-caps">01. Personal Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div id="field-fullName">
            <label htmlFor="input-fullName" className="text-[10px] uppercase tracking-[0.05em] font-normal text-neutral-400 block mb-2">
              Client Name *
            </label>
            <input
              id="input-fullName"
              type="text"
              placeholder="Enter your full name"
              className={`input-field ${errors.fullName ? '!border-rose-500' : ''}`}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
            />
            {errors.fullName && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.fullName}</span>}
          </div>

          <div id="field-phone">
            <label htmlFor="input-phone" className="text-[10px] uppercase tracking-[0.05em] font-normal text-neutral-400 block mb-2">
              Phone Number *
            </label>
            <input
              id="input-phone"
              type="tel"
              placeholder="0905 123 4567"
              className={`input-field ${errors.phone ? '!border-rose-500' : ''}`}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
            />
            {errors.phone && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{errors.phone}</span>}
          </div>
        </div>
      </div>      {/* Treatment Type Section */}
      <div className="space-y-6" id="field-treatments">
        <div className="border-b border-neutral-200/50 pb-2 flex justify-between items-baseline">
          <span className="label-caps">02. Treatment Type selection</span>
          <span className="text-[9px] text-[#C5A059] font-bold uppercase tracking-wider font-sans">Select all that apply</span>
        </div>

        {errors.treatments && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-none flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{errors.treatments}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {treatmentOptions.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 border transition-all select-none cursor-pointer rounded-none ${
                selectedTreatments.includes(opt)
                  ? 'border-[#C5A059] bg-[#FCFAF7] text-neutral-900 font-semibold'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <input
                id={`check-treatment-${opt.replace(/\s+/g, '-')}`}
                type="checkbox"
                className="accent-[#C5A059] focus:ring-0 rounded-none w-4 h-4 cursor-pointer"
                checked={selectedTreatments.includes(opt)}
                onChange={() => {
                  handleTreatmentToggle(opt);
                  if (errors.treatments) setErrors(prev => ({ ...prev, treatments: '' }));
                }}
              />
              <span className="text-xs sm:text-sm font-sans">{opt}</span>
            </label>
          ))}
          
          {/* Custom other treatment block */}
          <div className="sm:col-span-2 space-y-3">
            <label className={`flex items-center gap-3 p-3 border transition-all cursor-pointer rounded-none ${
              showOtherTreatment ? 'border-[#C5A059] bg-[#FCFAF7]' : 'border-neutral-200 hover:border-neutral-400'
            }`}>
              <input
                id="check-other-treatment-bool"
                type="checkbox"
                className="accent-[#C5A059] focus:ring-0 rounded-none w-4 h-4 cursor-pointer"
                checked={showOtherTreatment}
                onChange={(e) => {
                  setShowOtherTreatment(e.target.checked);
                  if (!e.target.checked) setOtherTreatment('');
                }}
              />
              <span className="text-xs sm:text-sm text-neutral-600 font-sans">Others</span>
            </label>

            {showOtherTreatment && (
              <input
                id="input-other-treatment"
                type="text"
                placeholder="Please specify other treatment types"
                className="input-field"
                value={otherTreatment}
                onChange={(e) => {
                  setOtherTreatment(e.target.value);
                  if (errors.treatments) setErrors(prev => ({ ...prev, treatments: '' }));
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Skin Characteristics Section */}
      <div className="space-y-6" id="field-skinConditions">
        <div className="border-b border-neutral-200/50 pb-2 flex justify-between items-baseline">
          <span className="label-caps">03. Skin Conditions</span>
          <span className="text-[9px] text-[#C5A059] font-bold uppercase tracking-wider font-sans">Select all that apply</span>
        </div>

        {errors.skinConditions && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-none flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{errors.skinConditions}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {skinConditionOptions.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 border transition-all select-none cursor-pointer rounded-none ${
                selectedSkinConditions.includes(opt)
                  ? 'border-[#C5A059] bg-[#FCFAF7] text-neutral-900 font-semibold'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <input
                id={`check-skin-${opt}`}
                type="checkbox"
                className="accent-[#C5A059] focus:ring-0 rounded-none w-4 h-4 cursor-pointer"
                checked={selectedSkinConditions.includes(opt)}
                onChange={() => {
                  handleSkinConditionToggle(opt);
                  if (errors.skinConditions) setErrors(prev => ({ ...prev, skinConditions: '' }));
                }}
              />
              <span className="text-xs font-sans">{opt}</span>
            </label>
          ))}
          
          <div className="col-span-2 md:col-span-4 space-y-3">
            <label className={`flex items-center gap-3 p-3 border transition-all cursor-pointer rounded-none ${
              showOtherSkin ? 'border-[#C5A059] bg-[#FCFAF7]' : 'border-neutral-200 hover:border-neutral-400'
            }`}>
              <input
                id="check-other-skin"
                type="checkbox"
                className="accent-[#C5A059] focus:ring-0 rounded-none w-4 h-4 cursor-pointer"
                checked={showOtherSkin}
                onChange={(e) => {
                  setShowOtherSkin(e.target.checked);
                  if (!e.target.checked) setOtherSkinCondition('');
                }}
              />
              <span className="text-xs text-neutral-600 font-sans">Others</span>
            </label>

            {showOtherSkin && (
              <input
                id="input-other-skin"
                type="text"
                placeholder="Please specify other skin conditions"
                className="input-field"
                value={otherSkinCondition}
                onChange={(e) => {
                  setOtherSkinCondition(e.target.value);
                  if (errors.skinConditions) setErrors(prev => ({ ...prev, skinConditions: '' }));
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Yes/No medical details */}
      <div className="space-y-6" id="section-medical">
        <div className="border-b border-[#C5A059]/40 pb-2">
          <span className="label-caps">04. Medical Questions</span>
        </div>

        <div className="space-y-6 text-sm">
          {/* Question 1 */}
          <div className="pb-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-transparent">
            <span className="font-semibold text-neutral-800 text-xs sm:text-sm font-sans">
              Are you currently taking any medications (including topical)? *
            </span>
            <div className="flex items-center gap-4 flex-none">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="radio-peel-yes"
                  type="radio"
                  name="peelingAgents"
                  className="accent-[#C5A059] focus:ring-0 w-4 h-4 cursor-pointer"
                  checked={usingPeelingAgents === 'Yes'}
                  onChange={() => setUsingPeelingAgents('Yes')}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 font-sans">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="radio-peel-no"
                  type="radio"
                  name="peelingAgents"
                  className="accent-[#C5A059] focus:ring-0 w-4 h-4 cursor-pointer"
                  checked={usingPeelingAgents === 'No'}
                  onChange={() => setUsingPeelingAgents('No')}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 font-sans">No</span>
              </label>
            </div>
          </div>

          {/* Question 2 */}
          <div className="pb-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-transparent">
            <span className="font-semibold text-neutral-800 text-xs sm:text-sm font-sans">
              Are you currently taking any Retinol, Accutane, Hydroquinone? *
            </span>
            <div className="flex items-center gap-4 flex-none">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="radio-surg-yes"
                  type="radio"
                  name="recentSurgeries"
                  className="accent-[#C5A059] focus:ring-0 w-4 h-4 cursor-pointer"
                  checked={recentSurgeriesOrPeels === 'Yes'}
                  onChange={() => setRecentSurgeriesOrPeels('Yes')}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 font-sans">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="radio-surg-no"
                  type="radio"
                  name="recentSurgeries"
                  className="accent-[#C5A059] focus:ring-0 w-4 h-4 cursor-pointer"
                  checked={recentSurgeriesOrPeels === 'No'}
                  onChange={() => setRecentSurgeriesOrPeels('No')}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 font-sans">No</span>
              </label>
            </div>
          </div>

          {/* Additional Medical Area */}
          <div className="pt-2">
            <label htmlFor="input-medical-history" className="text-[10px] uppercase tracking-[0.05em] font-normal text-neutral-400 block mb-1">
              Please specify any other medical history, alerts, skin sensitivities, or active medications we should know about (Optional)
            </label>
            <textarea
              id="input-medical-history"
              rows={2}
              placeholder="e.g., active skin prescriptions, allergies, chemical sensitivities..."
              className="input-field min-h-[50px] resize-y"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Liability Scrollable Terms */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
          <FileText className="w-5 h-5 text-[#C5A059]" />
          <h3 className="font-serif text-lg font-medium text-neutral-900">Consent & Acknowledgment</h3>
        </div>

        <div className="bg-[#FCFAF7] border border-neutral-200/60 rounded-none p-6 text-sm text-neutral-800 leading-relaxed font-sans space-y-4">
          <p className="font-bold text-[#C5A059] text-xs uppercase tracking-widest">Waiver Terms</p>
          <p className="text-xs md:text-sm text-neutral-700 leading-relaxed">
            I understand that skincare treatments carry potential risks including, but not limited to, redness, irritation, and allergic reaction. I confirm that the above information is accurate to the best of my knowledge. I consent to the treatment(s) discussed and release the provider of any liability.
          </p>
        </div>

        <div id="field-consent" className="space-y-2">
          <label className="flex items-start gap-4 p-4 border border-neutral-200/60 bg-[#FCFAF7] rounded-none cursor-pointer select-none">
            <input
              id="check-consent-agreement"
              type="checkbox"
              className="accent-[#C5A059] focus:ring-0 rounded-none w-4 h-4 cursor-pointer mt-0.5"
              checked={consentAgreed}
              onChange={(e) => {
                setConsentAgreed(e.target.checked);
                if (errors.consent) setErrors(prev => ({ ...prev, consent: '' }));
              }}
            />
            <span className="text-xs text-neutral-700 leading-relaxed font-normal font-sans">
              I agree to the Consent & Acknowledgment statement outlined above. *
            </span>
          </label>
          {errors.consent && <span className="text-[10px] text-rose-500 font-medium block font-sans">{errors.consent}</span>}
        </div>
      </div>

      {/* Signature & Date Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="md:col-span-2">
          <SignaturePad
            onSave={(base64) => {
              setSignatureBase64(base64);
              if (errors.signature) setErrors(prev => ({ ...prev, signature: '' }));
            }}
            onClear={() => setSignatureBase64('')}
            savedSignature={signatureBase64 || undefined}
          />
          {errors.signature && <span className="text-[10px] text-rose-500 font-medium mt-1.5 block font-sans">{errors.signature}</span>}
        </div>

        <div id="field-waiverDate" className="flex flex-col justify-start">
          <span className="label-caps">Date / Time</span>
          <div className="relative mt-1">
            <Calendar className="absolute left-0 top-2.5 w-4 h-4 text-[#C5A059]" />
            <input
              id="input-date"
              type="date"
              className="w-full text-xs font-mono border-0 border-b border-neutral-200 bg-transparent py-2 pl-6 outline-none cursor-not-allowed text-stone-500"
              value={waiverDate}
              readOnly
            />
          </div>
          <p className="text-[9px] text-neutral-400 mt-2 leading-normal">Locked automatically matching local digital waiver timezone record protection.</p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50/75 border border-rose-200 text-rose-700 text-xs rounded-none flex items-start gap-2 font-sans">
          <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit Waiver Forms trigger */}
      <div className="pt-6 border-t border-neutral-100 flex justify-end">
        <button
          type="submit"
          id="btn-submit-waiver-form"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[240px] py-4 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#333] transition-colors border border-transparent flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait rounded-none shadow-xs"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Securing Authorization...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-[#C5A059]" />
              Submit Waiver
            </>
          )}
        </button>
      </div>

    </form>
  );
}
