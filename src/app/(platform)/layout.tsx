export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Layout umum untuk platform - dengan Navbar */}
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <strong>ARES Platform</strong>
      </nav>
      {children}
    </div>
  );
}
