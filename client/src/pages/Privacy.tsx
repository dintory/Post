export function Privacy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-[#C0C0C0]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-[#10b981] hover:underline mb-8 inline-block">&larr; Back to Home</a>
        <h1 className="text-3xl font-bold text-[#E8E8E8] mb-8">Privacy Policy</h1>
        <p className="text-sm text-[#707070] mb-8">Last updated: June 27, 2026</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed">
              When you use Commissioner, we collect information you provide directly, such as your name, email address, and any content you generate or upload (including video scripts, narration text, and images). We also collect usage data such as the types of videos you create and your interaction with the service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed">
              We use your information to operate, maintain, and improve Commissioner — including generating videos, processing voiceovers, uploading content to YouTube (when you authorize it), and providing customer support. We do not sell your personal information to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">3. Data Storage and Security</h2>
            <p className="text-sm leading-relaxed">
              Your videos and uploaded content are stored temporarily during processing and then persisted in cloud storage (Cloudflare R2). Authentication data is handled by Supabase. We implement reasonable security measures to protect your data, but no method of transmission or storage is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">4. Third-Party Services</h2>
            <p className="text-sm leading-relaxed">
              Commissioner integrates with third-party services including Google Cloud (Text-to-Speech), YouTube (video publishing), Amazon Web Services (Polly TTS), Supabase (authentication and database), Cloudflare R2 (file storage), and OpenAI (script generation). Each service has its own privacy policy governing how they handle data transmitted to them.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">5. YouTube API Services</h2>
            <p className="text-sm leading-relaxed">
              Commissioner uses YouTube API Services to upload videos when you authorize your YouTube account. Your data is handled in accordance with the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">Google Privacy Policy</a>.
              You can revoke access at any time via your Google Account security settings.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">6. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              We retain your account information and generated videos until you delete them or close your account. You can delete individual videos at any time through the dashboard. Account deletion can be requested by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#E8E8E8] mb-2">7. Contact</h2>
            <p className="text-sm leading-relaxed">
              If you have questions about this privacy policy, please contact us at dinto.lee@gmail.com.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
