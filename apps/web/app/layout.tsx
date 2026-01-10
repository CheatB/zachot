import '../styles/tokens.css';

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: 'Zachot',
  description: 'Система генераций образовательного продукта «Зачёт»',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}


