import React from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - URMS Admin',
  description: 'Privacy policy for the URMS admin application',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <section className="bg-white shadow-sm rounded-lg p-6">
          <p className="mb-4">
            This Privacy Policy describes how URMS (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects,
            uses, and discloses information when you use the URMS admin application. We are committed to
            safeguarding the privacy of all users, including system administrators, agents, partners, and the
            entities whose data is processed through our platform.
          </p>

          <h2 className="text-lg font-medium mt-4">Information We Collect</h2>
          <p className="mt-2 mb-2">
            We collect and process information across several categories of users and stakeholders within the
            URMS ecosystem. The scope and nature of data collected depend on the user role and the services
            rendered:
          </p>

          <h3 className="text-base font-medium mt-3 text-gray-700">Administrator Data</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Full name, corporate email address, and administrative role designation.</li>
            <li>Authentication credentials, including cryptographically hashed passwords and session tokens, to secure access to the administrative dashboard.</li>
            <li>Audit logs capturing administrative actions, including system configuration changes, user account modifications, and access timestamps.</li>
            <li>Internet Protocol (IP) addresses, device fingerprints, and browser metadata for security monitoring and anomaly detection.</li>
            <li>Communication records and correspondence initiated through the platform for support and compliance purposes.</li>
          </ul>

          <h3 className="text-base font-medium mt-3 text-gray-700">Agent Data</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Personal identification information, including full name, government-issued identification numbers, and professional credentials or licenses.</li>
            <li>Contact details such as personal and business telephone numbers, email addresses, and physical addresses.</li>
            <li>Account authentication data, including encrypted passwords, multi-factor authentication tokens, and account recovery information.</li>
            <li>Transactional history and assignment records pertaining to services rendered or facilitated through the platform.</li>
            <li>Geolocation data and device information collected during platform usage for verification and fraud prevention.</li>
            <li>Background verification data and compliance documentation submitted during the onboarding process.</li>
          </ul>

          <h3 className="text-base font-medium mt-3 text-gray-700">Partner Data</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Organizational details, including registered business name, tax identification numbers, corporate structure, and business registration documents.</li>
            <li>Primary contact information for authorized representatives, including names, official titles, direct contact numbers, and corporate email addresses.</li>
            <li>Financial data required for transactional purposes, including banking details, invoicing addresses, and payment processing information.</li>
            <li>Service-level agreements, contractual documents, and compliance certifications governing the partnership relationship.</li>
            <li>Performance metrics, commission structures, and reconciliation reports generated in the course of business operations.</li>
            <li>Communication logs, meeting records, and correspondence maintained for business continuity and dispute resolution.</li>
          </ul>

          <h3 className="text-base font-medium mt-3 text-gray-700">Entity Data</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Business registration particulars, including legal entity name, incorporation number, registered address, and jurisdiction of incorporation.</li>
            <li>Beneficial ownership information and organizational hierarchy details to satisfy regulatory compliance and know-your-customer (KYC) obligations.</li>
            <li>Operational data such as transaction volumes, revenue reports, financial statements, and business activity records.</li>
            <li>Designated representative information, including names, contact details, and authorization documents for individuals acting on behalf of the entity.</li>
            <li>Tax-related documentation, including tax clearance certificates, VAT registration numbers, and historical tax filings.</li>
            <li>Due diligence records, risk assessment profiles, and ongoing compliance monitoring data collected pursuant to applicable regulations.</li>
          </ul>

          <h2 className="text-lg font-medium mt-4">How We Use Information</h2>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>To authenticate authorized users, manage account credentials, and enforce role-based access controls across the platform.</li>
            <li>To facilitate revenue collection, agent onboarding, partner reconciliation, and entity management operations.</li>
            <li>To comply with legal and regulatory obligations, including anti-money laundering (AML) and counter-terrorism financing (CTF) requirements.</li>
            <li>To conduct system audits, generate performance analytics, and continuously improve platform reliability and security.</li>
            <li>To communicate important service updates, policy changes, and account-related notifications to relevant stakeholders.</li>
          </ul>

          <h2 className="text-lg font-medium mt-4">Data Retention</h2>
          <p className="mt-2">
            We retain personal and organizational data only for as long as necessary to fulfill the purposes
            described in this policy, unless a longer retention period is required or permitted by applicable
            law. Retention schedules are determined based on the nature of the data, legal obligations,
            and operational requirements. Upon expiration of the applicable retention period, data is securely
            deleted or anonymized.
          </p>

          <h2 className="text-lg font-medium mt-4">Data Sharing and Disclosure</h2>
          <p className="mt-2">
            We do not sell personal information to third parties. We may share information with:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Regulatory authorities and law enforcement agencies as required by applicable law or in response to valid legal requests.</li>
            <li>Service providers and subcontractors who perform functions on our behalf, subject to contractual data protection obligations.</li>
            <li>Affiliated entities within the URMS group of companies for legitimate business purposes consistent with this policy.</li>
          </ul>

          <h2 className="text-lg font-medium mt-4">Security</h2>
          <p className="mt-2">
            We implement and maintain commercially reasonable administrative, technical, and physical security
            measures designed to protect information against unauthorized access, alteration, disclosure, or
            destruction. These measures include encryption of data in transit and at rest, regular security
            assessments, access control mechanisms, and employee training on data protection practices.
            However, no method of transmission over the Internet or electronic storage is completely secure,
            and we cannot guarantee absolute security.
          </p>

          <h2 className="text-lg font-medium mt-4">Your Rights and Choices</h2>
          <p className="mt-2">
            Depending on your jurisdiction, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>The right to access, correct, or update your personal data held by us.</li>
            <li>The right to request deletion of your personal data, subject to legal retention obligations.</li>
            <li>The right to restrict or object to the processing of your personal data in certain circumstances.</li>
            <li>The right to data portability, where technically feasible.</li>
            <li>The right to withdraw consent at any time, without affecting the lawfulness of processing based on consent before its withdrawal.</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, please contact the system administrator through the account management
            interface or using the contact details provided below. We will respond to your request within the
            timeframe prescribed by applicable law.
          </p>

          <h2 className="text-lg font-medium mt-4">Contact Us</h2>
          <p className="mt-2">
            If you have any questions, concerns, or complaints regarding this Privacy Policy or our data
            handling practices, please contact the application administrator or our Data Protection Officer at:
          </p>
          <p className="mt-2">
            <strong>URMS Data Protection Office</strong><br />
            Email: privacy@urms.com<br />
            Address: [Registered Business Address]
          </p>

          <h2 className="text-lg font-medium mt-4">Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time to reflect changes in our practices, legal
            requirements, or operational needs. Material changes will be communicated through the application
            or via email to registered users. Continued use of the application after such changes constitutes
            acceptance of the updated policy.
          </p>
        </section>
      </div>
    </main>
  )
}