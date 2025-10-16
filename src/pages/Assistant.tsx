import ChatAssistant from "@/components/ChatAssistant";
import brainLogo from "@/assets/brain-logo.png";

export default function Assistant() {
  // Default branding settings - will be replaced with actual config later
  const brandingConfig = {
    brandName: "Knowledge Assistant",
    primaryColor: "#6366f1",
    logo: brainLogo,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Talk to Assistant</h1>
        <p className="text-muted-foreground text-lg">
          Ask questions about your documents and knowledge base
        </p>
      </div>

      <ChatAssistant
        brandName={brandingConfig.brandName}
        primaryColor={brandingConfig.primaryColor}
        logo={brandingConfig.logo}
      />
    </div>
  );
}
