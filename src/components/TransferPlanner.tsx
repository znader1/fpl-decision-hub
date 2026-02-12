import { ArrowRightLeft, Search, X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JerseyIcon } from "./JerseyIcon";
import { Badge } from "@/components/ui/badge";

interface Transfer {
  id: number;
  playerOut: { name: string; team: string; price: number; points: number };
  playerIn: { name: string; team: string; price: number; points: number };
}

const suggestedTransfers: Transfer[] = [
  {
    id: 1,
    playerOut: { name: "Sterling", team: "CHE", price: 7.0, points: 89 },
    playerIn: { name: "Saka", team: "ARS", price: 9.0, points: 198 },
  },
  {
    id: 2,
    playerOut: { name: "Walker", team: "MCI", price: 5.5, points: 134 },
    playerIn: { name: "Van Dijk", team: "LIV", price: 6.5, points: 162 },
  },
];

export const TransferPlanner = () => {
  const [search, setSearch] = useState("");
  const [selectedTransfers, setSelectedTransfers] = useState<number[]>([]);
  const budget = 102.5;
  const freeTransfers = 1;

  const toggleTransfer = (id: number) => {
    setSelectedTransfers((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const costDelta = suggestedTransfers
    .filter((t) => selectedTransfers.includes(t.id))
    .reduce((acc, t) => acc + (t.playerOut.price - t.playerIn.price), 0);

  const hitCost = Math.max(0, selectedTransfers.length - freeTransfers) * 4;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Transfer Planner
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            FT: {freeTransfers}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Budget: £{(budget + costDelta).toFixed(1)}m
          </Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearch("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Suggested Transfers
        </p>
        {suggestedTransfers.map((transfer) => {
          const isSelected = selectedTransfers.includes(transfer.id);
          return (
            <div
              key={transfer.id}
              className={`rounded-lg border p-3 cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => toggleTransfer(transfer.id)}
            >
              <div className="flex items-center gap-3">
                {/* Player Out */}
                <div className="flex-1 flex items-center gap-2">
                  <JerseyIcon team={transfer.playerOut.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-destructive truncate">
                      {transfer.playerOut.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      £{transfer.playerOut.price}m · {transfer.playerOut.points}pts
                    </p>
                  </div>
                </div>

                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                {/* Player In */}
                <div className="flex-1 flex items-center gap-2">
                  <JerseyIcon team={transfer.playerIn.team} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {transfer.playerIn.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      £{transfer.playerIn.price}m · {transfer.playerIn.points}pts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTransfers.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transfers</span>
            <span className="font-medium text-foreground">{selectedTransfers.length}</span>
          </div>
          {hitCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Point hit</span>
              <span className="font-medium text-destructive">-{hitCost} pts</span>
            </div>
          )}
          <Button className="w-full mt-2" size="sm">
            Confirm Transfers
          </Button>
        </div>
      )}
    </Card>
  );
};
