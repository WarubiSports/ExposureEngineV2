"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Trophy,
  GraduationCap,
  Mail,
  Video,
  Calendar,
  MapPin,
  FileText,
  Download,
  Share2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { AnalysisResult, CollegeLevel, Evaluation } from "@/types";

interface AnalysisResultProps {
  result: AnalysisResult;
  evaluation?: Evaluation;
}

const LEVEL_COLORS: Record<CollegeLevel, string> = {
  D1: "#22c55e",
  D2: "#3b82f6",
  D3: "#8b5cf6",
  NAIA: "#f59e0b",
  JUCO: "#6b7280",
};

const LEVEL_LABELS: Record<CollegeLevel, string> = {
  D1: "Division I",
  D2: "Division II",
  D3: "Division III",
  NAIA: "NAIA",
  JUCO: "JUCO (Junior College)",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getRatingBadgeVariant(rating: string): "default" | "secondary" | "destructive" | "outline" {
  switch (rating) {
    case "Excellent":
    case "Strong":
      return "default";
    case "Good":
    case "Moderate":
      return "secondary";
    case "Limited":
    case "Weak":
      return "destructive";
    default:
      return "outline";
  }
}

export function AnalysisResultDisplay({ result, evaluation }: AnalysisResultProps) {
  // Transform visibility scores for bar chart
  const visibilityData = Object.entries(result.visibilityScores).map(([level, data]) => ({
    level,
    score: data.score,
    label: LEVEL_LABELS[level as CollegeLevel],
    color: LEVEL_COLORS[level as CollegeLevel],
  }));

  // Transform for radar chart
  const radarData = [
    { subject: "Playing Level", value: result.readinessScore?.playingLevel || 0, fullMark: 100 },
    { subject: "Academics", value: result.readinessScore?.academics || 0, fullMark: 100 },
    { subject: "Exposure", value: result.readinessScore?.exposure || 0, fullMark: 100 },
    { subject: "Timeline", value: result.readinessScore?.timeline || 0, fullMark: 100 },
    { subject: "Materials", value: result.readinessScore?.materials || 0, fullMark: 100 },
  ];

  const handleDownloadPDF = () => {
    // Will implement PDF generation
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "College Soccer Exposure Analysis",
          text: `Check out my college soccer recruiting analysis! Overall Score: ${result.overallScore}/100`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header with Overall Score */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(
                  result.overallScore
                )} text-white`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">{result.overallScore}</div>
                  <div className="text-xs opacity-80">/ 100</div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Overall Visibility Score</h2>
                <Badge variant={getRatingBadgeVariant(result.rating || "")}>
                  {result.rating}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{result.bucket}</p>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plain Language Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {result.plainLanguageSummary}
          </p>
        </CardContent>
      </Card>

      {/* Coach Short Evaluation */}
      {result.coachShortEvaluation && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5" />
              What a Coach Would Say
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="italic border-l-4 border-primary pl-4">
              "{result.coachShortEvaluation}"
            </blockquote>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="visibility" className="print:block">
        <TabsList className="grid w-full grid-cols-4 print:hidden">
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="action">Action Plan</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        {/* Visibility Tab */}
        <TabsContent value="visibility" className="print:block print:!mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility by Division</CardTitle>
                <CardDescription>
                  How likely coaches at each level would notice your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibilityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="level" width={50} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Visibility"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {visibilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Visibility Details */}
            <Card>
              <CardHeader>
                <CardTitle>Division Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(result.visibilityScores).map(([level, data]) => (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: LEVEL_COLORS[level as CollegeLevel] }}
                        />
                        <span className="font-medium">{level}</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(data.score)}`}>
                        {data.score}%
                      </span>
                    </div>
                    <Progress
                      value={data.score}
                      className="h-2"
                      style={
                        {
                          "--progress-foreground": LEVEL_COLORS[level as CollegeLevel],
                        } as React.CSSProperties
                      }
                    />
                    <p className="text-xs text-muted-foreground">{data.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Best Fit Recommendation */}
          {result.bestFitDivision && (
            <Card className="mt-6 border-2 border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Best Fit Division
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-green-500">
                    {result.bestFitDivision.level}
                  </div>
                  <div>
                    <p className="font-medium">
                      {LEVEL_LABELS[result.bestFitDivision.level]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.bestFitDivision.reasoning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Readiness Tab */}
        <TabsContent value="readiness" className="print:block print:!mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Readiness Profile</CardTitle>
                <CardDescription>Your preparedness across key areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" className="text-xs" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Risks */}
            <div className="space-y-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.keyStrengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Trophy className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Risks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="h-5 w-5" />
                    Key Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.keyRisks.map((risk, index) => (
                      <li key={index} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium">{risk.risk}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          {risk.mitigation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benchmark Comparison */}
          {result.benchmarkAnalysis && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Comparison to Average D1 Recruit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {result.benchmarkAnalysis.gaps?.map((gap, index) => (
                    <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">{gap.area}</div>
                      <div
                        className={`text-2xl font-bold ${
                          gap.difference >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {gap.difference >= 0 ? "+" : ""}
                        {gap.difference}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        You: {gap.current} / D1 Avg: {gap.benchmark}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="action" className="print:block print:!mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Next 30 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.actionPlan.immediate.map((action, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Short-term Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Next 90 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.actionPlan.shortTerm.map((action, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Camp Recommendations */}
          {result.campRecommendations && result.campRecommendations.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Recommended Showcases & Camps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.campRecommendations.map((camp, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-medium">{camp.name}</div>
                      <div className="text-sm text-muted-foreground">{camp.location}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{camp.type}</Badge>
                        {camp.cost && (
                          <span className="text-xs text-muted-foreground">{camp.cost}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{camp.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Template */}
          {result.emailTemplateSuggestion && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sample Email Opener
                </CardTitle>
                <CardDescription>
                  Personalized opening for your outreach emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {result.emailTemplateSuggestion}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(result.emailTemplateSuggestion || "");
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="print:block print:!mt-4">
          {result.funnelAnalysis && (
            <div className="space-y-6">
              {/* Funnel Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Recruiting Funnel Status</CardTitle>
                  <CardDescription>Based on your outreach activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge
                      variant={
                        result.funnelAnalysis.status === "strong"
                          ? "default"
                          : result.funnelAnalysis.status === "developing"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-lg px-4 py-2"
                    >
                      {result.funnelAnalysis.status.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground">
                      Response Rate: {result.funnelAnalysis.responseRate}%
                    </span>
                  </div>
                  <p className="text-muted-foreground">{result.funnelAnalysis.assessment}</p>
                </CardContent>
              </Card>

              {/* Video Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Highlight Video Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.funnelAnalysis.videoPenalty ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-500 font-medium">
                        <AlertTriangle className="h-5 w-5" />
                        {result.funnelAnalysis.videoPenalty}% Visibility Penalty Applied
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Coaches can't recruit what they can't see. A quality highlight video
                        is essential for visibility at any level.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-500 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Video Ready
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your highlight video is available for coaches to review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funnel Recommendations */}
              {result.funnelAnalysis.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Funnel Improvement Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.funnelAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tags */}
      {result.tags && result.tags.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
