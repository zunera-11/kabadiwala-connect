import React, { useEffect } from 'react';
import { XIcon } from './icons/Icons';

export type LegalDocType = 'privacy' | 'terms';

// TODO: replace with your real support address before public launch.
export const LEGAL_CONTACT_EMAIL = 'support@kabadiwala.connect';
const LAST_UPDATED = 'October 2026';

interface Section {
  heading: string;
  body: string[];
}

const PRIVACY: Section[] = [
  {
    heading: 'Who we are',
    body: [
      'Kabadiwala Connect is an e-waste collection and traceability platform that connects citizens, registered collectors, authorised recyclers and the CPCB oversight authority.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'Account details: name or organisation name, email address, mobile number, selected role, and your city / ward / area.',
      'Role details: collector area details or a recycler\'s authorisation details, submitted for verification.',
      'Activity data: pickup requests, lot IDs, scrap type and weight, payout records, notifications and certificate references.',
      'Photos and files you choose to upload through the scanner, and location text you type in. We do not read your device location unless you grant permission.',
      'Basic device and app data stored locally, such as your language choice, session, and any offline queue of pending requests.',
    ],
  },
  {
    heading: 'How we use it',
    body: [
      'To create and secure your account and verify collectors and recyclers.',
      'To match pickups by area and to maintain an end-to-end chain-of-custody record of each e-waste lot.',
      'To calculate and record payouts and to issue EPR-related traceability records.',
      'To send you notifications about your pickups and account.',
      'To prevent fraud and to meet legal and regulatory reporting obligations.',
    ],
  },
  {
    heading: 'Who can see your data',
    body: [
      'Participants in the same lot see only the details needed to complete it (for example, a collector sees a pickup address and contact for an accepted request).',
      'Authorised CPCB authority users can view lot, collector and recycler records for oversight and audit.',
      'We do not sell your personal information. We share it only with service providers who help run the platform, or where required by law.',
    ],
  },
  {
    heading: 'Retention and security',
    body: [
      'Traceability and payout records may be kept for as long as regulation or audit requirements demand. Other data is kept while your account is active and for a reasonable period afterwards.',
      'We use reasonable technical and organisational safeguards, but no system is completely secure.',
    ],
  },
  {
    heading: 'Your choices and rights',
    body: [
      'You may ask to access, correct or delete your personal data, or withdraw consent, subject to records we must retain by law. Rights under the Digital Personal Data Protection Act, 2023 apply where relevant.',
      'You can sign out at any time from the Logout button inside the app.',
    ],
  },
  {
    heading: 'Children',
    body: ['The service is not intended for children under 18 without a parent or guardian.'],
  },
  {
    heading: 'Changes and contact',
    body: [
      'We may update this policy and will change the date above when we do.',
      `Questions or requests: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
];

const TERMS: Section[] = [
  {
    heading: 'Acceptance',
    body: [
      'By creating an account or signing in to Kabadiwala Connect you agree to these Terms and the Privacy Policy. If you do not agree, please do not use the service.',
    ],
  },
  {
    heading: 'Accounts and roles',
    body: [
      'You must give accurate information and keep your password confidential. You are responsible for activity under your account.',
      'Collector and recycler accounts are subject to verification and may be restricted until approved. CPCB Authority accounts are restricted and pre-configured.',
    ],
  },
  {
    heading: 'Using the service',
    body: [
      'Citizens may request pickups only for e-waste and scrap they are entitled to dispose of. Collectors and recyclers must handle material lawfully and in line with applicable e-waste and hazardous-waste rules, including the E-Waste (Management) Rules.',
      'You agree not to submit false lots, weights or payments, tamper with records, misuse another person\'s account, or interfere with the platform.',
    ],
  },
  {
    heading: 'Rates, weights and payments',
    body: [
      'Displayed rates and payouts are estimates until a weight is verified by the recycler. Final payout depends on the verified weight and the rate applicable at that time.',
      'Payments between parties are subject to the payment method used and its provider\'s terms.',
    ],
  },
  {
    heading: 'Records and traceability',
    body: [
      'Lot, weight, payout and certificate records form part of an audit trail and may be viewed by the CPCB Authority. They may not be edited or deleted on request where retention is required.',
    ],
  },
  {
    heading: 'Suspension',
    body: [
      'We may suspend or remove accounts that breach these Terms, give false information, or put people or the environment at risk.',
    ],
  },
  {
    heading: 'Disclaimer and liability',
    body: [
      'The service is provided "as is". To the extent permitted by law, we are not liable for indirect or consequential loss, or for disputes between users about material, weight or price.',
    ],
  },
  {
    heading: 'Governing law and contact',
    body: [
      'These Terms are governed by the laws of India. Updated: ' + LAST_UPDATED + '.',
      `Questions: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
];

interface LegalModalProps {
  doc: LegalDocType | null;
  onClose: () => void;
  onSwitch: (doc: LegalDocType) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ doc, onClose, onSwitch }) => {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  if (!doc) return null;
  const isPrivacy = doc === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[88dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Last updated {LAST_UPDATED}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {sections.map((s) => (
            <section key={s.heading}>
              <h3 className="text-xs font-bold text-slate-900">{s.heading}</h3>
              <div className="mt-1 space-y-1.5">
                {s.body.map((p, i) => (
                  <p key={i} className="text-[11px] leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onSwitch(isPrivacy ? 'terms' : 'privacy')}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
          >
            {isPrivacy ? 'Read Terms & Conditions' : 'Read Privacy Policy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold border border-emerald-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
