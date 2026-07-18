import React from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata = {
  title: 'Terms of Use - URMS Admin',
  description: 'Terms of use for the URMS administration panel.',
}

const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{title}</h3>
    <div className="text-gray-600 leading-relaxed">{children}</div>
  </section>
)

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <section className="bg-white shadow-sm rounded-lg p-6">
          <p className="mb-4 text-gray-600">
            Welcome to the URMS administration panel. These Terms of Use govern your access to and use of our admin
            interface, services, and related functionality. By accessing or using the admin panel you agree to comply
            with these terms.
          </p>

          <Section title="1. Access and Eligibility">
            <p>
              Access to the administration panel is granted to authorized users only. You must not permit others to use
              your account. By using the panel you represent that you are authorized to manage the resources assigned to
              you and that your use complies with applicable laws and organizational policies.
            </p>
          </Section>

          <Section title="2. Acceptable Use">
            <p>
              You agree not to misuse the service, interfere with others&apos; access, attempt to breach security, or use the
              panel to store or distribute unlawful content. Administrative capabilities are powerful—exercise them
              responsibly and only for legitimate business purposes.
            </p>
          </Section>

          <Section title="3. Data and Privacy">
            <p>
              The administration panel may display or process personal and sensitive data. You must handle such data in
              accordance with applicable privacy laws and the organization&apos;s data protection policies. Unauthorized
              disclosure is strictly prohibited.
            </p>
          </Section>

          <Section title="4. Intellectual Property">
            <p>
              The content, design, and functionality of the admin panel are protected by intellectual property laws. You
              may not copy, modify, or distribute proprietary components except as permitted by the organization.
            </p>
          </Section>

          <Section title="5. Limitations of Liability">
            <p>
              To the maximum extent permitted by law, the organization is not liable for indirect, incidental, special,
              or consequential damages arising from your use of the administration panel. Access is provided &quot;as is&quot; and
              without warranties beyond those required by applicable law.
            </p>
          </Section>

          <Section title="6. Termination">
            <p>
              The organization may suspend or terminate access to the admin panel for violation of these terms or for
              security reasons. Upon termination, your access rights will be revoked and any active sessions may be
              invalidated.
            </p>
          </Section>

          <Section title="7. Changes to Terms">
            <p>
              These Terms of Use may be updated from time to time. Material changes will be communicated through
              appropriate channels. Continued use after notification constitutes acceptance of the updated terms.
            </p>
          </Section>

          <footer className="mt-8 border-t border-gray-200 pt-4 text-gray-500">
            <p>If you have questions about these terms, contact your system administrator.</p>
          </footer>
        </section>
      </div>
    </main>
  )
}