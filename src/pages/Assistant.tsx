import ChatAssistant from "@/components/ChatAssistant";
import { useBranding } from "@/hooks/useBranding";

export default function Assistant() {
  const { settings } = useBranding();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Talk to Assistant</h1>
        <p className="text-muted-foreground text-lg">
          Ask questions about your documents and knowledge base
        </p>
      </div>

      <ChatAssistant
        brandName={settings.brandName}
        primaryColor={settings.primaryColor}
        logo={settings.logo}
      />
    </div>
  );
}
