/**
 * Invite Partner Page — Code + QR based invitations.
 * Generates a 6-digit code, shows QR, and offers share/copy options.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, RefreshCw, Loader2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateInviteCode } from '../../domain/utils/generateInviteCode';
import { InviteCodeDisplay } from '../components/InviteCodeDisplay';
import { QRCodeCard } from '../components/QRCodeCard';

const EXPIRY_HOURS = 48;

export const InvitePartnerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Load existing pending invitation or create new one
  const loadOrCreateInvitation = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check for existing pending invitation with a code
      const { data: existing } = await supabase
        .from('invitations')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('status', 'pending')
        .not('invite_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing && existing.expires_at && new Date(existing.expires_at) > new Date()) {
        setCode(existing.invite_code);
        setExpiresAt(new Date(existing.expires_at));
        setIsLoading(false);
        return;
      }

      // Create new invitation
      await createNewInvitation();
    } catch {
      // No existing invitation, create new one
      await createNewInvitation();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createNewInvitation = async () => {
    if (!user) return;
    setIsGenerating(true);
    setError(null);

    try {
      const newCode = generateInviteCode();
      const expires = new Date();
      expires.setHours(expires.getHours() + EXPIRY_HOURS);

      const { error: insertError } = await supabase.from('invitations').insert({
        id: crypto.randomUUID(),
        from_user_id: user.id,
        invite_code: newCode,
        status: 'pending',
        expires_at: expires.toISOString(),
      });

      if (insertError) throw insertError;

      setCode(newCode);
      setExpiresAt(expires);
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(t('invite.errorCreating'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNew = async () => {
    if (!user) return;

    // Expire old invitations
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('from_user_id', user.id)
      .eq('status', 'pending');

    await createNewInvitation();
  };

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(t('invite.expired'));
        setCode(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, t]);

  useEffect(() => {
    loadOrCreateInvitation();
  }, [loadOrCreateInvitation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-12 w-12 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back */}
          <button
            onClick={() => navigate('/dashboard')}
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
              {t('invite.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('invite.subtitle')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Code + QR */}
          {code && (
            <>
              <InviteCodeDisplay code={code} />

              <div className="mt-6">
                <QRCodeCard code={code} />
              </div>

              {/* Timer */}
              <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {t('invite.expiresIn')} <span className="font-mono font-semibold">{timeLeft}</span>
                </span>
              </div>

              {/* Generate new */}
              <button
                onClick={handleGenerateNew}
                disabled={isGenerating}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4
                  text-gray-500 dark:text-gray-400 text-sm
                  hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                data-testid="generate-new-btn"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {t('invite.generateNew')}
              </button>
            </>
          )}

          {/* No code (expired) */}
          {!code && !isLoading && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('invite.expired')}</p>
              <button
                onClick={handleGenerateNew}
                disabled={isGenerating}
                className="py-3 px-6 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('invite.generateNew')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePartnerPage;
