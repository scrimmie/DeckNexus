import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Crown, Users, BookOpen, Sparkles, Plus } from "lucide-react";
import { NewDeckPage } from "@/components/NewDeckPage";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Crown className="h-12 w-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">
              Deck<span className="text-purple-400">Nexus</span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            The ultimate Commander deck building companion
          </p>
        </header>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-600">
            <TabsTrigger
              value="home"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
            >
              <Crown className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="new-deck"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Deck
            </TabsTrigger>
          </TabsList>

          {/* Home Tab Content */}
          <TabsContent value="home" className="space-y-8 mt-8">
            {/* Hero Section */}
            <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-white mb-4">
                  Build Legendary Decks
                </CardTitle>
                <CardDescription className="text-lg text-slate-300">
                  Create powerful Commander decks with AI-powered suggestions,
                  comprehensive card analysis, and tournament-tested strategies.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search commanders, cards, or strategies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Browse Commanders
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Random Deck
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Deck Guide
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* AI Deck Generation */}
              <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-sm hover:bg-slate-800/90 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                    <CardTitle className="text-white">
                      AI Deck Builder
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 mb-4">
                    Let our AI create synergistic 100-card decks tailored to
                    your commander and playstyle preferences.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-300"
                    >
                      Smart Synergy
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-300"
                    >
                      Meta Analysis
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Commander Database */}
              <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-sm hover:bg-slate-800/90 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-6 w-6 text-gold-400" />
                    <CardTitle className="text-white">Commander Hub</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 mb-4">
                    Explore thousands of legendary creatures and planeswalkers
                    with detailed analytics and deck suggestions.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-gold-600/20 text-gold-300"
                    >
                      2000+ Commanders
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-gold-600/20 text-gold-300"
                    >
                      Win Rate Data
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Community Features */}
              <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-sm hover:bg-slate-800/90 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-400" />
                    <CardTitle className="text-white">Community</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 mb-4">
                    Share decks, get feedback, and discover new strategies from
                    the Commander community.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-600/20 text-blue-300"
                    >
                      Deck Sharing
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-blue-600/20 text-blue-300"
                    >
                      Reviews
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Commanders Section */}
            <Card className="bg-slate-800/50 border-slate-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-purple-400" />
                  <span>Popular Commanders</span>
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Top commanders in the current meta
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      name: "Atraxa, Praetors' Voice",
                      colors: ["W", "U", "B", "G"],
                      winRate: "68%",
                    },
                    {
                      name: "The Ur-Dragon",
                      colors: ["W", "U", "B", "R", "G"],
                      winRate: "64%",
                    },
                    {
                      name: "Edgar Markov",
                      colors: ["W", "B", "R"],
                      winRate: "62%",
                    },
                    {
                      name: "Kaalia of the Vast",
                      colors: ["W", "B", "R"],
                      winRate: "59%",
                    },
                  ].map((commander, index) => (
                    <Card
                      key={index}
                      className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`/commander-${index + 1}.jpg`} />
                            <AvatarFallback className="bg-purple-600 text-white">
                              {commander.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {commander.name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex space-x-1">
                                {commander.colors.map((color, colorIndex) => (
                                  <div
                                    key={colorIndex}
                                    className={`w-3 h-3 rounded-full border ${
                                      color === "W"
                                        ? "bg-yellow-200"
                                        : color === "U"
                                        ? "bg-blue-500"
                                        : color === "B"
                                        ? "bg-gray-800"
                                        : color === "R"
                                        ? "bg-red-500"
                                        : "bg-green-500"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-400">
                                {commander.winRate}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Deck Tab Content */}
          <TabsContent value="new-deck" className="mt-8">
            <NewDeckPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
