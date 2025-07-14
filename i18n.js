// i18n.js
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

// Default to 'en' if undefined
const locale = Localization.locale || 'en';

i18n.translations = {
  en: {
    welcome: 'Welcome to YanYu',
    chooseLang: 'Choose Language',
    settings: 'Settings',
    start: 'Start',
  },
  zh: {
    welcome: '欢迎使用言遇',
    chooseLang: '选择语言',
    settings: '设置',
    start: '开始',
  },
};

i18n.locale = locale;
i18n.fallbacks = true;

export default i18n;
