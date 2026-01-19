import { Button } from "@/components/ui/button";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileEditFormProps {
    editedProfile: any;
    setEditedProfile: (profile: any) => void;
    handleSaveProfile: () => void;
    handleCopyLink: () => void;
    copied: boolean;
}

export function ProfileEditForm({
    editedProfile,
    setEditedProfile,
    handleSaveProfile,
    handleCopyLink,
    copied,
}: ProfileEditFormProps) {
    return (
        <div className="space-y-4 py-4">
            <div>
                <label className="text-sm text-muted-foreground">Display Name</label>
                <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="text-sm text-muted-foreground">Username</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">@</span>
                    <input
                        type="text"
                        value={editedProfile.username}
                        onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                        className="w-full mt-2 p-3 pl-8 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>
            <div>
                <label className="text-sm text-muted-foreground">Profile Picture (Max 1MB)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 1024 * 1024) {
                            toast.error("Image size must be less than 1MB");
                            e.target.value = ""; // Reset input
                            return;
                        }

                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setEditedProfile({ ...editedProfile, image: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                    }}
                    className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {editedProfile.image && editedProfile.image.startsWith("data:") && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Image selected (Preview above when saved)
                    </div>
                )}
            </div>
            <div>
                <label className="text-sm text-muted-foreground">Bio</label>
                <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors resize-none h-24"
                />
            </div>
            <div>
                <label className="text-sm text-muted-foreground">Location</label>
                <input
                    type="text"
                    value={editedProfile.location}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="text-sm text-muted-foreground">Website</label>
                <input
                    type="url"
                    value={editedProfile.website}
                    onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-primary hover:bg-primary/90"
                >
                    Save Changes
                </Button>
                <button
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                    onClick={handleCopyLink}
                    title="Copy Profile Link"
                >
                    {copied ? <Check className="w-5 h-5 text-primary" /> : <Share2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
