import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Privacy Policy' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-blue-600 text-white py-14 px-6 text-center">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-blue-100 text-sm">Last updated: January 2025</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 flex-1">
        <Section title="1. Information We Collect">
          <p>We collect information you provide directly: name, email address, phone number, and profile photo when you register. If you sign in with Google, we receive your Google profile information.</p>
          <p>We also collect usage data: pages visited, searches performed, listings viewed, and interactions with agents. This helps us improve the platform.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>Your information is used to: operate your account, connect buyers with agents, send notifications about listings and offers, improve our services, and comply with legal obligations.</p>
          <p>We do not sell your personal data to third parties. We do not use your data for advertising outside of HomeFindr.</p>
        </Section>

        <Section title="3. Sharing Your Information">
          <p>When you contact an agent or submit an offer, your name, email, and phone number are shared with that agent. Agents agree to our data handling terms.</p>
          <p>We use trusted third-party services for hosting (Railway), storage (Cloudflare R2), payments (Stripe), and analytics. Each is bound by their own privacy policies.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by emailing privacy@homefindr.ng.</p>
        </Section>

        <Section title="5. Security">
          <p>We use industry-standard security measures including HTTPS encryption, hashed passwords, and access controls. However, no internet transmission is 100% secure.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:privacy@homefindr.ng" className="text-blue-600 hover:underline">privacy@homefindr.ng</a> to exercise these rights.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use essential cookies to keep you logged in. We do not use third-party tracking cookies. You can disable cookies in your browser, but some features may not work.</p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this policy periodically. We will notify you of significant changes via email or an in-app notice. Continued use of HomeFindr after changes constitutes acceptance.</p>
        </Section>

        <Section title="9. Contact">
          <p>Questions about this policy? Email <a href="mailto:privacy@homefindr.ng" className="text-blue-600 hover:underline">privacy@homefindr.ng</a> or write to us at 14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria.</p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}