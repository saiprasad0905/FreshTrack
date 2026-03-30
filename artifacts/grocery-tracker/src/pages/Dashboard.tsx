import { useState } from "react";
import { Plus, Camera, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ItemCard } from "@/components/items/ItemCard";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { ScanReceiptDialog } from "@/components/items/ScanReceiptDialog";
import { useItemsQuery, useUpdateItemMutation, useDeleteItemMutation } from "@/hooks/use-items";
import type { ListItemsStatus, Item } from "@workspace/api-client-react";

export function Dashboard() {
  const [statusTab, setStatusTab] = useState<ListItemsStatus | 'all'>('active');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useItemsQuery(statusTab === 'all' ? undefined : statusTab);
  const updateMutation = useUpdateItemMutation();
  const deleteMutation = useDeleteItemMutation();

  const handleConsume = (id: number) => updateMutation.mutate({ id, data: { status: 'consumed' } });
  const handleWaste = (id: number) => updateMutation.mutate({ id, data: { status: 'wasted' } });
  const handleDelete = (id: number) => deleteMutation.mutate(id);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting active items by expiry date
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.status === 'active' && b.status === 'active') {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    return 0;
  });

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Your Fridge</h1>
          <p className="text-muted-foreground mt-1">Track groceries, prevent waste, save money.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsScanOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-white border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-sm"
          >
            <Camera className="w-5 h-5" />
            Scan
          </button>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-2 border border-border/50 shadow-sm flex flex-col md:flex-row gap-2 mb-8">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto">
          {(['active', 'consumed', 'wasted', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm capitalize whitespace-nowrap transition-all ${
                statusTab === tab 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search groceries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-card rounded-3xl border border-border/50 animate-pulse"></div>
          ))}
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedItems.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onConsume={handleConsume}
              onWaste={handleWaste}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <img 
            src={`${import.meta.env.BASE_URL}images/empty-fridge.png`} 
            alt="Empty fridge illustration" 
            className="w-64 h-64 object-contain mb-6 opacity-90 drop-shadow-xl"
          />
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">Fridge is empty</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            You don't have any {statusTab !== 'all' ? statusTab : ''} items right now. Add some groceries or scan a receipt to get started.
          </p>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add First Item
          </button>
        </div>
      )}

      <AddItemDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <ScanReceiptDialog open={isScanOpen} onOpenChange={setIsScanOpen} />
    </AppLayout>
  );
}
