export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Layout untuk Auth - tanpa navbar */}
      {children}
    </div>
  );
}
