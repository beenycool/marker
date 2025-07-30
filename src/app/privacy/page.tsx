export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy - AIMARKER</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">About AIMARKER</h2>
          <p className="mb-4">
            AIMARKER is an AI-powered GCSE marking assistant that helps students
            and teachers with educational content evaluation. We are committed
            to protecting your privacy and being transparent about our data
            practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Data Collection and Use
          </h2>
          <p className="mb-4">
            AIMARKER collects and processes certain data to provide our
            services, improve user experience, and maintain platform security.
            This data is stored securely in our database hosted on Supabase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>
          <h3 className="text-lg font-semibold mb-2">Academic Content</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Questions and answers submitted for AI marking (up to 50,000 characters)</li>
            <li>Mark schemes and grading criteria</li>
            <li>Subject area, exam board, and educational context</li>
            <li>Total marks and assessment parameters</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Account Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>User account details (name, email)</li>
            <li>Authentication and session data</li>
            <li>User preferences and settings</li>
            <li>Subscription status and billing information</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">AI Processing Data</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>AI provider and model information used for marking</li>
            <li>Prompt versions and A/B test assignments</li>
            <li>Token usage and processing costs</li>
            <li>Response times and performance metrics</li>
            <li>User ratings and feedback on AI responses</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">System and Analytics Data</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Usage tracking and daily submission counts</li>
            <li>Error logs and system monitoring data (via Sentry and Datadog)</li>
            <li>Performance analytics and platform interaction data (via PostHog)</li>
            <li>Rate limiting and caching data (via Upstash Redis)</li>
            <li>Request IDs and structured logging information</li>
            <li>Alert rules and system metrics for service monitoring</li>
          </ul>
          
          <h3 className="text-lg font-semibold mb-2">Quality Assurance Data</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Golden test cases for AI accuracy validation</li>
            <li>Test results and marking quality assessments</li>
            <li>Admin user access logs and moderation data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Third-Party Services We Use
          </h2>
          <p className="mb-4">
            AIMARKER uses the following third-party services to provide our
            functionality:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Supabase:</strong> We use Supabase for our database and
              authentication to securely store your account information,
              submissions, and marking history.
            </li>
            <li>
              <strong>OpenAI:</strong> We use OpenAI's GPT models for advanced AI marking and feedback generation.
            </li>
            <li>
              <strong>Google Gemini:</strong> We use Google's Gemini AI model to
              analyze and provide feedback on your submissions.
            </li>
            <li>
              <strong>Anthropic Claude:</strong> We use Claude AI models for enhanced marking capabilities.
            </li>
            <li>
              <strong>OpenRouter:</strong> We use OpenRouter to access additional AI models like Kimi-v2, DeepSeek v3, and Qwen Pro for diverse marking perspectives.
            </li>
            <li>
              <strong>PostHog:</strong> We use PostHog to understand how users
              interact with the website so we can improve it and provide better
              user experience.
            </li>
            <li>
              <strong>Sentry:</strong> We use Sentry to monitor for errors and
              keep the site running smoothly.
            </li>
            <li>
              <strong>Datadog:</strong> We use Datadog for system monitoring and
              performance tracking to ensure reliable service.
            </li>
            <li>
              <strong>Stripe:</strong> We use Stripe for secure payment
              processing for Pro subscriptions.
            </li>
            <li>
              <strong>Upstash Redis:</strong> We use Upstash Redis for rate
              limiting and caching to optimize performance.
            </li>
            <li>
              <strong>EasyOCR:</strong> We use EasyOCR to process handwritten
              work and convert it to text.
            </li>
          </ul>
          <p className="mb-4">
            Each service processes data according to their own privacy policies
            and security standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">OCR Processing</h2>
          <p className="mb-4">
            When you use our OCR (Optical Character Recognition) feature for
            handwritten work, images are processed through EasyOCR service to
            extract text. The extracted text content is stored in our database
            as part of your submission history, while the original images are
            retained for your reference.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <p className="mb-4">
            AIMARKER uses secure authentication services. User identity
            information (name, email, profile picture) is stored in our Supabase
            database to provide a personalized experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Payment Processing</h2>
          <p className="mb-4">
            Payment processing is handled entirely by Stripe. We do not store
            credit card information or payment details. Subscription status and
            billing information are synchronized from Stripe to our database to
            manage user access and features. All payment data is processed
            according to Stripe's privacy policy and security standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">
            We take data security seriously and implement industry-standard
            measures to protect your information. All data is stored in our
            Supabase database with encryption at rest and in transit. We use
            Sentry for error monitoring, PostHog for privacy-focused analytics,
            Upstash Redis for rate limiting and caching, and Datadog for system
            monitoring. Access to user data is restricted to authorized
            personnel only, and we conduct regular security assessments. All
            communication with third-party services uses industry-standard
            encryption and security practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p className="mb-4">
            We retain different types of data for varying periods based on their purpose:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Academic Submissions:</strong> Retained indefinitely to provide service history and improve AI accuracy</li>
            <li><strong>Usage Logs:</strong> Retained for 12 months for operational and security purposes</li>
            <li><strong>Error Logs:</strong> Retained for 6 months for debugging and system improvement</li>
            <li><strong>System Metrics:</strong> Aggregated data retained indefinitely for performance analysis</li>
            <li><strong>User Sessions:</strong> Expired automatically based on session duration</li>
            <li><strong>A/B Test Data:</strong> Retained for the duration of tests plus 6 months for analysis</li>
          </ul>
          <p className="mb-4">
            Users can delete their account and associated personal data at any time through the settings page. Upon account deletion, personal identifiers will be removed, though anonymized academic content may be retained for service improvement purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Data Rights</h2>
          <p className="mb-4">
            You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Right to Access:</strong> You can request to see what
              personal data we have about you
            </li>
            <li>
              <strong>Right to Correct:</strong> You can ask us to correct any
              inaccurate personal information
            </li>
            <li>
              <strong>Right to Delete:</strong> You can request that we delete
              your personal data
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You can request a copy
              of your data in a machine-readable format
            </li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us at{' '}
            <a
              href="mailto:support@aimarker.tech"
              className="text-blue-600 hover:underline"
            >
              support@aimarker.tech
            </a>
            . You can also delete your account and associated data through the
            "Delete Account" button in your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Educational Use</h2>
          <p className="mb-4">
            AIMARKER is designed for educational purposes to assist with GCSE
            marking. We recommend that students and teachers review our terms of
            service for appropriate use guidelines.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Changes to This Policy
          </h2>
          <p className="mb-4">
            We may update this privacy policy to reflect changes in our
            practices or for legal compliance. Updates will be posted on this
            page with a revised date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">
            For questions about this privacy policy or AIMARKER's data
            practices, please contact us at:{' '}
            <a
              href="mailto:support@aimarker.tech"
              className="text-blue-600 hover:underline"
            >
              support@aimarker.tech
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
