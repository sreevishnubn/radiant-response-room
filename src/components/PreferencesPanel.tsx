import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreferences } from "@/hooks/usePreferences";

interface PreferencesPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PreferencesPanel = ({ userId, isOpen, onClose }: PreferencesPanelProps) => {
  const { preferences, updatePreferences, loading } = usePreferences(userId);
  const [newSite, setNewSite] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSize, setNewSize] = useState("");
  const [sizeType, setSizeType] = useState("shirt");

  const handleAddSite = () => {
    if (!newSite.trim() || !preferences) return;
    const sites = [...(preferences.favorite_sites || []), newSite.trim()];
    updatePreferences({ favorite_sites: sites });
    setNewSite("");
  };

  const handleRemoveSite = (site: string) => {
    if (!preferences) return;
    const sites = (preferences.favorite_sites || []).filter(s => s !== site);
    updatePreferences({ favorite_sites: sites });
  };

  const handleAddSize = () => {
    if (!newSize.trim() || !preferences) return;
    const sizes = { ...(preferences.clothing_sizes || {}), [sizeType]: newSize.trim() };
    updatePreferences({ clothing_sizes: sizes });
    setNewSize("");
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || !preferences) return;
    const categories = [...(preferences.preferred_categories || []), newCategory.trim()];
    updatePreferences({ preferred_categories: categories });
    setNewCategory("");
  };

  const handleRemoveCategory = (category: string) => {
    if (!preferences) return;
    const categories = (preferences.preferred_categories || []).filter(c => c !== category);
    updatePreferences({ preferred_categories: categories });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h2 className="text-lg font-semibold">My Preferences</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Favorite Sites */}
                <div className="space-y-3">
                  <Label>Favorite Shopping Sites</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Amazon, Flipkart"
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
                    />
                    <Button size="icon" onClick={handleAddSite}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.favorite_sites?.map((site) => (
                      <div
                        key={site}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        {site}
                        <button
                          onClick={() => handleRemoveSite(site)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clothing Sizes */}
                <div className="space-y-3">
                  <Label>Clothing Sizes</Label>
                  <div className="flex gap-2">
                    <select
                      value={sizeType}
                      onChange={(e) => setSizeType(e.target.value)}
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="shirt">Shirt</option>
                      <option value="pants">Pants</option>
                      <option value="shoes">Shoes</option>
                      <option value="dress">Dress</option>
                    </select>
                    <Input
                      placeholder="e.g., M, L, 32"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSize()}
                    />
                    <Button size="icon" onClick={handleAddSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {preferences?.clothing_sizes && Object.entries(preferences.clothing_sizes).map(([type, size]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                      >
                        <span className="capitalize">{type}: <strong>{size}</strong></span>
                        <button
                          onClick={() => {
                            const sizes = { ...preferences.clothing_sizes };
                            delete sizes[type];
                            updatePreferences({ clothing_sizes: sizes });
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Categories */}
                <div className="space-y-3">
                  <Label>Preferred Categories</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Electronics, Fashion"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    />
                    <Button size="icon" onClick={handleAddCategory}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.preferred_categories?.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1 text-sm"
                      >
                        {category}
                        <button
                          onClick={() => handleRemoveCategory(category)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
