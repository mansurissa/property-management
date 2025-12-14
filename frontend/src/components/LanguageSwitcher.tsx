'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Locale } from '@/lib/i18n/translations';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  const languages = [
    { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
    { code: 'rw' as Locale, name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr' as Locale, name: 'Français', flag: '🇫🇷' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    setLocale(newLocale);
  };

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={handleChange}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
