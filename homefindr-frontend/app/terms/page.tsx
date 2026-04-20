import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Terms of Service' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
    <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-blue-600 text-white py-14 px-6 text-center">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-blue-100 text-sm">Last updated: January 2025</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 flex-1">
        <Section title="1. Acceptance of Terms">
          <p>By accessing or using HomeFindr, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years old to use HomeFindr. By creating an account, you confirm that all information you provide is accurate and truthful.</p>
        </Section>

        <Section title="3. User Accounts">
          <p>You are responsible for maintaining the security of your account credentials. Do not share your password. You are responsible for all activity under your account.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
        </Section>

        <Section title="4. Listings & Content">
          <p>Agents are solely responsible for the accuracy of their property listings. HomeFindr does not guarantee the accuracy of any listing information.</p>
          <p>By uploading photos, videos, or other content, you grant HomeFindr a non-exclusive, royalty-free licence to display that content on the platform.</p>
          <p>Prohibited content includes: fraudulent listings, misleading descriptions, copyrighted material you do not own, and offensive or illegal content.</p>
        </Section>

        <Section title="5. Transactions">
          <p>HomeFindr facilitates connections between buyers and agents. We are not a party to any property transaction. All agreements, contracts, and payments are between the buyer, seller, and agent.</p>
          <p>Earnest deposit payments processed through our platform are subject to our payment provider&apos;s (Stripe) terms.</p>
        </Section>

        <Section title="6. Fees">
          <p>Creating an account and browsing listings is free. Agent commission rates are disclosed on each listing. HomeFindr may charge platform fees for premium features; these will always be disclosed upfront.</p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>HomeFindr is provided &quot;as is&quot;. We do not warrant that the platform will be error-free or uninterrupted. To the maximum extent permitted by Nigerian law, HomeFindr is not liable for any indirect, incidental, or consequential damages.</p>
        </Section>

        <Section title="8. Governing Law">
          <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State.</p>
        </Section>

        <Section title="9. Changes">
          <p>We may update these terms at any time. Continued use of HomeFindr after changes constitutes acceptance of the new terms. We will notify you of material changes via email.</p>
        </Section>

        <Section title="10. Contact">
          <p>For questions about these terms, contact <a href="mailto:legal@homefindr.ng" className="text-blue-600 hover:underline">legal@homefindr.ng</a>.</p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}