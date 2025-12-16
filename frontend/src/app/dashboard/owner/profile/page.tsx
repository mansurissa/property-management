'use client';

import ProfilePage from '@/components/profile/ProfilePage';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function OwnerProfilePage() {
  const { t } = useLanguage();
  return <ProfilePage title={t('profile.myProfile')} />;
}
