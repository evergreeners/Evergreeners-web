import { getApiUrl } from "@/lib/api-config";

export const githubService = {
    // Helper for proxy requests
    async proxyRequest(token: string, path: string, method: string = 'GET', body?: any) {
        const res = await fetch(getApiUrl('/api/github/proxy'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path, method, body })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'GitHub API request failed');
        }
        return res.json();
    },

    // Fetches repositories for the authenticated user
    async getUserRepos(token: string) {
        return this.proxyRequest(token, '/user/repos?sort=updated&per_page=100');
    },

    // Fetches a specific repository
    async getRepo(token: string, owner: string, repo: string) {
        return this.proxyRequest(token, `/repos/${owner}/${repo}`);
    },

    // Reads file contents
    async getFileContent(token: string, owner: string, repo: string, path: string) {
        const data = await this.proxyRequest(token, `/repos/${owner}/${repo}/contents/${path}`);
        return {
            ...data,
            content: data.content ? this.decodeBase64(data.content) : '',
        };
    },

    // Get repository tree (to spot missing files)
    async getRepoTree(token: string, owner: string, repo: string, defaultBranch: string = 'main') {
        return this.proxyRequest(token, `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    },

    // Get repository languages
    async getRepoLanguages(token: string, owner: string, repo: string) {
        return this.proxyRequest(token, `/repos/${owner}/${repo}/languages`);
    },

    // Get recent repository commits
    async getRepoCommits(token: string, owner: string, repo: string, perPage: number = 10) {
        return this.proxyRequest(token, `/repos/${owner}/${repo}/commits?per_page=${perPage}`);
    },

    // Get repository README
    async getRepoReadme(token: string, owner: string, repo: string) {
        try {
            const data = await this.proxyRequest(token, `/repos/${owner}/${repo}/readme`);
            return data?.content ? this.decodeBase64(data.content) : '';
        } catch {
            return '';
        }
    },

    // Creating branches
    async createBranch(token: string, owner: string, repo: string, newBranch: string, baseBranch: string = 'main') {
        // 1. Get base branch SHA
        const baseData = await this.proxyRequest(token, `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);

        // 2. Create new branch reference
        return this.proxyRequest(token, `/repos/${owner}/${repo}/git/refs`, 'POST', {
            ref: `refs/heads/${newBranch}`,
            sha: baseData.object.sha,
        });
    },

    // Writing files
    async createOrUpdateFile(token: string, owner: string, repo: string, path: string, content: string, message: string, branch: string) {
        let sha;
        try {
            const existingFile = await this.proxyRequest(token, `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            sha = existingFile.sha;
        } catch (e) {
            // File doesn't exist
        }

        return this.proxyRequest(token, `/repos/${owner}/${repo}/contents/${path}`, 'PUT', {
            message,
            content: this.encodeBase64(content),
            branch,
            ...(sha ? { sha } : {}),
        });
    },

    // Opening pull requests
    async openPullRequest(token: string, owner: string, repo: string, title: string, body: string, head: string, base: string = 'main') {
        return this.proxyRequest(token, `/repos/${owner}/${repo}/pulls`, 'POST', {
            title,
            body,
            head,
            base,
        });
    },

    // Robust Unicode-to-Base64 encoding
    encodeBase64(str: string): string {
        return btoa(
            encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(_match, p1) {
                    return String.fromCharCode(Number('0x' + p1));
                })
        );
    },

    // Robust Base64-to-Unicode decoding
    decodeBase64(str: string): string {
        return decodeURIComponent(
            atob(str).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
    }
};
