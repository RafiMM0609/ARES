// src/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <h1>ARES: Global Payment, Zero Resistance.</h1>
      <p>Solusi pembayaran lintas batas instan untuk freelancer.</p>
      <Link href="/login">Mulai Sekarang →</Link>
    </main>
  );
}
