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
          Revenue Management System, available at{" "}
          <a href="https://urm.afriverge.com" className="text-emerald-800 hover:text-emerald-900">
            urm.afriverge.com
          </a>{" "}
          (&ldquo;the Platform&rdquo;), operated on our behalf by our technology partner Afriverge, to pay tenement
          rates, business permits, or other council revenue, register as a member, complete identity verification
          (KYC), or apply for a role through our recruitment portal.
        </p>

        <Section title="1. Information We Collect">
          <p>The information we collect depends on how you use the Platform:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><span className="font-medium text-slate-900">Ratepayers and businesses:</span> full name, phone number, email address, property or business location, assessment details, and payment history.</li>
            <li><span className="font-medium text-slate-900">Payment information:</span> transaction reference, amount, payment method, and confirmation status. Card and bank details are processed directly by our licensed payment gateway partners and are not stored on our servers.</li>
            <li><span className="font-medium text-slate-900">Know Your Customer (KYC) and identity verification data:</span> Bank Verification Number (BVN), National Identification Number (NIN), government-issued identification (national ID card, driver&rsquo;s licence, international passport, voter&rsquo;s card), passport photograph, utility bill or proof of address, date of birth, gender, nationality, and signature specimen, collected where required to verify your identity, meet Central Bank of Nigeria (CBN) customer due diligence requirements, and prevent fraud, money laundering, and impersonation.</li>
            <li><span className="font-medium text-slate-900">Recruitment applicants:</span> full name, date of birth, gender, state and local government of origin, address, bank account details for payroll purposes, and supporting documents you submit.</li>
            <li><span className="font-medium text-slate-900">Agents and staff:</span> identification details, BVN/NIN where applicable, assigned wallet and collection records, and device information used for verification.</li>
            <li><span className="font-medium text-slate-900">Technical data:</span> IP address, device identifiers, browser type, geolocation (where enabled), and general usage data collected automatically to keep the Platform secure and functioning correctly.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc space-y-1 pl-5">
            <li>To assess, invoice, and collect tenement and business rates owed to the council.</li>
            <li>To verify your identity, process payments, and issue digital receipts.</li>
            <li>To conduct KYC and customer due diligence checks, including BVN/NIN validation against records held by licensed verification providers, in line with CBN and Nigeria Inter-Bank Settlement System (NIBSS) requirements.</li>
            <li>To process recruitment applications and communicate with applicants.</li>
            <li>To detect and prevent fraud, identity theft, and impersonation of council staff or agents.</li>
            <li>To meet anti-money laundering (AML) and combating-the-financing-of-terrorism (CFT) obligations.</li>
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

        <Section title="4. KYC Verification Partners">
          <p>
            Where identity verification is required, we may transmit your BVN, NIN, or other identification details
            to licensed verification providers (including NIBSS, the National Identity Management Commission
            (NIMC), and CBN-licensed financial institutions) solely to confirm your identity. These partners
            process such data under their own regulatory obligations, and we retain only the verification outcome
            and the minimum data necessary for our records, unless a longer retention period is required by law.
          </p>
        </Section>

        <Section title="5. Data Sharing and Disclosure">
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Relevant departments within the council for revenue assessment, reconciliation, and service delivery.</li>
            <li>Licensed payment gateway and KYC verification providers strictly to process your transaction or verify your identity.</li>
            <li>Regulatory bodies, auditors, or law enforcement agencies where required by law, including the Central Bank of Nigeria, the Nigeria Financial Intelligence Unit (NFIU), and the Nigeria Data Protection Commission (NDPC).</li>
            <li>Service providers, including Afriverge, who support the technical operation of the Platform, under confidentiality obligations.</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain payment, assessment, KYC, and applicant records for as long as necessary to meet our
            statutory, audit, and administrative obligations, and in line with applicable Nigerian record-keeping
            requirements, including CBN AML/CFT retention rules, which may require certain identity verification
            records to be kept for a minimum period after the relationship with you ends. When information is no
            longer required, it is securely deleted or anonymized.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We use encrypted connections (SSL/TLS) for all data transmitted through the Platform and restrict access
            to personal data, including KYC records, to authorized staff and agents on a need-to-know basis. While
            we work to protect your information, no system can guarantee absolute security, so we encourage you to
            keep your login details, BVN/NIN, and payment confirmations private and to report anything suspicious
            immediately.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>
            In line with the Nigeria Data Protection Act (NDPA) 2023 and its subsidiary regulations, and subject to
            the constitutional right to privacy recognized under Section 37 of the Constitution of the Federal
            Republic of Nigeria 1999 (as amended), you may request access to, correction of, portability of, or
            deletion of your personal information held by us, and may object to or restrict certain processing,
            subject to our legal retention obligations. To exercise these rights, contact us using the details
            below.
          </p>
        </Section>

        <Section title="9. Regulatory Framework">
          <p>We process personal data in accordance with, among others:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The Constitution of the Federal Republic of Nigeria 1999 (as amended), Section 37 (right to privacy).</li>
            <li>The Nigeria Data Protection Act, 2023, and the Nigeria Data Protection Commission&rsquo;s General Application and Implementation Directive.</li>
            <li>Central Bank of Nigeria (CBN) Know Your Customer (KYC) and Customer Due Diligence Regulations, and the CBN AML/CFT Regulations.</li>
            <li>The Money Laundering (Prevention and Prohibition) Act, 2022, and the Terrorism (Prevention and Prohibition) Act, 2022.</li>
            <li>The NIBSS BVN and National Identity Management Commission (NIMC) NIN frameworks governing identity verification.</li>
            <li>Applicable Federal Capital Territory and local government revenue laws under which AMAC assesses and collects rates.</li>
          </ul>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            The Platform is intended for use by adults conducting property, business, employment-related, or
            identity-verification transactions. We do not knowingly collect personal information from children.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, our KYC and
            verification requirements, or legal and regulatory requirements. Material changes will be posted on
            this page with an updated revision date.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy, how your information (including KYC data)
            is handled, or wish to exercise your rights under the NDPA, contact:
          </p>
          <p className="mt-2 text-slate-900">
            <span className="font-semibold">Abuja Municipal Area Council &mdash; Revenue Management System</span><br />
            Website: <a href="https://urm.afriverge.com" className="text-emerald-800 hover:text-emerald-900">urm.afriverge.com</a><br />
            Email: <a href="mailto:support@abujamunicipal.gov.ng" className="text-emerald-800 hover:text-emerald-900">support@abujamunicipal.gov.ng</a><br />
            Address: Abuja Municipal Area Council Secretariat, Abuja Municipal Town, FCT &mdash; Abuja, Nigeria
          </p>
        </Section>
      </div>
    </main>
  )
}
