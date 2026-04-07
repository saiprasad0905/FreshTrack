import { useState } from "react";
import { Plus, Check, Trash2, ChevronRight, Leaf, LogOut } from "lucide-react";
import { useAuth, type Fridge } from "@/context/AuthContext";

const FRIDGE_ICONS = ["🧊", "🥗", "🥩", "🧀", "🥛", "🍎", "🥦", "🌶️", "🍳", "🏠"];

interface AddFridgeModalProps {
  onClose: () => void;
  onAdd: (fridge: Fridge) => void;
}

function AddFridgeModal({ onClose, onAdd }: AddFridgeModalProps) {
  const { createFridge } = useAuth();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🧊");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const fridge = await createFridge(name.trim(), icon);
      onAdd(fridge);
    } catch (err: any) {
      setError(err.message ?? "Failed to create fridge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <h3 className="font-display font-bold text-xl mb-5">Add a new fridge</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Fridge name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kitchen Fridge, Office Mini Fridge"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Choose an icon</label>
            <div className="flex flex-wrap gap-2">
              {FRIDGE_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? "bg-primary/20 ring-2 ring-primary shadow-md"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FridgeSelector({ onSelect }: { onSelect: () => void }) {
  const { user, fridges, selectFridge, logout } = useAuth();
  const [showAdd, setShowAdd] = useState(fridges.length === 0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleSelect = (fridge: Fridge) => {
    selectFridge(fridge);
    onSelect();
  };

  const handleAddFridge = (fridge: Fridge) => {
    setShowAdd(false);
    handleSelect(fridge);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-5 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <Leaf className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">FreshTrack</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-muted"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          {/* Greeting */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto mb-5">
              <span className="text-4xl">🧊</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-1">
              Hi, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              {fridges.length === 0
                ? "Set up your first fridge to get started."
                : "Which fridge would you like to manage today?"}
            </p>
          </div>

          {/* Fridge cards */}
          {fridges.length > 0 && (
            <div className="space-y-3 mb-4">
              {fridges.map(fridge => (
                <button
                  key={fridge.id}
                  onClick={() => handleSelect(fridge)}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-100 flex items-center justify-center text-2xl shadow-sm">
                    {fridge.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{fridge.name}</p>
                    <p className="text-xs text-muted-foreground">Tap to open</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Add another fridge */}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {fridges.length === 0 ? "Add your first fridge" : "Add another fridge"}
              </p>
              <p className="text-xs text-muted-foreground">Kitchen, office, hostel — track any fridge</p>
            </div>
          </button>
        </div>
      </div>

      {showAdd && (
        <AddFridgeModal
          onClose={() => fridges.length > 0 ? setShowAdd(false) : undefined}
          onAdd={handleAddFridge}
        />
      )}
    </div>
  );
}
