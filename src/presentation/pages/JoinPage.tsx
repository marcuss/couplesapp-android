/**
 * Join Page — Enter invite code to connect with partner.
 * Supports pre-filled code via URL param (/join/K7M4R2).
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CodeInput } from '../components/CodeInput';

type JoinStatus = 'input' | 'loading' | 'success' | 'error' | 'needsAuth';

export const JoinPage: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [code, setCode] = useState(urlCode?.toUpperCase() || '');
  const [status, setStatus] = useState<JoinStatus>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const [inviterName, setInviterName] = useState('');

  // Auto-submit when code is pre-filled from URL and user is logged in
  useEffect(() => {
    if (urlCode && urlCode.length === 6 && user) {
      handleSubmit(urlCode.toUpperCase());
    }
  }, [urlCode, user]);

  const handleSubmit = async (submitCode?: string) => {
    const finalCode = submitCode || code;
    if (finalCode.length !== 6) return;

    if (!user) {
      // Store code and redirect to login
      sessionStorage.setItem('pendingInviteCode', finalCode);
      setStatus('needsAuth');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Look up the invitation
      const { data: invitation, error: lookupError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invite_code', finalCode)
        .eq('status', 'pending')
        .single();

      if (lookupError || !invitation) {
        setErrorMessage(t('join.invalidCode'));
        setStatus('error');
        return;
      }

      // Check expiration
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setErrorMessage(t('join.expiredCode'));
        setStatus('error');
        return;
      }

      // Can't invite yourself
      if (invitation.from_user_id === user.id) {
        setErrorMessage(t('join.cantInviteSelf'));
        setStatus('error');
        return;
      }

      // Get inviter name
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', invitation.from_user_id)
        .single();

      // Accept invitation: update both profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ partner_id: invitation.from_user_id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await supabase
        .from('profiles')
        .update({ partner_id: user.id })
        .eq('id', invitation.from_user_id);

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      setInviterName(inviterProfile?.name || '');
      setStatus('success');
      sessionStorage.removeItem('pendingInviteCode');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setErrorMessage(t('join.errorAccepting'));
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('join.connected')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('join.connectedWith', { name: inviterName || t('join.yourPartner') })}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            {t('join.goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('join.oops')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
          <button
            onClick={() => { setStatus('input'); setErrorMessage(''); }}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            {t('join.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            {t('common.back')}
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('join.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('join.subtitle')}
            </p>
          </div>

          {/* Code input */}
          <div className="mb-6">
            <CodeInput
              value={code}
              onChange={setCode}
              disabled={status === 'loading'}
              autoFocus={!urlCode}
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => handleSubmit()}
            disabled={code.length !== 6 || status === 'loading'}
            className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg
              hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center"
            data-testid="join-submit"
          >
            {status === 'loading' ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('join.connecting')}</>
            ) : (
              <><Heart className="h-5 w-5 mr-2" /> {t('join.connect')}</>
            )}
          </button>

          {/* Auth prompt */}
          {status === 'needsAuth' && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                {t('join.needsAccount')}
              </p>
              <div className="flex gap-3">
                <Link
                  to="/register"
                  className="flex-1 py-2 px-4 bg-rose-500 text-white rounded-lg text-center hover:bg-rose-600 transition-colors text-sm"
                >
                  {t('auth.register')}
                </Link>
                <Link
                  to="/login"
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {t('auth.login')}
                </Link>
              </div>
            </div>
          )}

          {/* Divider + login link */}
          {status === 'input' && !user && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('join.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-rose-500 hover:text-rose-600">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
