import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";

export default function Branding() {
  const { toast } = useToast();
  const { settings, updateSettings } = useBranding();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your branding settings have been updated successfully",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Branding</h1>
        <p className="text-muted-foreground text-lg">
          Customize your brand identity and appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Configure your brand name and logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={settings.brandName}
                  onChange={(e) => updateSettings({ brandName: e.target.value })}
                  placeholder="Enter your brand name"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="h-20 w-20 object-contain rounded-lg border" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                      <Palette className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <label htmlFor="logo-upload">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Choose your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Select fonts for your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryFont">Primary Font</Label>
                  <select
                    id="primaryFont"
                    value={settings.primaryFont}
                    onChange={(e) => updateSettings({ primaryFont: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryFont">Secondary Font</Label>
                  <select
                    id="secondaryFont"
                    value={settings.secondaryFont}
                    onChange={(e) => updateSettings({ secondaryFont: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Lora">Lora</option>
                    <option value="Crimson Text">Crimson Text</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your branding looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <Palette className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-bold text-lg" style={{ fontFamily: settings.primaryFont }}>
                    {settings.brandName}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    style={{ backgroundColor: settings.primaryColor, fontFamily: settings.primaryFont }}
                  >
                    Primary Button
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    style={{ borderColor: settings.secondaryColor, color: settings.secondaryColor, fontFamily: settings.secondaryFont }}
                  >
                    Secondary Button
                  </Button>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">PRIMARY FONT</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: settings.primaryFont }}>
                      {settings.primaryFont}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: settings.primaryFont }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-xs font-medium text-muted-foreground mb-2">SECONDARY FONT</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: settings.secondaryFont }}>
                      {settings.secondaryFont}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: settings.secondaryFont }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Color Palette</p>
                <div className="flex gap-2">
                  <div
                    className="h-12 flex-1 rounded border"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                  <div
                    className="h-12 flex-1 rounded border"
                    style={{ backgroundColor: settings.secondaryColor }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
