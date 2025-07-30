export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service - AIMARKER</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">About AIMARKER</h2>
          <p className="mb-4">
            AIMARKER is an AI-powered GCSE marking assistant designed to help
            students and teachers with educational content evaluation. By using
            AIMARKER, you agree to these terms of service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using AIMARKER, you accept and agree to be bound by
            these terms and conditions. If you do not agree to these terms,
            please discontinue use of the service immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Educational Use License
          </h2>
          <p className="mb-4">
            AIMARKER is licensed for educational purposes only. You may use this
            service to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submit GCSE-level work for AI-powered marking and feedback</li>
            <li>Practice with educational content and past papers</li>
            <li>Track academic progress (teachers and students)</li>
            <li>Advanced analytics and usage tracking (Pro tier)</li>
          </ul>
          <p className="mb-4">You may NOT:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Use the service for commercial marking or assessment services
            </li>
            <li>
              Reverse engineer or attempt to extract AI models or algorithms
            </li>
            <li>Submit inappropriate, harmful, or non-educational content</li>
            <li>Share your account credentials with unauthorized users</li>
            <li>Exceed usage limits or attempt to circumvent rate limiting</li>
            <li>
              Attempt to hack, disrupt, or gain unauthorized access to the
              service
            </li>
            <li>
              Use the service in any way that violates applicable laws or
              regulations
            </li>
            <li>
              Spam or abuse the service with excessive or automated requests
            </li>
            <li>Upload malicious content, viruses, or harmful code</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Service Tiers and Usage Limits
          </h2>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>20 AI marks per day</li>
              <li>Basic feedback using Gemini AI</li>
              <li>Progress tracking</li>
            </ul>
            <h3 className="text-lg font-semibold mb-2">
              Pro Tier (£2.99/month)
            </h3>
            <ul className="list-disc pl-6 mb-4">
              <li>200 AI marks per day</li>
              <li>
                Access to all AI models (Gemini, Kimi-v2, DeepSeek v3, Qwen Pro)
              </li>
              <li>OCR handwriting recognition</li>
              <li>Advanced analytics and export features</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Marking Disclaimer</h2>
          <p className="mb-4">
            AIMARKER provides AI-generated feedback and scoring as an
            educational tool. The AI-generated feedback is for educational
            guidance only and should not be considered a substitute for a
            teacher's assessment. Accuracy is not guaranteed.
          </p>
          <p className="mb-4">
            While we strive for accuracy, AI marking should be used as a
            supplement to, not a replacement for, human teacher assessment.
            Results may vary and should be verified by qualified educators for
            official grading purposes. We are not responsible for any academic
            decisions made based solely on AI-generated feedback.
          </p>
          <p className="mb-4">
            Our service utilizes multiple AI providers (OpenAI, Google Gemini, Anthropic Claude, and others via OpenRouter) 
            to provide diverse marking perspectives. We continuously validate our AI accuracy through golden test datasets 
            and user feedback, but variations in AI responses are expected and normal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Content Guidelines</h2>
          <p className="mb-4">
            Users are responsible for ensuring submitted content is appropriate,
            educational, and complies with academic integrity policies.
            Prohibited content includes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Copyrighted material without permission</li>
            <li>Harmful, offensive, or inappropriate content</li>
            <li>Content that violates academic integrity policies</li>
            <li>Personal information of minors</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Payment and Subscriptions
          </h2>
          <p className="mb-4">
            Pro tier subscriptions are processed through Stripe. Subscriptions
            automatically renew unless cancelled. Refunds are subject to our
            refund policy. Users are responsible for keeping payment information
            current.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data and Privacy</h2>
          <p className="mb-4">
            AIMARKER collects and stores certain data to provide our services,
            including user accounts, submitted content, marking results, and
            usage analytics. All data is stored securely with encryption and
            processed through secure third-party services.
          </p>
          <p className="mb-4">
            <strong>Anonymous Users:</strong> The service supports anonymous usage with rate limiting. 
            Anonymous submissions are stored without personal identifiers but may be used to improve our AI models.
          </p>
          <p className="mb-4">
            <strong>Data Processing:</strong> Your academic content may be processed by multiple AI providers 
            for marking purposes. We implement cost tracking, performance monitoring, and quality assurance 
            measures that may involve storing AI responses, usage metrics, and system logs.
          </p>
          <p className="mb-4">
            See our Privacy Policy for complete details on data collection, storage, retention periods, and your rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="mb-4">
            AIMARKER integrates with third-party services including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Payment Processing:</strong> Stripe (secure payment handling)</li>
            <li><strong>Database & Auth:</strong> Supabase (data storage and user authentication)</li>
            <li><strong>AI Providers:</strong> OpenAI, Google Gemini, Anthropic Claude, and additional models via OpenRouter</li>
            <li><strong>Monitoring:</strong> Sentry (error tracking), Datadog (system monitoring)</li>
            <li><strong>Analytics:</strong> PostHog (privacy-focused usage analytics)</li>
            <li><strong>Performance:</strong> Upstash Redis (rate limiting and caching)</li>
            <li><strong>OCR Processing:</strong> EasyOCR (handwriting recognition)</li>
          </ul>
          <p className="mb-4">
            Use of these services is subject to their respective terms of service and privacy policies. 
            We select providers that maintain high security and privacy standards compatible with educational use.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <p className="mb-4">
            We strive to maintain high service availability but cannot guarantee
            uninterrupted access. AIMARKER may experience downtime for
            maintenance, updates, or due to third-party service limitations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Limitation of Liability
          </h2>
          <p className="mb-4">
            AIMARKER is provided "as is" for educational purposes. We are not
            liable for academic decisions based on AI feedback, data loss, or
            any damages arising from service use. Maximum liability is limited
            to the amount paid for Pro tier subscription in the preceding 12
            months.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Account Termination and Enforcement
          </h2>
          <p className="mb-4">
            We reserve the right to terminate accounts that violate these terms,
            exceed usage limits, or engage in harmful behavior. This includes
            but is not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submitting harmful, offensive, or inappropriate content</li>
            <li>Attempting to hack or disrupt the service</li>
            <li>Circumventing usage limits or rate limiting</li>
            <li>Sharing account credentials with unauthorized users</li>
            <li>
              Using the service for commercial purposes without authorization
            </li>
            <li>Violating academic integrity policies</li>
          </ul>
          <p className="mb-4">
            Account termination may be immediate and without prior notice for
            serious violations. Users may cancel their accounts at any time
            through the account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Modifications to Terms
          </h2>
          <p className="mb-4">
            These terms may be updated to reflect service changes or legal
            requirements. Continued use after changes constitutes acceptance of
            updated terms. Significant changes will be communicated to users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <p className="mb-4">
            These terms are governed by the laws of England and Wales. Any
            disputes will be resolved through the courts of England and Wales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p className="mb-4">
            For questions about these terms or AIMARKER services, contact us at:
            <a
              href="mailto:support@aimarker.tech"
              className="text-blue-600 hover:underline"
            >
              {' '}
              support@aimarker.tech
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
