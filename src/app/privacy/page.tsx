export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none">
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Privacy-First Approach</h2>
              <p className="text-gray-300 mb-4">
                AI Marker is designed from the ground up to be privacy-first. We believe that 
                your educational content is personal and should remain under your control.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <p className="text-green-300 font-medium">
                  🔒 <strong>Zero Server Storage:</strong> We do not store your questions, answers, 
                  or any personal content on our servers. All processing is ephemeral.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data We Process (But Don't Store)</h2>
              <p className="text-gray-300 mb-4">
                When you submit work for marking, we process the following data:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>Your question text:</strong> Processed by AI to understand the context</li>
                <li><strong>Your answer text:</strong> Analyzed by AI marking systems</li>
                <li><strong>Optional metadata:</strong> Subject, exam board, mark scheme (if provided)</li>
              </ul>
              <p className="text-gray-300 mb-4">
                <strong>Important:</strong> This data is processed in real-time and immediately discarded. 
                It exists only for the duration of your request (typically 10-30 seconds).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party AI Providers</h2>
              <p className="text-gray-300 mb-4">
                To provide AI marking, your content is sent to trusted third-party AI providers:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>OpenRouter:</strong> Routing service for multiple AI models</li>
                <li><strong>Google Gemini:</strong> AI marking analysis</li>
                <li><strong>OpenAI:</strong> GPT models for marking</li>
                <li><strong>Anthropic Claude:</strong> AI marking assistance</li>
              </ul>
              <p className="text-gray-300 mb-4">
                These providers process your content according to their privacy policies. 
                We recommend reviewing their policies if you have specific concerns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Rate Limiting & Anonymous Analytics</h2>
              <p className="text-gray-300 mb-4">
                To prevent abuse and ensure service availability:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>IP Address Hashing:</strong> We hash your IP address with a daily-rotating salt for rate limiting</li>
                <li><strong>Daily Deletion:</strong> These hashed IPs are automatically deleted every 24 hours</li>
                <li><strong>Anonymous Counters:</strong> We maintain aggregate usage statistics (total requests, subjects used) without any personal identifiers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Local Storage (Your Device)</h2>
              <p className="text-gray-300 mb-4">
                Your browser's localStorage is used to provide you with session analytics:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>Session Statistics:</strong> Scores, grades, subjects, timestamps</li>
                <li><strong>No Personal Content:</strong> Questions and answers are never stored locally</li>
                <li><strong>Your Control:</strong> You can clear this data anytime from your dashboard</li>
                <li><strong>Browser-Only:</strong> This data never leaves your device</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">OCR Image Processing</h2>
              <p className="text-gray-300 mb-4">
                When you upload images for OCR (text extraction):
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>Temporary Processing:</strong> Images are processed for text extraction only</li>
                <li><strong>Immediate Deletion:</strong> Images are deleted immediately after text extraction</li>
                <li><strong>No Storage:</strong> We do not store images or extracted text</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">No Cookies, No Tracking</h2>
              <p className="text-gray-300 mb-4">
                We do not use:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li>Cookies (except essential technical cookies)</li>
                <li>Analytics tracking (Google Analytics, etc.)</li>
                <li>Social media pixels</li>
                <li>Cross-site tracking</li>
                <li>Advertising networks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">GDPR Compliance</h2>
              <p className="text-gray-300 mb-4">
                Under GDPR, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4">
                <li><strong>Access:</strong> Since we don't store personal data, there's nothing to access</li>
                <li><strong>Deletion:</strong> Since we don't store personal data, there's nothing to delete</li>
                <li><strong>Portability:</strong> Your localStorage data is already fully portable</li>
                <li><strong>Object:</strong> You can stop using the service at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Controller</h2>
              <p className="text-gray-300 mb-4">
                For any privacy-related questions, you can contact us. However, since we operate 
                on a no-storage principle, most traditional data requests don't apply.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-300 mb-4">
                We may update this privacy policy to reflect changes in our practices or legal requirements. 
                Any changes will be posted on this page.
              </p>
              <p className="text-gray-300">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}