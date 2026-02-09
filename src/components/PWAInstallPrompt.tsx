import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Don't show if user previously dismissed
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                // Show after 30 seconds to not be annoying
                setTimeout(() => {
                    setShowPrompt(true);
                }, 30000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast.success('App installed successfully! 🎉');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-up">
            <div className="glass-nav bg-primary/10 backdrop-blur-2xl border-primary/20 rounded-2xl p-4 shadow-2xl max-w-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Download className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Install Evergreeners</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Install our app for a better experience with offline support and quick access!
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleInstall}
                                className="bg-primary hover:bg-primary/90"
                            >
                                Install
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="hover:bg-primary/10"
                            >
                                Not now
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
