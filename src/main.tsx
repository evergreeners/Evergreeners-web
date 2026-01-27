import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide the initial HTML loader once React has rendered actual content
const hideInitialLoader = () => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
        loader.classList.add("hidden");
        // Remove from DOM after transition completes
        setTimeout(() => loader.remove(), 300);
    }
};

// Watch for when React renders actual content
const waitForContent = () => {
    const root = document.getElementById("root");
    if (!root) return;

    // Check if root has meaningful content
    const checkContent = () => {
        // If root has child elements with actual content, hide loader
        if (root.children.length > 0 && root.innerHTML.length > 50) {
            hideInitialLoader();
            return true;
        }
        return false;
    };

    // Check immediately
    if (checkContent()) return;

    // Otherwise, observe for changes
    const observer = new MutationObserver(() => {
        if (checkContent()) {
            observer.disconnect();
        }
    });

    observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    // Fallback: hide after 3 seconds max to prevent infinite loading
    setTimeout(() => {
        observer.disconnect();
        hideInitialLoader();
    }, 3000);
};

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
root.render(<App />);

// Start watching for content
waitForContent();

