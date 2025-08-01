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
            AIMARKER is an anonymous AI-powered GCSE marking assistant designed to help
            students with educational content evaluation. This service operates without
            user accounts or data collection.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
          <p className="mb-4">
            You may use AIMARKER for educational purposes only. You agree not to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submit illegal, harmful, or inappropriate content</li>
            <li>Attempt to hack, disrupt, or gain unauthorized access to the service</li>
            <li>Use the service in any way that violates applicable laws or regulations</li>
            <li>Spam or abuse the service with excessive or automated requests</li>
            <li>Upload malicious content, viruses, or harmful code</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Marking Disclaimer</h2>
          <p className="mb-4">
            AIMARKER provides AI-generated feedback and scoring as an educational tool.
            The AI-generated feedback is for educational guidance only and should not be
            considered a substitute for a teacher's assessment. Accuracy is not guaranteed.
          </p>
          <p className="mb-4">
            While we strive for accuracy, AI marking should be used as a supplement to,
            not a replacement for, human teacher assessment. Results may vary and should
            be verified by qualified educators for official grading purposes. We are not
            responsible for any academic decisions made based solely on AI-generated feedback.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">No Accounts or Data Collection</h2>
          <p className="mb-4">
            AIMARKER operates without user accounts. No personal information is collected,
            stored, or processed. All submissions are anonymous and are not retained after
            processing.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <p className="mb-4">
            We strive to maintain high service availability but cannot guarantee
            uninterrupted access. AIMARKER may experience downtime for maintenance or
            updates.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="mb-4">
            AIMARKER is provided "as is" for educational purposes. We are not liable for
            academic decisions based on AI feedback or any damages arising from service use.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Termination of Access</h2>
          <p className="mb-4">
            We reserve the right to block access to the service for any user or IP address
            that violates these terms or engages in harmful behavior.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <p className="mb-4">
            These terms are governed by the laws of England and Wales. Any disputes will
            be resolved through the courts of England and Wales.
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
