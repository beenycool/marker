export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-lg">
        <p className="mb-4">
          We are a free, anonymous service. We do not create user accounts. 
          We do not store any personal information.
        </p>
        
        <p className="mb-4">
          We temporarily log IP addresses for rate-limiting and security purposes only. 
          These logs are automatically deleted daily and are never used for any other purpose.
        </p>
        
        <p>
          We use Plausible for privacy-first, cookieless analytics that respects your privacy. 
          That's it.
        </p>
      </div>
    </div>
  );
}
