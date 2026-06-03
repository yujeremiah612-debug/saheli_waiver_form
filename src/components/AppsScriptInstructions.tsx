import { useState } from 'react';
import { Copy, Check, FileCode, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';

export default function AppsScriptInstructions() {
  const [copied, setCopied] = useState(false);

  const appsScriptCode = `/**
 * Google Apps Script for Saheli Eyebrow Threading Waqiver Form
 * 
 * Generates a clean spreadsheet ledger and handles visual HTML notification emails
 * with embedded signatures for every submission.
 */

function doPost(e) {
  // CORS option preflight handling
  if (e === undefined) {
    return ContentService.createTextOutput("No data received");
  }
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    // 1. Get the active Spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Waiver Date",
        "Location",
        "Full Name",
        "Phone Number",
        "Email Address",
        "Requested Treatments",
        "Skin Conditions",
        "Using Peeling Agents (Retin-A/Accutane)",
        "Recent Peels/Surgeries (2 weeks)",
        "Medical Notes",
        "Signature Image (Base64)",
        "Drive File URL",
        "Submissions ID"
      ]);
      // Format headers
      var headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#ebd8b5"); // Premium Saheli Gold Hex
      headerRange.setFontColor("#4f361c");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // 2. Process Signature File (Save to Google Drive folder)
    var fileUrl = "No folder configured";
    var signatureBlob = null;
    
    if (data.signatureBase64 && data.signatureBase64.indexOf("data:image/png;base64,") === 0) {
      try {
        var base64Data = data.signatureBase64.split(",")[1];
        var decoded = Utilities.base64Decode(base64Data);
        signatureBlob = Utilities.newBlob(decoded, "image/png", "Signature_" + data.fullName.replace(/\\s+/g, "_") + "_" + Date.now() + ".png");
        
        // Find or create 'Saheli Waivers Signatures' folder
        var folders = DriveApp.getFoldersByName("Saheli Waivers Signatures");
        var folder;
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder("Saheli Waivers Signatures");
        }
        
        var file = folder.createFile(signatureBlob);
        fileUrl = file.getUrl();
      } catch (fileErr) {
        fileUrl = "Error saving image to Drive: " + fileErr.toString();
      }
    }
    
    // 3. Append to spreadsheet
    sheet.appendRow([
      new Date().toLocaleString(),
      data.waiverDate || "",
      data.location || "",
      data.fullName || "",
      data.phone || "",
      data.email || "",
      (data.treatments || []).join(", ") + (data.otherTreatment ? " (Other: " + data.otherTreatment + ")" : ""),
      (data.skinConditions || []).join(", ") + (data.otherSkinCondition ? " (Other: " + data.otherSkinCondition + ")" : ""),
      data.usingPeelingAgents || "",
      data.recentSurgeriesOrPeels || "",
      data.medicalNotes || "",
      data.signatureBase64 ? "Captured (Base64 String)" : "No Signature",
      fileUrl,
      data.id || ""
    ]);
    
    // Auto-fit columns
    for (var col = 1; col <= 14; col++) {
      sheet.autoResizeColumn(col);
    }
    
    // 4. Send Luxurious Styled Notification Email
    sendWaiverEmail(data, fileUrl, signatureBlob);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success", 
      "message": "Waiver saved successfully for " + data.fullName,
      "driveUrl": fileUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendWaiverEmail(data, fileUrl, signatureBlob) {
  // Use professional decorative email styling mirroring the luxury salon theme
  var staffEmail = Session.getActiveUser().getEmail(); // Sends to salon owner's email
  var customerEmail = data.email;
  
  var brandGold = "#b58943";
  var brandCharcoal = "#262626";
  
  var htmlBody = \`
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header Banner -->
      <div style="background-color: \${brandCharcoal}; text-align: center; padding: 30px 20px; border-bottom: 4px solid \${brandGold};">
        <h1 style="color: #ffffff; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; margin: 0; font-weight: 500; tracking: 1px; letter-spacing: 1px;">SAHELI EYEBROW THREADING</h1>
        <p style="color: \${brandGold}; font-size: 13px; margin: 8px 0 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;">Digital Waiver Agreement Confirmation</p>
      </div>
      
      <!-- Content Body -->
      <div style="padding: 30px; background-color: #ffffff; color: #404040; line-height: 1.6;">
        <h2 style="color: \${brandCharcoal}; font-size: 18px; margin-top: 0; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">Submission Overview</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="width: 40%; font-weight: bold; padding: 8px 0; color: #737373; font-size: 13px;">Selected Location:</td>
            <td style="padding: 8px 0; font-weight: 600; color: \${brandGold}; font-size: 14px;">\${data.location}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0; color: #737373; font-size: 13px;">Client Name:</td>
            <td style="padding: 8px 0; font-weight: 500; font-size: 14px;">\${data.fullName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0; color: #737373; font-size: 13px;">Phone Number:</td>
            <td style="padding: 8px 0; font-size: 14px;"><a href="tel:\${data.phone}" style="color: #404040; text-decoration: none;">\${data.phone}</a></td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0; color: #737373; font-size: 13px;">Email Address:</td>
            <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:\${data.email}" style="color: \${brandGold}; font-weight: 500;">\${data.email}</a></td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px 0; color: #737373; font-size: 13px;">Waiver Signed Date:</td>
            <td style="padding: 8px 0; font-size: 14px;">\${data.waiverDate}</td>
          </tr>
        </table>
        
        <!-- Checklist of Treatments -->
        <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 6px; padding: 15px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #737373; letter-spacing: 1px; font-weight: bold;">Requested Treatment Types</h3>
          <p style="margin: 0; font-size: 14px; font-weight: 500;">\${(data.treatments || []).join(", ") + (data.otherTreatment ? " (Other: " + data.otherTreatment + ")" : "")}</p>
        </div>

        <!-- Checklist of Skin Conditions -->
        <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 6px; padding: 15px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #737373; letter-spacing: 1px; font-weight: bold;">Indicated Skin Prone Conditions</h3>
          <p style="margin: 0; font-size: 14px; font-weight: 500;">\${(data.skinConditions || []).join(", ") + (data.otherSkinCondition ? " (Other: " + data.otherSkinCondition + ")" : "")}</p>
        </div>

        <!-- Yes/No Medical Questions -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: \${brandCharcoal}; font-size: 14px; margin: 0 0 10px 0;">Medical Questionnaires</h3>
          <div style="padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px;">
            <div style="color: #737373;">Using Retin-A, Accutane, Glycolic Acid, or Peeling Agents?</div>
            <div style="font-weight: bold; color: \${data.usingPeelingAgents === "Yes" ? "#b45309" : "#166534"};">\${data.usingPeelingAgents}</div>
          </div>
          <div style="padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px;">
            <div style="color: #737373;">Recent Chemical Peels, Microdermabrasion, or Surgeries in past 2 weeks?</div>
            <div style="font-weight: bold; color: \${data.recentSurgeriesOrPeels === "Yes" ? "#b45309" : "#166534"};">\${data.recentSurgeriesOrPeels}</div>
          </div>
          <div style="padding: 8px 0; font-size: 13px;">
            <div style="color: #737373;">Safety / Medical Notes of Note:</div>
            <div style="font-style: italic; color: #525252; margin-top: 4px;">\${data.medicalNotes || "None provided"}</div>
          </div>
        </div>

        <!-- Authorization & Signature Display -->
        <div style="background-color: #faf8f5; border: 1px solid #ebd8b5; border-radius: 6px; padding: 20px; text-align: center;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; uppercase: true; letter-spacing: 0.5px; color: #4f361c; font-weight: bold;">ESTABLISHED LEGAL waiver CONSENT</h4>
          <p style="font-size: 11px; color: #8a7a6b; margin: 0 0 15px 0; text-align: justify; line-height: 1.4;">
            I confirm that skincare treatments carry potential risks including but not limited to redness, skin grazing, and temporary irritation. I release Saheli Eyebrow Threading and its service providers from responsibility for any side-effects of discussed treatment routines.
          </p>
          <div style="background-color: #ffffff; border: 1px dashed #d1c1ab; display: inline-block; padding: 10px; border-radius: 4px;">
            <img src="cid:customerSignature" style="max-height: 70px; max-width: 280px;" alt="Signature Signature Image" />
          </div>
          <div style="font-size: 11px; color: #a1a1aa; margin-top: 10px; font-weight: bold;">
            SIGNED BY: \${data.fullName}
          </div>
        </div>
      </div>
      
      <!-- Footer block -->
      <div style="background-color: #f5f5f4; border-top: 1px dashed #ebd8b5; text-align: center; padding: 20px 10px; font-size: 11px; color: #78716c;">
        <p style="margin: 0 0 4px 0;">This waiver is archived securely.</p>
        <p style="margin: 0;"><a href="\${fileUrl}" style="color: \${brandGold}; text-decoration: none; font-weight: 500;">Access Uploaded Drive Record &rarr;</a></p>
      </div>
    </div>
  \`;

  // Compose with inline signature images attachment
  var inlineAttachments = {};
  if (signatureBlob) {
    inlineAttachments["customerSignature"] = signatureBlob;
  }

  // 1. Send confirmation to Salon Admin
  MailApp.sendEmail({
    to: staffEmail,
    subject: "📋 New Saheli Waiver Submitted: " + data.fullName + " [" + data.location + "]",
    htmlBody: htmlBody,
    inlineImages: inlineAttachments
  });

  // 2. Send polite confirmation copy to the customer
  try {
    MailApp.sendEmail({
      to: customerEmail,
      subject: "Your Waiver Copy - Saheli Eyebrow Threading",
      htmlBody: htmlBody,
      inlineImages: inlineAttachments
    });
  } catch (custErr) {
    Logger.log("Customer email failed to send: " + custErr.toString());
  }
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="apps-script-instructions" className="bg-white border border-neutral-200/80 rounded-none p-6 lg:p-10 shadow-xs">
      <div className="border-b border-neutral-200/50 pb-5 mb-6">
        <span className="label-caps block mb-1">Developer Guide</span>
        <h2 className="display-serif text-2xl text-stone-900 font-medium">Google Apps Script Configuration</h2>
        <p className="text-xs text-neutral-500 font-sans mt-1">Connect your interactive client waivers directly to Google Sheets & Gmail notification alerts.</p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-widest mb-4">Setup Tutorial (Takes ~3 minutes)</h3>
          <ul className="space-y-4">
            <li className="flex gap-4 text-xs sm:text-sm">
              <span className="flex-none flex items-center justify-center w-6 h-6 border border-[#C5A059] bg-[#FCFAF7] font-mono text-stone-800 text-xs font-bold">1</span>
              <div>
                <strong className="text-neutral-900 block font-bold uppercase tracking-wider text-[11px] mb-0.5">Create a Google Sheet</strong>
                <span className="text-neutral-500 font-sans">Go to <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-[#C5A059] hover:underline inline-flex items-center gap-0.5 font-medium">Google Sheets <ExternalLink className="w-3 h-3" /></a> and create a blank spreadsheet. Name it <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded-none text-[11px] font-mono">Saheli Waiver Submissions</code>.</span>
              </div>
            </li>
            <li className="flex gap-4 text-xs sm:text-sm">
              <span className="flex-none flex items-center justify-center w-6 h-6 border border-[#C5A059] bg-[#FCFAF7] font-mono text-stone-800 text-xs font-bold">2</span>
              <div>
                <strong className="text-neutral-900 block font-bold uppercase tracking-wider text-[11px] mb-0.5">Open script editor</strong>
                <span className="text-neutral-500 font-sans">In the top menu bar of your new Google Sheet, select <strong className="text-neutral-850">Extensions &gt; Apps Script</strong>. This opens a new code tab.</span>
              </div>
            </li>
            <li className="flex gap-4 text-xs sm:text-sm">
              <span className="flex-none flex items-center justify-center w-6 h-6 border border-[#C5A059] bg-[#FCFAF7] font-mono text-stone-800 text-xs font-bold">3</span>
              <div>
                <strong className="text-neutral-900 block font-bold uppercase tracking-wider text-[11px] mb-0.5">Paste the waiver engine</strong>
                <span className="text-neutral-500 font-sans">Clear any boilerplate placeholder code in the editor, and click the copy button below to paste the custom Saheli script into <code className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded-none text-[11px] font-mono">Code.gs</code>.</span>
              </div>
            </li>
            <li className="flex gap-4 text-xs sm:text-sm">
              <span className="flex-none flex items-center justify-center w-6 h-6 border border-[#C5A059] bg-[#FCFAF7] font-mono text-stone-800 text-xs font-bold">4</span>
              <div>
                <strong className="text-neutral-900 block font-bold uppercase tracking-wider text-[11px] mb-0.5">Deploy as a Web App</strong>
                <span className="text-neutral-500 font-sans">
                  Click the blue <strong className="text-neutral-800">Deploy</strong> button in the top right &gt; <strong className="text-neutral-800">New deployment</strong>.
                  <br />
                  - Select type: <strong className="text-neutral-a800 font-semibold">Web app</strong> (gear icon)
                  <br />
                  - Description: <strong className="text-neutral-800">Saheli Waiver API</strong>
                  <br />
                  - Execute as: <strong className="text-neutral-800">Me (your-email@gmail.com)</strong>
                  <br />
                  - Who has access: <strong className="text-rose-600 font-semibold">Anyone</strong> (critical for direct form submissions!)
                </span>
              </div>
            </li>
            <li className="flex gap-4 text-xs sm:text-sm">
              <span className="flex-none flex items-center justify-center w-6 h-6 border border-[#C5A059] bg-[#FCFAF7] font-mono text-stone-800 text-xs font-bold">5</span>
              <div>
                <strong className="text-neutral-900 block font-bold uppercase tracking-wider text-[11px] mb-0.5">Authorize Permissions & Save Web App URL</strong>
                <span className="text-neutral-500 font-sans font-normal">Click Deploy. Google will ask for standard authentication permissions. Grant access. Then, copy the generated <strong className="text-neutral-800">Web App URL</strong> and enter it into the <strong className="text-neutral-800">Waiver Config</strong> tab!</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Code Block Container */}
        <div className="border border-neutral-200/80">
          <div className="flex justify-between items-center bg-[#1A1A1A] text-white px-4 py-3 border-b border-neutral-800">
            <span className="text-[10px] font-mono text-[#E0C896] uppercase tracking-widest font-bold flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> Code.gs
            </span>
            <button
              id="btn-copy-code"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold bg-[#333] hover:bg-[#444] text-white py-1.5 px-3.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Script
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <pre className="bg-[#1A1A1A] text-[#E0C896]/95 p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[300px]">
              {appsScriptCode}
            </pre>
            <div className="absolute bottom-2 right-2 bg-neutral-900/90 border border-neutral-800 px-2 py-0.5 text-[9px] text-neutral-400 font-mono font-normal">
              ~240 lines of script
            </div>
          </div>
        </div>

        {/* Informational Warning Callout */}
        <div className="border-l-2 border-[#C5A059] bg-[#FCFAF7] p-5 flex gap-3 text-xs leading-normal">
          <HelpCircle className="w-4 h-4 text-[#C5A059] flex-none mt-0.5" />
          <div className="font-sans">
            <strong className="text-stone-900 block font-bold uppercase tracking-wider text-[10px] mb-1">Local Ledger Mode Enabled</strong>
            <span className="text-stone-600">
              Before setting up your cloud Google Apps Script account, the interface works out of the box with an <strong className="text-stone-900 font-semibold">automatic sandbox ledger backup</strong>. You can safely try, review, and print waivers instantly!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
