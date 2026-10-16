import '@mdi/font/css/materialdesignicons.css';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { de } from 'vuetify/locale';

let defaultTheme = 'clubLight';
try {
  if (localStorage.getItem('kegelzettel_theme') === 'clubDark') defaultTheme = 'clubDark';
} catch { /* Use the light theme when storage is unavailable. */ }

export default createVuetify({
  locale: { locale: 'de', messages: { de } },
  theme: {
    defaultTheme,
    themes: {
      clubLight: {
        dark: false,
        colors: {
          background: '#F6F7F4', surface: '#FFFFFF', 'surface-light': '#F0F3EF',
          'surface-variant': '#E7EDE8', 'on-surface-variant': '#4C6056',
          primary: '#176B4B', 'on-primary': '#FFFFFF', secondary: '#537569',
          'on-background': '#172D29', 'on-surface': '#172D29',
          error: '#B32632', success: '#176B4B', info: '#326894', warning: '#916200',
        },
      },
      clubDark: {
        dark: true,
        colors: {
          background: '#0D1B2A', surface: '#152638', 'surface-light': '#1C3146',
          'surface-variant': '#273D50', 'on-surface-variant': '#B8CADB',
          primary: '#7AF0B2', 'on-primary': '#09281B', secondary: '#A7CDBA',
          'on-background': '#EDF5FA', 'on-surface': '#EDF5FA',
          error: '#FFB4AB', success: '#7AF0B2', info: '#A7C8F1', warning: '#F5CE80',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0, style: 'letter-spacing: 0; font-weight: 600;' },
    VCard: { rounded: 'xl', elevation: 0, border: true },
    VTextField: { variant: 'outlined', color: 'primary', rounded: 'lg' },
    VCheckbox: { color: 'primary', hideDetails: true },
    VTabs: { color: 'primary' },
    VDialog: { scrollable: true },
  },
});
