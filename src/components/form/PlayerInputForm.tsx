"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import type { PlayerProfile, Position, Gender, YouthLeague, ExperienceLevel, Season, Event, AthleticProfile } from "@/types";
import { DEMO_PROFILES } from "./demo-profiles";

// Constants
const POSITIONS: { value: Position; label: string }[] = [
  { value: "GK", label: "Goalkeeper" },
  { value: "CB", label: "Center Back" },
  { value: "LB", label: "Left Back" },
  { value: "RB", label: "Right Back" },
  { value: "CDM", label: "Defensive Midfielder" },
  { value: "CM", label: "Central Midfielder" },
  { value: "CAM", label: "Attacking Midfielder" },
  { value: "LM", label: "Left Midfielder" },
  { value: "RM", label: "Right Midfielder" },
  { value: "LW", label: "Left Winger" },
  { value: "RW", label: "Right Winger" },
  { value: "ST", label: "Striker" },
  { value: "CF", label: "Center Forward" },
];

const LEAGUES: { value: YouthLeague; label: string; gender: "both" | "boys" | "girls" }[] = [
  { value: "MLS_NEXT", label: "MLS NEXT", gender: "boys" },
  { value: "ECNL", label: "ECNL", gender: "both" },
  { value: "Girls_Academy", label: "Girls Academy", gender: "girls" },
  { value: "USL_Academy", label: "USL Academy", gender: "boys" },
  { value: "USYS_National", label: "USYS National League", gender: "both" },
  { value: "ECNL_RL", label: "ECNL Regional League", gender: "both" },
  { value: "NPL", label: "NPL", gender: "both" },
  { value: "High_School", label: "High School", gender: "both" },
  { value: "Club_Local", label: "Local Club", gender: "both" },
  { value: "Rec", label: "Recreational", gender: "both" },
];

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY"
];

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "elite", label: "Elite (Top-tier national)" },
  { value: "high", label: "High (Regional/state level)" },
  { value: "moderate", label: "Moderate (Competitive local)" },
  { value: "developing", label: "Developing (Recreational+)" },
];

interface PlayerInputFormProps {
  onSubmit: (profile: PlayerProfile) => Promise<void>;
  isLoading?: boolean;
}

const getEmptyProfile = (): Partial<PlayerProfile> => ({
  firstName: "",
  lastName: "",
  email: "",
  gender: undefined,
  position: undefined,
  secondaryPositions: [],
  gradYear: undefined,
  state: undefined,
  citizenship: "US",
  height: "",
  dominantFoot: undefined,
  experienceLevel: undefined,
  seasons: [],
  events: [],
  gpa: undefined,
  testScore: undefined,
  athleticProfile: {
    fortyYardDash: undefined,
    mileTime: undefined,
    beepTestLevel: undefined,
  },
  hasVideo: false,
  coachesContacted: 0,
  responsesReceived: 0,
  offersReceived: 0,
});

export function PlayerInputForm({ onSubmit, isLoading = false }: PlayerInputFormProps) {
  const [profile, setProfile] = useState<Partial<PlayerProfile>>(getEmptyProfile());
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: "basic", title: "Basic Info", description: "Player identity" },
    { id: "experience", title: "Experience", description: "Club & seasons" },
    { id: "academics", title: "Academics", description: "GPA & tests" },
    { id: "market", title: "Market Reality", description: "Outreach status" },
  ];

  const updateProfile = useCallback(<K extends keyof PlayerProfile>(
    field: K,
    value: PlayerProfile[K]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const loadDemoProfile = useCallback((name: string) => {
    const demo = DEMO_PROFILES[name];
    if (demo) {
      setProfile(demo);
      setErrors({});
    }
  }, []);

  const addSeason = useCallback(() => {
    const newSeason: Season = {
      year: new Date().getFullYear(),
      league: "ECNL",
      teamName: "",
      level: "U17",
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cleanSheets: undefined,
    };
    setProfile((prev) => ({
      ...prev,
      seasons: [...(prev.seasons || []), newSeason],
    }));
  }, []);

  const updateSeason = useCallback((index: number, updates: Partial<Season>) => {
    setProfile((prev) => ({
      ...prev,
      seasons: prev.seasons?.map((s, i) => (i === index ? { ...s, ...updates } : s)) || [],
    }));
  }, []);

  const removeSeason = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      seasons: prev.seasons?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const addEvent = useCallback(() => {
    const newEvent: Event = {
      name: "",
      type: "showcase",
      date: new Date().toISOString().split("T")[0],
      location: "",
    };
    setProfile((prev) => ({
      ...prev,
      events: [...(prev.events || []), newEvent],
    }));
  }, []);

  const updateEvent = useCallback((index: number, updates: Partial<Event>) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events?.map((e, i) => (i === index ? { ...e, ...updates } : e)) || [],
    }));
  }, []);

  const removeEvent = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      events: prev.events?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!profile.firstName?.trim()) newErrors.firstName = "Required";
      if (!profile.lastName?.trim()) newErrors.lastName = "Required";
      if (!profile.gender) newErrors.gender = "Required";
      if (!profile.position) newErrors.position = "Required";
      if (!profile.gradYear) newErrors.gradYear = "Required";
      if (!profile.state) newErrors.state = "Required";
    }

    if (step === 1) {
      if (!profile.experienceLevel) newErrors.experienceLevel = "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [currentStep, validateStep, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate all steps
    let hasErrors = false;
    for (let i = 0; i <= currentStep; i++) {
      if (!validateStep(i)) {
        hasErrors = true;
        setCurrentStep(i);
        break;
      }
    }

    if (hasErrors) return;

    // Build complete profile
    const completeProfile: PlayerProfile = {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email,
      gender: profile.gender!,
      position: profile.position!,
      secondaryPositions: profile.secondaryPositions || [],
      gradYear: profile.gradYear!,
      state: profile.state!,
      citizenship: profile.citizenship || "US",
      height: profile.height,
      dominantFoot: profile.dominantFoot,
      experienceLevel: profile.experienceLevel || "moderate",
      seasons: profile.seasons || [],
      events: profile.events || [],
      gpa: profile.gpa,
      testScore: profile.testScore,
      athleticProfile: profile.athleticProfile || {},
      hasVideo: profile.hasVideo || false,
      coachesContacted: profile.coachesContacted || 0,
      responsesReceived: profile.responsesReceived || 0,
      offersReceived: profile.offersReceived || 0,
    };

    await onSubmit(completeProfile);
  }, [profile, currentStep, validateStep, onSubmit]);

  const filteredLeagues = LEAGUES.filter((league) => {
    if (!profile.gender) return true;
    if (league.gender === "both") return true;
    if (league.gender === "boys" && profile.gender === "Male") return true;
    if (league.gender === "girls" && profile.gender === "Female") return true;
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Demo Profile Selector */}
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2 self-center">Quick Load:</span>
            {Object.keys(DEMO_PROFILES).map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => loadDemoProfile(name)}
                className="text-xs"
              >
                {name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex-1 text-center ${index < steps.length - 1 ? "border-r" : ""}`}
          >
            <div
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : index < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName || ""}
                    onChange={(e) => updateProfile("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName || ""}
                    onChange={(e) => updateProfile("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => updateProfile("email", e.target.value)}
                  placeholder="Optional - for saving results"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={profile.gender || ""}
                    onValueChange={(value) => updateProfile("gender", value as Gender)}
                  >
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Graduation Year *</Label>
                  <Select
                    value={profile.gradYear?.toString() || ""}
                    onValueChange={(value) => updateProfile("gradYear", parseInt(value))}
                  >
                    <SelectTrigger className={errors.gradYear ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAD_YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gradYear && <p className="text-xs text-red-500">{errors.gradYear}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Position *</Label>
                  <Select
                    value={profile.position || ""}
                    onValueChange={(value) => updateProfile("position", value as Position)}
                  >
                    <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                </div>

                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select
                    value={profile.state || ""}
                    onValueChange={(value) => updateProfile("state", value)}
                  >
                    <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={profile.height || ""}
                    onChange={(e) => updateProfile("height", e.target.value)}
                    placeholder="e.g., 5'10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dominant Foot</Label>
                  <Select
                    value={profile.dominantFoot || ""}
                    onValueChange={(value) => updateProfile("dominantFoot", value as "Left" | "Right" | "Both")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select foot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Right">Right</SelectItem>
                      <SelectItem value="Left">Left</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Experience */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select
                  value={profile.experienceLevel || ""}
                  onValueChange={(value) => updateProfile("experienceLevel", value as ExperienceLevel)}
                >
                  <SelectTrigger className={errors.experienceLevel ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.experienceLevel && <p className="text-xs text-red-500">{errors.experienceLevel}</p>}
              </div>

              {/* Seasons */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Club Seasons</Label>
                  <Button variant="outline" size="sm" onClick={addSeason}>
                    <Plus className="h-4 w-4 mr-1" /> Add Season
                  </Button>
                </div>

                {profile.seasons?.map((season, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-medium">Season {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSeason(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>League</Label>
                        <Select
                          value={season.league}
                          onValueChange={(value) => updateSeason(index, { league: value as YouthLeague })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredLeagues.map((league) => (
                              <SelectItem key={league.value} value={league.value}>
                                {league.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          type="number"
                          value={season.year}
                          onChange={(e) => updateSeason(index, { year: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Team Name</Label>
                        <Input
                          value={season.teamName}
                          onChange={(e) => updateSeason(index, { teamName: e.target.value })}
                          placeholder="e.g., FC Dallas U17"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Games Played</Label>
                        <Input
                          type="number"
                          value={season.gamesPlayed}
                          onChange={(e) => updateSeason(index, { gamesPlayed: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Goals</Label>
                        <Input
                          type="number"
                          value={season.goals}
                          onChange={(e) => updateSeason(index, { goals: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assists</Label>
                        <Input
                          type="number"
                          value={season.assists}
                          onChange={(e) => updateSeason(index, { assists: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Events */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Showcases & ID Camps</Label>
                  <Button variant="outline" size="sm" onClick={addEvent}>
                    <Plus className="h-4 w-4 mr-1" /> Add Event
                  </Button>
                </div>

                {profile.events?.map((event, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-medium">Event {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvent(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Event Name</Label>
                        <Input
                          value={event.name}
                          onChange={(e) => updateEvent(index, { name: e.target.value })}
                          placeholder="e.g., Jefferson Cup"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={event.type}
                          onValueChange={(value) => updateEvent(index, { type: value as Event["type"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="showcase">Showcase</SelectItem>
                            <SelectItem value="id_camp">ID Camp</SelectItem>
                            <SelectItem value="tournament">Tournament</SelectItem>
                            <SelectItem value="training">Training Camp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={event.date}
                          onChange={(e) => updateEvent(index, { date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={event.location}
                          onChange={(e) => updateEvent(index, { location: e.target.value })}
                          placeholder="e.g., Richmond, VA"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Academics */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (Core)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={profile.gpa || ""}
                    onChange={(e) => updateProfile("gpa", parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., 3.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    D1 requires 2.3+, D2 requires 2.2+
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testScore">SAT/ACT Score</Label>
                  <Input
                    id="testScore"
                    value={profile.testScore || ""}
                    onChange={(e) => updateProfile("testScore", e.target.value)}
                    placeholder="e.g., 1200 SAT or 26 ACT"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional since 2023 NCAA rule change
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Athletic Benchmarks (Optional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fortyYard">40-Yard Dash</Label>
                    <Input
                      id="fortyYard"
                      value={profile.athleticProfile?.fortyYardDash || ""}
                      onChange={(e) =>
                        updateProfile("athleticProfile", {
                          ...profile.athleticProfile,
                          fortyYardDash: e.target.value,
                        })
                      }
                      placeholder="e.g., 4.8s"
                    />
                    <p className="text-xs text-muted-foreground">Elite: &lt;5.0s</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mile">Mile Time</Label>
                    <Input
                      id="mile"
                      value={profile.athleticProfile?.mileTime || ""}
                      onChange={(e) =>
                        updateProfile("athleticProfile", {
                          ...profile.athleticProfile,
                          mileTime: e.target.value,
                        })
                      }
                      placeholder="e.g., 5:30"
                    />
                    <p className="text-xs text-muted-foreground">Target: &lt;6:00</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beep">Beep Test Level</Label>
                    <Input
                      id="beep"
                      type="number"
                      value={profile.athleticProfile?.beepTestLevel || ""}
                      onChange={(e) =>
                        updateProfile("athleticProfile", {
                          ...profile.athleticProfile,
                          beepTestLevel: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="e.g., 50"
                    />
                    <p className="text-xs text-muted-foreground">D1 target: 45+</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Market Reality */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  This section helps us give you realistic expectations. The recruiting
                  market is competitive, and coaches need to see you to recruit you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Do you have a highlight video?</Label>
                    <p className="text-sm text-muted-foreground">
                      No video = 60% visibility penalty at all levels
                    </p>
                  </div>
                  <Select
                    value={profile.hasVideo ? "yes" : "no"}
                    onValueChange={(value) => updateProfile("hasVideo", value === "yes")}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coachesContacted">
                    How many college coaches have you contacted?
                  </Label>
                  <Input
                    id="coachesContacted"
                    type="number"
                    min="0"
                    value={profile.coachesContacted || ""}
                    onChange={(e) =>
                      updateProfile("coachesContacted", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Benchmark: Most recruits need 20-50+ targeted outreach attempts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsesReceived">
                    How many responses have you received?
                  </Label>
                  <Input
                    id="responsesReceived"
                    type="number"
                    min="0"
                    value={profile.responsesReceived || ""}
                    onChange={(e) =>
                      updateProfile("responsesReceived", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offersReceived">
                    Any official offers or interest from coaches?
                  </Label>
                  <Input
                    id="offersReceived"
                    type="number"
                    min="0"
                    value={profile.offersReceived || ""}
                    onChange={(e) =>
                      updateProfile("offersReceived", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get Analysis"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
