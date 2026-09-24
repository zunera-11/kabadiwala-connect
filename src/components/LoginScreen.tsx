import React, { useState } from 'react';
import { Role, Language } from '../types';
import { signIn, registerUser } from '../auth/auth';
import { LOCALES } from '../i18n/locales';
import {
  ShieldCheckIcon,
  UserIcon,
  TruckIcon,
  RecyclerIcon,
  AdminIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  MapPinIcon
} from './icons/Icons';

interface LoginScreenProps {
  onAuthenticated: (user: any) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const ROLES: { value: Role; label: string; description: string; Icon: React.FC<any> }[] = [
  { value: 'USER', label: 'Citizen', description: 'Schedule e-waste doorstep pickup', Icon: UserIcon },
  { value: 'COLLECTOR', label: 'Collector', description: 'Field pickup & location routing', Icon: TruckIcon },
  { value: 'RECYCLER', label: 'Recycler', description: 'Material processing facility', Icon: RecyclerIcon },
  { value: 'ADMIN', label: 'CPCB Authority', description: 'National traceability oversight', Icon: AdminIcon }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onAuthenticated,
  language,
  onLanguageChange,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>('USER');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<Record<string, string>>({
    location: ''
  });
  const [error, setError] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = LOCALES[language];
  const isAdmin = selectedRole === 'ADMIN';
  const isRegistering = mode === 'register' && !isAdmin;

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      let user;
      if (isRegistering) {
        user = await registerUser(
          {
            name: formData.name || formData.organizationName || '',
            email: formData.email || '',
            role: selectedRole,
            mobile: formData.mobile,
            location: formData.location || 'User Location',
            organizationName: formData.organizationName,
            details: formData.details
          },
          formData.password || ''
        );
      } else {
        user = await signIn(
          formData.email || '',
          formData.password || '',
          selectedRole,
          formData.location
        );
      }
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setMode('login');
    setFormData({ location: '' });
    setError('');
    setInfoMessage('');
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 flex items-center justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Left Information Panel - White & Green */}
        <section className="lg:col-span-5 bg-emerald-950 text-white p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-emerald-900">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                KC
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                SIH Hackathon Portal
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-6">
              Kabadiwala Connect
            </h1>
            <p className="text-emerald-100 text-sm mt-3 leading-relaxed">
              Verifiable chain-of-custody platform connecting citizens, registered collectors, dismantling recyclers, and government regulatory oversight.
            </p>

            <div className="mt-8 space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-800 flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Digital Traceability</h3>
                  <p className="text-[11px] text-emerald-200 mt-0.5">End-to-end lot tracking for all collected e-waste</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-900/60 border border-emerald-800 flex items-start gap-3">
                <TruckIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-white">Location-Based Matching</h3>
                  <p className="text-[11px] text-emerald-200 mt-0.5">Proximity sorting for citizens, collectors, and recyclers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-900 text-[11px] text-emerald-300">
            Official E-Waste & Traceability Infrastructure
          </div>
        </section>

        {/* Right Form Panel - White & Green */}
        <section className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Navigation & Language Switcher */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Authentication
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {isRegistering ? 'Create New Account' : 'Account Access'}
                </h2>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                {(['EN', 'MR', 'HI'] as Language[]).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      language === lang
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'EN' ? 'English' : lang === 'MR' ? 'मराठी' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Switcher Grid */}
            <div className="grid grid-cols-2 gap-2 mt-6">
              {ROLES.map(roleItem => {
                const isSelected = selectedRole === roleItem.value;
                const IconComponent = roleItem.Icon;
                return (
                  <button
                    key={roleItem.value}
                    type="button"
                    onClick={() => handleRoleChange(roleItem.value)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-900">{roleItem.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{roleItem.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {isRegistering && (
                <>
                  <input
                    required
                    placeholder={selectedRole === 'RECYCLER' ? 'Organization or Facility Name' : 'Full Name'}
                    value={formData.organizationName || formData.name || ''}
                    onChange={e => updateField(selectedRole === 'RECYCLER' ? 'organizationName' : 'name', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  {selectedRole === 'RECYCLER' && (
                    <input
                      required
                      placeholder="Primary Contact Person"
                      value={formData.contactPerson || ''}
                      onChange={e => updateField('contactPerson', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  )}
                  <input
                    required
                    placeholder="Mobile Contact Number"
                    value={formData.mobile || ''}
                    onChange={e => updateField('mobile', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    required
                    placeholder={selectedRole === 'RECYCLER' ? 'Recycling authorization details' : 'Collector area details'}
                    value={formData.details || ''}
                    onChange={e => updateField('details', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </>
              )}

              {/* Location Input Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location Zone / Area (Enter your City / Ward / Area):
                </label>
                <div className="relative">
                  <MapPinIcon className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                  <input
                    required
                    placeholder="Type your City / Ward / Area..."
                    value={formData.location || ''}
                    onChange={e => updateField('location', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <input
                required
                type="email"
                placeholder={isAdmin ? 'Official CPCB authority email' : t.email}
                value={formData.email || ''}
                onChange={e => updateField('email', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />

              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.password}
                  value={formData.password || ''}
                  onChange={e => updateField('password', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  title={showPassword ? t.hidePassword : t.showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {infoMessage && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                  {infoMessage}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs flex items-center justify-center gap-2 border border-emerald-600 transition-colors disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : isRegistering ? 'Register Account' : t.signIn}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>

            {!isAdmin && (
              <div className="flex items-center justify-between mt-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700"
                >
                  {mode === 'login' ? 'Create an account' : 'Return to sign in'}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setInfoMessage('Password reset is available once backend authentication service is connected.')}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {isAdmin && (
              <p className="mt-3 text-[11px] text-slate-500">
                CPCB Authority access accounts are restricted and pre-configured.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[11px] font-mono text-slate-500">
              Demo logins: user.demo@kabadiwala.connect / user-demo | collector.demo@kabadiwala.connect / collector-demo | recycler.demo@kabadiwala.connect / recycler-demo | authority.demo@cpcb.gov.in / cpcb-demo
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
