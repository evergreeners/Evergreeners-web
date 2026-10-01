import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RepoDetail from "../pages/RepoDetail";
import { githubService } from "../lib/githubService";

vi.mock("@/components/Header", () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

vi.mock("@/components/FloatingNav", () => ({
  FloatingNav: () => <div data-testid="mock-floating-nav">Nav</div>,
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      session: { token: "fake_token", userId: "u123" },
      user: { name: "Test User", email: "test@example.com" },
    },
    isPending: false,
  }),
}));

describe("RepoDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(githubService, "getRepo").mockResolvedValue({
      name: "linksy",
      description: "Reverse USB tethering CLI for Linux",
      stargazers_count: 4,
      forks_count: 3,
      watchers_count: 4,
      open_issues_count: 1,
      size: 512,
      language: "JavaScript",
      default_branch: "main",
      private: false,
      html_url: "https://github.com/Adams-404/linksy",
      license: { spdx_id: "MIT", name: "MIT License" },
      topics: ["cli", "linux", "networking"],
    });

    vi.spyOn(githubService, "getRepoTree").mockResolvedValue({
      tree: [
        { path: ".gitignore" },
        { path: "README.md" },
        { path: "LICENSE" },
        { path: "package.json" },
      ],
    });

    vi.spyOn(githubService, "getRepoLanguages").mockResolvedValue({
      JavaScript: 8000,
      Shell: 2000,
    });

    vi.spyOn(githubService, "getRepoCommits").mockResolvedValue([
      {
        sha: "abc1234567",
        commit: {
          message: "feat: initial commit for linksy",
          author: { name: "Adams-404", date: "2026-09-30T12:00:00Z" },
        },
        author: { login: "Adams-404" },
        html_url: "https://github.com/Adams-404/linksy/commit/abc1234",
      },
    ]);

    vi.spyOn(githubService, "getRepoReadme").mockResolvedValue(
      "# linksy\nReverse USB tethering for Linux."
    );

    // Mock global fetch for /api/repo/analyze
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/repo/analyze")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                score: 88,
                categoryScores: {
                  documentation: 90,
                  architecture: 85,
                  testing: 70,
                  maintenance: 85,
                },
                readiness: "Production Ready",
                architectRead: "Clean Linux networking CLI with solid fundamentals.",
                strengths: ["Clear focused CLI architecture", "Zero bloated dependencies"],
                risks: ["Missing GitHub Actions CI workflow"],
                actionItems: [
                  {
                    title: "Add GitHub Actions Workflow",
                    description: "Automate linting and tests.",
                    timeEstimate: "~15 mins",
                    priority: "high",
                  },
                ],
                missingFiles: [".github/workflows (CI/CD)", "Test Suite"],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("loads and displays repo details, metrics, and standards checklist", async () => {
    render(
      <MemoryRouter initialEntries={["/repo/Adams-404/linksy"]}>
        <Routes>
          <Route path="/repo/:owner/:repo" element={<RepoDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify repo title and description
    await waitFor(() => {
      expect(screen.getAllByText("linksy").length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Reverse USB tethering CLI for Linux/i)).toBeDefined();
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1); // stars & watchers
    expect(screen.getByText("3")).toBeDefined(); // forks
    expect(screen.getByText("MIT")).toBeDefined(); // license

    // Standards checklist
    expect(screen.getByText("Standards & Hygiene Checklist")).toBeDefined();
    expect(screen.getByText(".gitignore")).toBeDefined();
    expect(screen.getByText("README.md")).toBeDefined();
    expect(screen.getByText("LICENSE")).toBeDefined();

    // Recent commit
    expect(screen.getByText("feat: initial commit for linksy")).toBeDefined();
    expect(screen.getByText("@Adams-404")).toBeDefined();
  });

  it("can trigger and display Architect's AI Audit results", async () => {
    render(
      <MemoryRouter initialEntries={["/repo/Adams-404/linksy"]}>
        <Routes>
          <Route path="/repo/:owner/:repo" element={<RepoDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Run Codebase Audit")).toBeDefined();
    });

    const auditButton = screen.getByText("Run Codebase Audit");
    fireEvent.click(auditButton);

    await waitFor(() => {
      expect(screen.getByText("Clean Linux networking CLI with solid fundamentals.")).toBeDefined();
      expect(screen.getByText("88")).toBeDefined();
      expect(screen.getByText("Production Ready")).toBeDefined();
      expect(screen.getByText("Add GitHub Actions Workflow")).toBeDefined();
    });
  });
});
