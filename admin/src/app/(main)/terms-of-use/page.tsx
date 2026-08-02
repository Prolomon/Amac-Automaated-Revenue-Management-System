import React from 'react'
import Link from 'next/link'
import { Home, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Use - Amac Revenue Management System',
  description: 'Terms of use for the Abuja Municipal Area Council Revenue Management System.',
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="mt-4 mb-2 text-lg font-semibold text-slate-900">{title}</h2>
    <div className="space-y-2 leading-relaxed text-slate-600">{children}</div>
  </section>
)

export default function TermsOfUsePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-900">
        <Home className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Legal</p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Terms of Use</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="mb-4 text-slate-600">
          These Terms of Use govern your access to and use of the Amac Revenue Management System (&ldquo;the
          Platform&rdquo;), operated on behalf of the Abuja Municipal Area Council (&ldquo;AMAC&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), whether you are paying a rate, checking your account, applying through our recruitment
          portal, or using the administrative dashboard as an authorized agent or staff member. By using the Platform,
          you agree to these terms.
        </p>

        <Section title="1. Who Can Use the Platform">
          <p>
            The public payment and recruitment areas of the Platform are open to any ratepayer, business owner, or
            job applicant. The administrative dashboard is restricted to authorized council staff and registered
            agents, who must not share their login credentials with anyone else.
          </p>
        </Section>

        <Section title="2. Payments">
          <ul className="list-disc space-y-1 pl-5">
            <li>Amounts shown on an invoice or assessment are based on the property, business category, and records held by the council at the time of billing.</li>
            <li>Payments are processed through our approved payment gateway partners. A successful transaction will always generate a digital receipt referencing your payment.</li>
            <li>Payments already received by the council are generally non-refundable, except in cases of confirmed duplicate or erroneous payment, which will be investigated and resolved by our support team.</li>
            <li>If a payment is deducted from your account but not confirmed on the Platform, contact support with your transaction reference so we can reconcile it promptly.</li>
            <li>We never request payment into a personal bank account. Only pay through the Platform, our official USSD/bank channels, or a field agent whose identity you have verified.</li>
          </ul>
        </Section>

        <Section title="3. Accuracy of Information">
          <p>
            You are responsible for providing accurate and up-to-date information about your property, business, or
            application. Knowingly submitting false information to reduce an assessment or misrepresent an
            application may result in the reversal of any resulting benefit and, where applicable, referral to the
            relevant authorities.
          </p>
        </Section>

        <Section title="4. Recruitment Applications">
          <p>
            Applying through the recruitment portal is free of charge. We do not charge any fee to apply, sit for an
            assessment, attend an interview, or receive an offer. Submitting an application does not guarantee a
            role, and all applications are reviewed at the council&apos;s discretion.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>
            You agree not to misuse the Platform, attempt to gain unauthorized access to accounts or data, interfere
            with its normal operation, or use it for any unlawful purpose, including impersonating council staff or
            agents.
          </p>
        </Section>

        <Section title="6. Administrative and Agent Accounts">
          <p>
            Agents and staff with access to the administrative dashboard must use their access only for legitimate
            council business, keep collection records accurate, and safeguard any wallet or member data they handle.
            Access may be suspended or revoked for misuse or breach of these terms.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The design, branding, and software behind the Platform belong to AMAC and its technology partners. You
            may not copy, modify, or redistribute any part of the Platform without prior written permission.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            While we take reasonable steps to keep the Platform accurate and available, it is provided &ldquo;as
            is&rdquo;. To the extent permitted by law, AMAC is not liable for indirect or consequential losses
            arising from your use of the Platform, including temporary unavailability or third-party payment gateway
            issues, though we will work to resolve any such issues promptly.
          </p>
        </Section>

        <Section title="9. Governing Law">
          <p>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from use of
            the Platform will first be addressed through our support channels before any formal proceedings.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms from time to time to reflect changes in our services or legal requirements.
            Material changes will be posted on this page with an updated revision date. Continued use of the Platform
            after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
          <p>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:support@abujamunicipal.gov.ng" className="font-medium text-emerald-800 hover:text-emerald-900">
              support@abujamunicipal.gov.ng
            </a>.
          </p>
        </footer>
      </div>
    </main>
  )
}
