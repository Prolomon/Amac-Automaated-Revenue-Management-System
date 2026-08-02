import React from 'react'
import Link from 'next/link'
import { Home, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Amac Revenue Management System',
  description: 'Privacy policy for the Abuja Municipal Area Council Revenue Management System.',
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="mt-4 mb-2 text-lg font-semibold text-slate-900">{title}</h2>
    <div className="space-y-2 leading-relaxed text-slate-600">{children}</div>
  </section>
)

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-900">
        <Home className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Legal</p>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Privacy Policy</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="mb-4 text-slate-600">
          This Privacy Policy describes how the Abuja Municipal Area Council (&ldquo;AMAC&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects information when you use the Amac
          Revenue Management System (&ldquo;the Platform&rdquo;) to pay tenement rates, business permits, or other
          council revenue, register as a member, or apply for a role through our recruitment portal.
        </p>

        <Section title="1. Information We Collect">
          <p>The information we collect depends on how you use the Platform:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><span className="font-medium text-slate-900">Ratepayers and businesses:</span> full name, phone number, email address, property or business location, assessment details, and payment history.</li>
            <li><span className="font-medium text-slate-900">Payment information:</span> transaction reference, amount, payment method, and confirmation status. Card and bank details are processed directly by our licensed payment gateway partners and are not stored on our servers.</li>
            <li><span className="font-medium text-slate-900">Recruitment applicants:</span> full name, date of birth, gender, state and local government of origin, address, bank account details for payroll purposes, and supporting documents you submit.</li>
            <li><span className="font-medium text-slate-900">Agents and staff:</span> identification details, assigned wallet and collection records, and device information used for verification.</li>
            <li><span className="font-medium text-slate-900">Technical data:</span> IP address, browser type, and general usage data collected automatically to keep the Platform secure and functioning correctly.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc space-y-1 pl-5">
            <li>To assess, invoice, and collect tenement and business rates owed to the council.</li>
            <li>To verify your identity, process payments, and issue digital receipts.</li>
            <li>To process recruitment applications and communicate with applicants.</li>
            <li>To detect and prevent fraud, including impersonation of council staff or agents.</li>
            <li>To respond to enquiries, complaints, and support requests.</li>
            <li>To comply with legal, tax, and regulatory obligations under Nigerian law.</li>
          </ul>
        </Section>

        <Section title="3. Payment Processing and Third Parties">
          <p>
            Payments made through the Platform are processed using approved payment gateways, including Remita and
            our technology partner Tr3-G Innovations Limited. These providers handle card and bank transaction data
            under their own security standards, and we only receive confirmation of successful or failed transactions,
            not your full card details.
          </p>
        </Section>

        <Section title="4. Data Sharing and Disclosure">
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Relevant departments within the council for revenue assessment, reconciliation, and service delivery.</li>
            <li>Licensed payment gateway providers strictly to process your transaction.</li>
            <li>Regulatory bodies, auditors, or law enforcement agencies where required by law.</li>
            <li>Service providers who support the technical operation of the Platform, under confidentiality obligations.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain payment, assessment, and applicant records for as long as necessary to meet our statutory,
            audit, and administrative obligations, and in line with applicable Nigerian record-keeping requirements.
            When information is no longer required, it is securely deleted or anonymized.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We use encrypted connections (SSL/TLS) for all data transmitted through the Platform and restrict access
            to personal data to authorized staff and agents on a need-to-know basis. While we work to protect your
            information, no system can guarantee absolute security, so we encourage you to keep your login details
            and payment confirmations private and to report anything suspicious immediately.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>
            In line with the Nigeria Data Protection Act, you may request access to, correction of, or deletion of
            your personal information held by us, subject to our legal retention obligations. To exercise these
            rights, contact us using the details below.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            The Platform is intended for use by adults conducting property, business, or employment-related
            transactions. We do not knowingly collect personal information from children.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal
            requirements. Material changes will be posted on this page with an updated revision date.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy or how your information is handled, contact:
          </p>
          <p className="mt-2 text-slate-900">
            <span className="font-semibold">Abuja Municipal Area Council &mdash; Revenue Management System</span><br />
            Email: <a href="mailto:support@abujamunicipal.gov.ng" className="text-emerald-800 hover:text-emerald-900">support@abujamunicipal.gov.ng</a><br />
            Address: Abuja Municipal Area Council Secretariat, Abuja Municipal Town, FCT &mdash; Abuja, Nigeria
          </p>
        </Section>
      </div>
    </main>
  )
}
