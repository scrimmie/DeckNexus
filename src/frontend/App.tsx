import { useState } from "react";
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

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-white">⚔️ DeckNexus</div>
            <Badge variant="secondary" className="bg-purple-600 text-white">
              Beta
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Magic Commander Deck Builder
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Build powerful Commander decks with AI assistance
          </p>

          <div className="max-w-md mx-auto mb-8">
            <div className="flex space-x-2">
              <Input
                placeholder="Search for a commander..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-800 border-slate-600 text-white"
              />
              <Button className="bg-purple-600 hover:bg-purple-700">
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🔍 Commander Search</CardTitle>
              <CardDescription className="text-slate-400">
                Find commanders from Scryfall's database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
              >
                Browse Commanders
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🤖 AI Generation</CardTitle>
              <CardDescription className="text-slate-400">
                Generate synergistic decklists with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
              >
                Generate Deck
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">📤 Export</CardTitle>
              <CardDescription className="text-slate-400">
                Export to Moxfield and Archidekt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
              >
                Export Options
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
