/**
 * QR code card showing the invite link as a scannable QR code.
 */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface QRCodeCardProps {
  code: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ code }) => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const inviteLink = `${baseUrl}/join/${code}`;

  return (
    <div
      className="bg-white dark:bg-gray-700 rounded-xl p-6 flex flex-col items-center gap-3 shadow-sm"
      data-testid="qr-code-card"
    >
      <QRCodeSVG
        value={inviteLink}
        size={180}
        level="M"
        bgColor="transparent"
        fgColor="currentColor"
        className="text-gray-900 dark:text-white"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('invite.scanQR')}
      </p>
    </div>
  );
};

export default QRCodeCard;
