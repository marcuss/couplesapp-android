/**
 * Reset Password Page
 * Allows users to set a new password after clicking the reset link from email.
 * Supabase redirects here with the token in the URL fragment.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    // Also check if we already have a session (user might have arrived with token)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(t('passwordRecovery.resetError'));
      } else {
        setIsSuccess(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <Heart className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('passwordRecovery.invalidLink')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('passwordRecovery.invalidLinkDescription')}
            </p>
            <Link
              to="/forgot-password"
              className="text-rose-500 hover:text-rose-600 font-medium"
            >
              {t('passwordRecovery.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-12 w-12 text-rose-500" />
            <span className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              {t('common.appName')}
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {isSuccess ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('passwordRecovery.resetSuccessTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('passwordRecovery.resetSuccessDescription')}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {t('passwordRecovery.resetTitle')}
              </h1>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {t('passwordRecovery.resetSubtitle')}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('passwordRecovery.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      data-testid="reset-password-new"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      data-testid="reset-password-confirm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  data-testid="reset-password-submit"
                >
                  {isLoading ? t('common.loading') : t('passwordRecovery.resetButton')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
