'use client'
import { useState } from 'react';
import { signUp, confirmSignUp, signIn, getCurrentUser } from 'aws-amplify/auth';

interface AuthError {
  message?: string;
}

export default function HuddleApp({ children }: { children: React.ReactNode }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default to India
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'signUp' | 'confirmSignUp' | 'signIn' | 'authenticated'>('signUp');
  const [error, setError] = useState('');

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digit characters except plus sign
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    setPhoneNumber(cleaned);
  };

  const getFullPhoneNumber = () => {
    return `${countryCode}${phoneNumber}`;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = getFullPhoneNumber();
    console.log('Attempting sign up with:', fullPhoneNumber);
    try {
      const signUpResult = await signUp({
        username: fullPhoneNumber,
        password: Math.random().toString(36) + Date.now().toString(36), // Random password since we won't use it
        options: {
          userAttributes: {
            phone_number: fullPhoneNumber
          },
          autoSignIn: true
        }
      });
      console.log('Sign up result:', signUpResult);
      setStep('confirmSignUp');
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.error('Sign up error:', authError);
      if (authError.message?.includes('User already exists')) {
        // If user exists, move to sign in
        handleSignIn(e);
      } else {
        setError(authError.message || 'An error occurred');
      }
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = getFullPhoneNumber();
    console.log('Attempting to confirm sign up for:', fullPhoneNumber);
    try {
      const confirmResult = await confirmSignUp({
        username: fullPhoneNumber,
        confirmationCode: otp
      });
      console.log('Confirm sign up result:', confirmResult);
      setStep('authenticated');
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.error('Confirm sign up error:', authError);
      setError(authError.message || 'An error occurred');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhoneNumber = getFullPhoneNumber();
    console.log('Attempting sign in with:', fullPhoneNumber);
    try {
      const signInResult = await signIn({ username: fullPhoneNumber });
      console.log('Sign in result:', signInResult);
      setStep('confirmSignUp');
    } catch (err: unknown) {
      const authError = err as AuthError;
      console.error('Sign in error:', authError);
      setError(authError.message || 'An error occurred');
    }
  };

  if (step === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'signUp' ? 'Create Account' : 'Enter OTP'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={step === 'signUp' ? handleSignUp : handleConfirmSignUp}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          {step === 'signUp' && (
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 flex">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none rounded-l-md relative block w-24 px-3 py-2 border border-r-0 border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="+91">+91 🇮🇳</option>
                  <option value="+1">+1 🇺🇸</option>
                  <option value="+44">+44 🇬🇧</option>
                  <option value="+61">+61 🇦🇺</option>
                  <option value="+86">+86 🇨🇳</option>
                </select>
                <input
                  id="phone-number"
                  name="phone-number"
                  type="tel"
                  required
                  className="appearance-none rounded-r-md relative block w-full px-3 py-2 border border-l-0 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  maxLength={10}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter your 10-digit mobile number
              </p>
            </div>
          )}

          {step === 'confirmSignUp' && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <div className="mt-1">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the 6-digit code sent to {getFullPhoneNumber()}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {step === 'signUp' ? 'Continue' : 'Verify OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}