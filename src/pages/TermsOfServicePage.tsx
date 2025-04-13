import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 lg:px-16">
      <Helmet>
        <title>Terms of Service | dapps.co</title>
      </Helmet>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
        
        <p className="mb-6 text-sm text-muted-foreground">Last Updated: May 2024</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the dapps.co platform ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use this Service. By using the Service, you represent and warrant that you have the right, authority, and capacity to enter into these Terms and to abide by all the terms and conditions set forth herein.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="mb-3">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <p className="mb-3">
              You are responsible for safeguarding the password or credentials you use to access the Service and for any activities or actions under your account.
            </p>
            <p>
              You agree not to disclose your password or credentials to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. User Content and Conduct</h2>
            <p className="mb-3">
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content you post to the Service.
            </p>
            <p className="mb-3">
              By posting content to the Service, you grant us the right to use, modify, display, distribute, and create derivative works from your content in connection with the Service and as otherwise provided in these Terms.
            </p>
            <p className="mb-3">
              You agree not to post content that is illegal, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, or otherwise objectionable.
            </p>
            <p className="mb-3">
              <strong>Blockchain Permanence:</strong> dapps.co is a blockchain-based social network. Once content is posted on the blockchain, it cannot be fully deleted or removed. You understand and acknowledge that your posts, comments, and other content may be permanently recorded on the blockchain and may remain accessible even if your account is terminated.
            </p>
            <p>
              <strong>User Responsibility:</strong> You are solely responsible for all content you post, share, or transmit through the Service, and for any consequences that may result from such content, including any legal liabilities. dapps.co cannot and will not be held responsible for your actions on the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Intellectual Property</h2>
            <p className="mb-3">
              The Service and its original content, features, and functionality are and will remain the exclusive property of dapps.co and its licensors.
            </p>
            <p>
              The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. ROAR Tokens and Rewards</h2>
            <p className="mb-3">
              ROAR tokens and other rewards issued through the Service have no monetary value and are not redeemable for cash. They represent virtual achievements or points within the Service.
            </p>
            <p className="mb-3">
              We reserve the right to manage, regulate, control, modify, or eliminate tokens or rewards at our sole discretion, with or without notice.
            </p>
            <p>
              Any attempt to sell, transfer, or exchange tokens or rewards outside the Service is prohibited and may result in termination of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Using the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service</li>
              <li>Using the Service to collect or harvest any personally identifiable information</li>
              <li>Impersonating another person or otherwise misrepresenting your affiliation with a person or entity</li>
              <li>Attempting to bypass any measures designed to prevent or restrict access to the Service</li>
              <li>Automating access to the Service, or adding any virus, trojan, worm, logic bomb, or other harmful material to the Service</li>
              <li>Using the Service for any commercial solicitation purposes without our express consent</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Termination</h2>
            <p className="mb-3">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. Limitation of Liability</h2>
            <p className="mb-3">
              In no event shall dapps.co, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
            <p>
              To the maximum extent permitted by applicable law, dapps.co assumes no liability or responsibility for any errors, mistakes, or inaccuracies of content; personal injury or property damage resulting from your access to or use of our service; unauthorized access to or use of our servers or any personal information stored therein.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">11. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@dapps.co" className="text-primary hover:underline">support@dapps.co</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 