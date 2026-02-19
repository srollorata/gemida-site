import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Gemida Family - Kaliwat ni Cresenciano og Ricarda',
  description: 'A beautiful family site to connect, share memories, and explore your family tree',
  icons: {
    icon: '/image/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
