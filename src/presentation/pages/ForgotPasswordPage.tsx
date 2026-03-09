/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/reset-password`,
      });

      if (error) {
        setError(t('errors.generic'));
      } else {
        // Always show success to avoid email enumeration
        setIsSent(true);
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

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
          {isSent ? (
            /* Success state */
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('passwordRecovery.emailSentTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('passwordRecovery.emailSentDescription')}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center text-rose-500 hover:text-rose-600 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('passwordRecovery.backToLogin')}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {t('passwordRecovery.title')}
              </h1>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {t('passwordRecovery.subtitle')}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      data-testid="forgot-password-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  data-testid="forgot-password-submit"
                >
                  {isLoading ? t('common.loading') : t('passwordRecovery.sendResetLink')}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-rose-500 hover:text-rose-600 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('passwordRecovery.backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
