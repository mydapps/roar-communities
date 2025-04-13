import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 lg:px-16">
      <Helmet>
        <title>Privacy Policy | dapps.co</title>
      </Helmet>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
        
        <p className="mb-6 text-sm text-muted-foreground">Last Updated: May 2024</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p>
              dapps.co ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. By using the Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>
            <p className="mb-3">
              We collect several types of information from and about users of our Service, including:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>Personal Information:</strong> Information that can be used to identify you, such as your name, email address, and profile picture.
              </li>
              <li>
                <strong>Account Information:</strong> Information you provide when creating an account, including username and wallet addresses.
              </li>
              <li>
                <strong>User Content:</strong> Information you post to the Service, including messages, comments, posts, and other content.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you access and use the Service, including your IP address, browser type, device information, pages you visit, and time spent on those pages.
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="mb-3">
              We may use the information we collect from you for various purposes, including:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Providing, maintaining, and improving our Service</li>
              <li>Processing transactions and managing your account</li>
              <li>Personalizing your experience and delivering content relevant to your interests</li>
              <li>Communicating with you about updates, security alerts, and support</li>
              <li>Monitoring usage of our Service for troubleshooting and improvement</li>
              <li>Detecting, preventing, and addressing technical issues, fraud, or illegal activities</li>
              <li>Analyzing trends and user traffic to improve our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. How We Share Your Information</h2>
            <p className="mb-3">
              We may share your information with third parties in the following situations:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us.
              </li>
              <li>
                <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
              </li>
              <li>
                <strong>Compliance with Laws:</strong> We may disclose your information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share your information with your consent or as otherwise disclosed at the time of data collection or sharing.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell, trade, or otherwise transfer your personal information to third parties for marketing purposes without your consent.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. User Content</h2>
            <p className="mb-3">
              Our Service allows you to create, post, and share content that may be viewed by other users. Any content you post to public areas of the Service will be considered public and may be accessible by others.
            </p>
            <p className="mb-3">
              While we take steps to protect your personal information, we cannot guarantee the security of any information you choose to make public on the Service. Please exercise caution when deciding to disclose personal information through public features of the Service.
            </p>
            <p className="mb-3">
              <strong>Blockchain Permanence:</strong> dapps.co is a blockchain-based social network. Content you post, including text, images, and interactions, may be stored on a blockchain. Due to the nature of blockchain technology, once content is posted, it may be impossible to completely delete or remove it, even if your account is terminated.
            </p>
            <p>
              <strong>User Responsibility:</strong> You are solely responsible for any content you post on dapps.co and for understanding the permanent nature of blockchain records. Consider carefully before posting sensitive personal information that you may not want to be permanently accessible.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Data Security</h2>
            <p className="mb-3">
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
            <p>
              While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. It is your responsibility to keep your account information, including your password, secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Your Data Protection Rights</h2>
            <p className="mb-3">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>The right to access the personal information we have about you</li>
              <li>The right to request correction of inaccurate personal information</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to object to processing of your personal information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
            <p className="mt-3">
              <strong>Note on Blockchain Content:</strong> Due to the nature of blockchain technology, we may be unable to fully delete content you have posted to the blockchain, even upon request. We will make reasonable efforts to remove content from our interfaces where possible, but the underlying blockchain data may persist indefinitely.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Cookies and Tracking Technologies</h2>
            <p className="mb-3">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="mb-3">
              We use cookies for the following purposes:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>To authenticate users and maintain user sessions</li>
              <li>To remember user preferences and settings</li>
              <li>To analyze user behavior and improve our Service</li>
              <li>To provide personalized content and recommendations</li>
            </ul>
            <p className="mt-3">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites, services, or applications that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to review the privacy policy of every site you visit.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Children's Privacy</h2>
            <p>
              Our Service is not directed to anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">11. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@dapps.co" className="text-primary hover:underline">privacy@dapps.co</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 