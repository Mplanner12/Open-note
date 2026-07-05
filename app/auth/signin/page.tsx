'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Eye,
  EyeOff,
  Code,
  Palette,
  PenTool,
  Briefcase,
  Crown,
  Building,
} from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [orgToggle, setOrgToggle] = useState(false);
  const [orgName, setOrgName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGuestLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username: 'guest@example.com',
        password: 'guest-password',
        redirect: false,
      });

      if (res?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Failed to initiate guest session.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Guest login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Field validation error states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [orgNameError, setOrgNameError] = useState('');

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameError('');
    setPasswordError('');
    setOrgNameError('');

    let hasError = false;

    // Client-side validations
    if (!username.trim()) {
      setUsernameError('Username or email is required.');
      hasError = true;
    } else if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (mode === 'signup' && password.trim().length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (mode === 'signup' && orgToggle && !orgName.trim()) {
      setOrgNameError('Workspace name is required.');
      hasError = true;
    }

    if (hasError) {
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign Up Mode: Call Register API
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            password: password.trim(),
            role: role,
            orgId: orgToggle && orgName.trim() ? orgName.trim() : undefined,
          }),
        });

        if (!signupRes.ok) {
          const data = await signupRes.json();
          setError(data.error || 'Failed to create account.');
          triggerShake();
          setLoading(false);
          return;
        }

        setSuccess('Account created successfully! Logging you in...');
      }

      // Execute login (both for standard signin, and immediately after signup)
      const res = await signIn('credentials', {
        username: username.trim().toLowerCase(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Sign-in failed. Please verify your credentials.');
        triggerShake();
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      triggerShake();
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setSuccess('');
    setUsernameError('');
    setPasswordError('');
    setOrgNameError('');
    setOrgToggle(false);
    setOrgName('');
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] font-sans text-zinc-50 p-6 selection:bg-zinc-800">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Top Logo */}
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-850 text-white">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Header Title & Subtitle (with Compose synonym) */}
        <h1 className="text-3xl sm:text-[32px] font-bold tracking-tight text-white text-center leading-tight mb-3">
          {mode === 'signin' ? 'Compose on the Open Note Platform' : 'Create an Open Note Account'}
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8 max-w-xs leading-normal">
          {mode === 'signin' 
            ? 'Sign up or login with an Open Note account to continue to your workspace.'
            : 'Register a new account to start drafting and sharing collaborative notes.'}
        </p>

        <form onSubmit={handleSubmit} className={`w-full flex flex-col transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          {error && (
            <div className="mb-4 p-3 text-xs bg-red-950/20 border border-red-900/30 text-red-400 rounded-2xl text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 text-xs bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-2xl text-center">
              {success}
            </div>
          )}

          {/* Username / Email Field */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Email address or username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full h-12 px-5 bg-transparent border rounded-full text-sm text-white placeholder-zinc-600 focus-visible:ring-0 focus:outline-none transition-all ${
                usernameError ? 'border-red-900 focus:border-red-700' : 'border-zinc-850 focus:border-zinc-600'
              }`}
            />
            {usernameError && (
              <span className="text-[10px] text-red-500 px-4 mt-1.5 block text-left">
                {usernameError}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4 relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full h-12 pl-5 pr-12 bg-transparent border rounded-full text-sm text-white placeholder-zinc-600 focus-visible:ring-0 focus:outline-none transition-all ${
                passwordError ? 'border-red-900 focus:border-red-700' : 'border-zinc-855 focus:border-zinc-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {passwordError && (
              <span className="text-[10px] text-red-500 px-4 mt-1.5 block text-left">
                {passwordError}
              </span>
            )}
          </div>

          {/* Role and Organization fields - ONLY shown on sign up */}
          {mode === 'signup' && (
            <>
              {/* Work Role Select Dropdown */}
              <div className="mb-4">
                <Select value={role} onValueChange={(val) => { if (val) setRole(val); }}>
                  <SelectTrigger className="w-full h-12 px-5 bg-transparent border border-zinc-850 focus:border-zinc-600 rounded-full text-sm text-zinc-450 transition-all flex items-center justify-between">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-2xl p-1">
                    <SelectItem value="developer">
                      <span className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 text-zinc-500" /> Developer
                      </span>
                    </SelectItem>
                    <SelectItem value="designer">
                      <span className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-zinc-500" /> Designer
                      </span>
                    </SelectItem>
                    <SelectItem value="writer">
                      <span className="flex items-center gap-2">
                        <PenTool className="h-3.5 w-3.5 text-zinc-500" /> Writer / Author
                      </span>
                    </SelectItem>
                    <SelectItem value="manager">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-zinc-500" /> Product Manager
                      </span>
                    </SelectItem>
                    <SelectItem value="founder">
                      <span className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5 text-zinc-500" /> Founder / Executive
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Join/Create Workspace Toggle */}
              <div className="mb-4 flex items-center justify-between px-5 py-3.5 bg-zinc-950/45 border border-zinc-900 rounded-3xl">
                <span className="text-xs text-zinc-400 font-medium flex items-center gap-2 select-none">
                  <Building className="h-4 w-4 text-zinc-550" />
                  <span>Use shared Organization workspace</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOrgToggle(!orgToggle);
                    setOrgName('');
                    setOrgNameError('');
                  }}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer outline-none shrink-0 ${
                    orgToggle ? 'bg-white' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-zinc-950 shadow-md transform transition-transform duration-200 ${
                      orgToggle ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Org Workspace Name Input */}
              {orgToggle && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    type="text"
                    placeholder="Workspace Name (e.g. Acme Corp)"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgNameError('');
                    }}
                    className={`w-full h-12 px-5 bg-transparent border rounded-full text-sm text-white placeholder-zinc-600 focus-visible:ring-0 focus:outline-none transition-all ${
                      orgNameError ? 'border-red-900 focus:border-red-700' : 'border-zinc-850 focus:border-zinc-600'
                    }`}
                  />
                  {orgNameError && (
                    <span className="text-[10px] text-red-500 px-4 mt-1.5 block text-left">
                      {orgNameError}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-full text-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Continuing..." : "Continue"}
          </Button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-900"></div>
            </div>
            <span className="relative px-3 bg-[#0d0d0d] text-[10px] text-zinc-500 uppercase tracking-widest">or</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowGuestConfirm(true)}
            disabled={loading}
            className="w-full h-12 border border-zinc-850 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-full text-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            Continue without an account
          </Button>
        </form>

        {/* Mode Toggle Link */}
        <div className="text-center text-xs text-zinc-400 mt-6">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-white hover:underline cursor-pointer font-semibold bg-transparent border-none p-0 focus:outline-none"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-white hover:underline cursor-pointer font-semibold bg-transparent border-none p-0 focus:outline-none"
              >
                Log in
              </button>
            </>
          )}
        </div>

      </div>

      {showGuestConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-900 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-amber-950/30 border border-amber-900/50 flex items-center justify-center text-amber-500 text-lg font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1.5">Volatile Session Warning</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Guest notes are stored entirely in client-side memory. **Refreshing the page, closing the tab, or logging out will permanently delete all your changes.**
              </p>
            </div>
            <div className="flex w-full gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowGuestConfirm(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-450 hover:text-white transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuestConfirm(false);
                  handleGuestLogin();
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors cursor-pointer"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
