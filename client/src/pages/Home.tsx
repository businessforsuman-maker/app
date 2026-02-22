import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Download, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AnimeEntry {
  animerulz_id: string;
  animelok_id: string;
  languages: string[];
}

interface ValidationResult {
  animelok_id: string;
  animerulz_id: string;
  episode: number;
  language: string;
  url: string;
  isValid: boolean;
  error?: string;
  responseStatus?: number;
}

export default function Home() {
  const { user } = useAuth();
  const [animeData, setAnimeData] = useState<AnimeEntry[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutation for validating URLs
  const validateUrlMutation = trpc.validator.validateUrl.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setAnimeData(json);
          setResults([]);
          toast.success(`Loaded ${json.length} anime entries`);
        } else {
          toast.error("Invalid JSON format. Expected an array.");
        }
      } catch (err) {
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const validateUrls = async () => {
    if (animeData.length === 0) {
      toast.error("Please upload anime data first");
      return;
    }

    setIsValidating(true);
    setResults([]);
    const validationResults: ValidationResult[] = [];
    let processed = 0;
    const totalItems = animeData.reduce((sum, anime) => sum + anime.languages.length, 0);

    try {
      for (const anime of animeData) {
        for (const language of anime.languages) {
          try {
            // Call backend API to validate URL
            const result = await validateUrlMutation.mutateAsync({
              animelok_id: anime.animelok_id,
              animerulz_id: anime.animerulz_id,
              language,
              episode: 1,
            });

            validationResults.push({
              animelok_id: anime.animelok_id,
              animerulz_id: anime.animerulz_id,
              episode: 1,
              language,
              url: result.url,
              isValid: result.isValid,
              error: result.error,
              responseStatus: result.responseStatus,
            });
          } catch (err) {
            validationResults.push({
              animelok_id: anime.animelok_id,
              animerulz_id: anime.animerulz_id,
              episode: 1,
              language,
              url: "",
              isValid: false,
              error: "Validation request failed",
            });
          }

          processed++;
          setProgress((processed / totalItems) * 100);
        }
      }

      setResults(validationResults);
      const validCount = validationResults.filter(r => r.isValid).length;
      const invalidCount = validationResults.filter(r => !r.isValid).length;
      toast.success(`Validation complete: ${validCount} valid, ${invalidCount} invalid`);
    } catch (err) {
      toast.error("Validation process failed");
    } finally {
      setIsValidating(false);
      setProgress(0);
    }
  };

  const filteredResults = results.filter(r => {
    if (filterStatus === "valid") return r.isValid;
    if (filterStatus === "invalid") return !r.isValid;
    return true;
  });

  const downloadResults = () => {
    const csv = [
      ["Anime ID", "Animerulz ID", "Episode", "Language", "URL", "Status", "Error"].join(","),
      ...results.map(r => [
        r.animelok_id,
        r.animerulz_id,
        r.episode,
        r.language,
        r.url,
        r.isValid ? "Valid" : "Invalid",
        r.error || "",
      ].map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Anime URL Validator</h1>
          <p className="text-lg text-slate-600">
            Validate video URLs from AnimeLok API and detect "Video not found" errors
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Data
              </CardTitle>
              <CardDescription>Import your anime JSON file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose JSON File
                </Button>
              </div>

              {animeData.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ {animeData.length} anime entries loaded
                  </p>
                </div>
              )}

              <Button
                onClick={validateUrls}
                disabled={animeData.length === 0 || isValidating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Start Validation"
                )}
              </Button>

              {isValidating && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>
                    {results.length > 0
                      ? `${results.filter(r => r.isValid).length} valid, ${results.filter(r => !r.isValid).length} invalid`
                      : "No results yet"}
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResults}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Upload anime data and click "Start Validation" to begin</p>
                </div>
              ) : (
                <Tabs defaultValue="all" onValueChange={(v) => setFilterStatus(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                      All ({results.length})
                    </TabsTrigger>
                    <TabsTrigger value="valid">
                      Valid ({results.filter(r => r.isValid).length})
                    </TabsTrigger>
                    <TabsTrigger value="invalid">
                      Invalid ({results.filter(r => !r.isValid).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterStatus} className="mt-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {result.animelok_id}
                              </p>
                              <p className="text-sm text-slate-600">
                                Episode {result.episode} • {result.language}
                              </p>
                            </div>
                            {result.isValid ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Invalid
                              </Badge>
                            )}
                          </div>

                          {result.url && (
                            <div className="mb-2">
                              <p className="text-xs text-slate-500 mb-1">URL:</p>
                              <p className="text-xs text-blue-600 break-all font-mono bg-slate-50 p-2 rounded">
                                {result.url}
                              </p>
                            </div>
                          )}

                          {result.error && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {result.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {results.length}
                  </p>
                  <p className="text-sm text-slate-600">Total URLs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {results.filter(r => r.isValid).length}
                  </p>
                  <p className="text-sm text-slate-600">Valid</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {results.filter(r => !r.isValid).length}
                  </p>
                  <p className="text-sm text-slate-600">Invalid</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
