import './globals.css';

export const metadata = {
  title: 'ERPNext Document Intelligence',
  description: 'Upload and process invoices and purchase orders',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
