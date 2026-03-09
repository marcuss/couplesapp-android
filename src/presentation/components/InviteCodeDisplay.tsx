/**
 * Displays a generated invite code with copy and share buttons.
 */
import React, { useState } from 'react';
import { Copy, Check, Share2, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InviteCodeDisplayProps {
  code: string;
  onGenerateNew?: () => void;
}

export const InviteCodeDisplay: React.FC<InviteCodeDisplayProps> = ({ code }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const inviteLink = `${baseUrl}/join/${code}`;

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LoveCompass',
          text: t('invite.shareText', { code }),
          url: inviteLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyToClipboard(inviteLink, 'link');
    }
  };

  return (
    <div className="space-y-6" data-testid="invite-code-display">
      {/* Code display */}
      <div className="flex gap-2 sm:gap-3 justify-center" data-testid="invite-code-digits">
        {code.split('').map((char, i) => (
          <div
            key={i}
            className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center
              text-2xl sm:text-3xl font-bold rounded-xl
              bg-gradient-to-b from-rose-50 to-pink-50 dark:from-gray-700 dark:to-gray-800
              border-2 border-rose-200 dark:border-rose-800
              text-rose-600 dark:text-rose-400
              shadow-sm"
          >
            {char}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => copyToClipboard(code, 'code')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4
            bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-200 rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          data-testid="copy-code-btn"
        >
          {copied === 'code' ? (
            <><Check className="h-5 w-5 text-green-500" /> {t('invite.copied')}</>
          ) : (
            <><Copy className="h-5 w-5" /> {t('invite.copyCode')}</>
          )}
        </button>

        <button
          onClick={() => copyToClipboard(inviteLink, 'link')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4
            bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
            text-gray-700 dark:text-gray-200 rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          data-testid="copy-link-btn"
        >
          {copied === 'link' ? (
            <><Check className="h-5 w-5 text-green-500" /> {t('invite.copied')}</>
          ) : (
            <><Link className="h-5 w-5" /> {t('invite.copyLink')}</>
          )}
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4
              bg-rose-500 text-white rounded-lg
              hover:bg-rose-600 transition-colors"
            data-testid="share-btn"
          >
            <Share2 className="h-5 w-5" /> {t('invite.share')}
          </button>
        )}
      </div>
    </div>
  );
};

export default InviteCodeDisplay;
