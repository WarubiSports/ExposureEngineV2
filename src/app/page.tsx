"use client";

import { useState, useCallback } from "react";
import { PlayerInputForm } from "@/components/form";
import { AnalysisResultDisplay } from "@/components/results";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Zap, TrendingUp, Shield } from "lucide-react";
import type { PlayerProfile, AnalysisResult, Evaluation } from "@/types";

type AppState = "form" | "loading" | "results" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("form");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = useCallback(async (profile: PlayerProfile) => {
    setAppState("loading");
    setError(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data.result);
      setEvaluation(data.evaluation);
      setAppState("results");
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("error");
    }
  }, []);

  const handleBack = useCallback(() => {
    setAppState("form");
    setResult(null);
    setEvaluation(null);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ExposureEngine</h1>
              <p className="text-xs text-muted-foreground">College Soccer Visibility Analyzer</p>
            </div>
          </div>
          {appState === "results" && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Form State */}
        {appState === "form" && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Know Your College Soccer Visibility
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Get an honest, data-driven assessment of how visible you are to college
                coaches at each division level. Based on real recruiting patterns and
                market data.
              </p>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-12">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized insights based on your profile and market reality
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Data-Driven</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on real D1/D2/D3 recruiting statistics and patterns
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Honest Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      No sugarcoating - know exactly where you stand
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Input Form */}
            <PlayerInputForm onSubmit={handleSubmit} />
          </div>
        )}

        {/* Loading State */}
        {appState === "loading" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Analyzing Your Profile</h2>
            <p className="text-muted-foreground mb-6">
              Our AI is evaluating your visibility across all college divisions...
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {progress < 30 && "Gathering market data..."}
              {progress >= 30 && progress < 60 && "Evaluating visibility factors..."}
              {progress >= 60 && progress < 90 && "Generating recommendations..."}
              {progress >= 90 && "Finalizing analysis..."}
            </p>
          </div>
        )}

        {/* Results State */}
        {appState === "results" && result && (
          <div className="max-w-5xl mx-auto">
            <AnalysisResultDisplay result={result} evaluation={evaluation || undefined} />
          </div>
        )}

        {/* Error State */}
        {appState === "error" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 mx-auto mb-8 bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="text-4xl">Warning</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Analysis Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            ExposureEngine - College Soccer Visibility Analyzer
          </p>
          <p className="mt-1">
            Built with research from NCSA, MLS NEXT, ECNL, and NCAA data
          </p>
        </div>
      </footer>
    </main>
  );
}
