import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiUrl } from '@/lib/api-config';

// Initialize with a dummy key or environment variable.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key';
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiService = {
    async analyzeRepoHealth(repoData: any, tree: any) {
        const missingItems: string[] = [];
        const files = tree?.tree?.map((t: any) => t.path) || [];

        if (!files.includes('.gitignore')) missingItems.push('.gitignore');
        if (!files.some((f: string) => f.toLowerCase().includes('readme'))) missingItems.push('README.md');
        if (!files.some((f: string) => f.toLowerCase().includes('license'))) missingItems.push('LICENSE');
        if (!files.some((f: string) => f.toLowerCase().includes('contributing'))) missingItems.push('CONTRIBUTING.md');

        // Prefer backend analysis endpoint with server-side Gemini 2.5 Flash
        try {
            const [owner, repo] = (repoData.full_name || `${repoData.owner?.login || 'user'}/${repoData.name}`).split('/');
            const res = await fetch(getApiUrl("/api/repo/analyze"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    owner,
                    repo,
                    repoInfo: repoData,
                    fileList: files,
                    recentCommits: [],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    return {
                        score: data.data.score || 80,
                        insights: data.data.architectRead || "Architecture analysis complete.",
                        missingFiles: missingItems,
                    };
                }
            }
        } catch (backendErr) {
            console.warn("Backend repo audit unavailable, attempting fallback", backendErr);
        }

        if (apiKey === 'dummy_key') return this.getMockHealthResponse(missingItems);

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `
        Analyze the health of this GitHub repository based on its basic metadata and missing files.
        Repository Name: ${repoData.name}
        Description: ${repoData.description || 'No description'}
        Language: ${repoData.language || 'Unknown'}
        Missing standard files: ${missingItems.join(', ') || 'None'}
        
        Provide a JSON response with:
        - "score": A score from 0 to 100 representing repository health.
        - "insights": A short text explaining the score.
        - "missingFiles": The missing files from the list provided.
      `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "{}";
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("Gemini Health Analysis Failed", e);
            return this.getMockHealthResponse(missingItems);
        }
    },

    async generateSuggestions(repoData: any) {
        // Prefer backend analysis recommendations if available
        try {
            const [owner, repo] = (repoData.full_name || `${repoData.owner?.login || 'user'}/${repoData.name}`).split('/');
            const res = await fetch(getApiUrl("/api/repo/analyze"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    owner,
                    repo,
                    repoInfo: repoData,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.data?.actionItems) && data.data.actionItems.length > 0) {
                    return data.data.actionItems.map((item: any) => ({
                        title: item.title,
                        description: item.description,
                    }));
                }
            }
        } catch {
            // fallback
        }

        if (apiKey === 'dummy_key') return this.getMockSuggestions();

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `
        Suggest 3 "micro-improvements" that take less than 20 minutes to complete for the following project.
        Project Name: ${repoData.name}
        Description: ${repoData.description || 'No description'}
        Language: ${repoData.language || 'Unknown'}

        Return a JSON array of objects with "title" and "description" keys for each suggestion.
      `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "[]";
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("Gemini Suggestion Generation Failed", e);
            return this.getMockSuggestions();
        }
    },

    async autoWriteDocumentation(repoContext: any, manifestContent: string, type: 'readme' | 'contributing' | 'issue_template') {
        if (apiKey === 'dummy_key') return this.getMockDocumentation(type);

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const typePrompts = {
                readme: 'a highly tailored README.md file',
                contributing: 'a CONTRIBUTING.md file detailing contribution guidelines',
                issue_template: 'a bug report and feature request issue template'
            };

            const prompt = `
        You are an expert developer.
        Write ${typePrompts[type]} for the following repository.
        Repository Name: ${repoContext.name}
        Description: ${repoContext.description || 'No description'}
        Language: ${repoContext.language || 'Unknown'}
        Top level manifest or package config content:
        ${manifestContent || 'Not provided'}
        
        Return ONLY the markdown text.
      `;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (e) {
            console.error("Gemini Doc Generation Failed", e);
            return this.getMockDocumentation(type);
        }
    },

    getMockHealthResponse(missingItems: string[] = []) {
        return {
            score: 75,
            insights: "The repository lacks some core standard files, but looks solid otherwise.",
            missingFiles: missingItems.length > 0 ? missingItems : [".gitignore", "LICENSE", "README.md"]
        };
    },

    getMockSuggestions() {
        return [
            { title: 'Add a .gitignore', description: 'Create a .gitignore file to prevent accidentially committing generated files.' },
            { title: 'Update README', description: 'Expand your README with setup instructions.' },
            { title: 'Fix Dependabot Alerts', description: 'Enable dependabot and update outdated packages.' }
        ];
    },

    getMockDocumentation(type: string) {
        if (type === 'readme') return "# Project Title\\n\\n## Overview\\n\\nThis is a generated README.";
        if (type === 'contributing') return "# Contributing Guidelines\\n\\nPlease fork the repository and open a PR.";
        return "## Issue Report\\n\\n**Describe the bug:**";
    }
};
