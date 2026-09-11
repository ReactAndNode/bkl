import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'normalize.css/normalize.css';
import './static/css/main.scss';

config.autoAddCss = false;

export const metadata = {
  metadataBase: new URL('https://bowenkliu.com'),
  title: { default: 'Bowen K Liu', template: '%s | Bowen K Liu' },
  description: "Bowen K Liu's personal website.",
  icons: {
    icon: '/images/favicon/favicon.ico',
    apple: '/images/favicon/apple-touch-icon.png',
  },
  manifest: '/images/favicon/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Shared across routes in the App Router root layout. */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700|Raleway:400,800,900&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
