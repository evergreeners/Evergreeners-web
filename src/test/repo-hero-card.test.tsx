import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepoHeroCard } from "@/components/repo/RepoHeroCard";

describe("RepoHeroCard", () => {
  const mockRepoInfo = {
    name: "emerald-cli",
    description: "High-performance systems utility",
    default_branch: "master",
    private: false,
    stargazers_count: 128,
    forks_count: 32,
    watchers_count: 64,
    open_issues_count: 3,
    size: 2048,
    license: { spdx_id: "Apache-2.0" },
    topics: ["rust", "systems", "cli"],
    html_url: "https://github.com/test/emerald-cli",
  };

  const mockLanguages = {
    Rust: 75000,
    Shell: 25000,
  };

  it("renders repository name, visibility, and description correctly", () => {
    render(
      <RepoHeroCard
        repoInfo={mockRepoInfo}
        languages={mockLanguages}
        isAnalyzing={false}
        onRunAudit={vi.fn()}
      />
    );

    expect(screen.getByText("emerald-cli")).toBeDefined();
    expect(screen.getByText("Public")).toBeDefined();
    expect(screen.getByText("master")).toBeDefined();
    expect(screen.getByText("High-performance systems utility")).toBeDefined();
  });

  it("renders metrics, tags, and license correctly", () => {
    render(
      <RepoHeroCard
        repoInfo={mockRepoInfo}
        languages={mockLanguages}
        isAnalyzing={false}
        onRunAudit={vi.fn()}
      />
    );

    expect(screen.getByText("128")).toBeDefined();
    expect(screen.getByText("32")).toBeDefined();
    expect(screen.getByText("64")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("2.0 MB")).toBeDefined();
    expect(screen.getByText("Apache-2.0")).toBeDefined();
    expect(screen.getByText("rust")).toBeDefined();
    expect(screen.getByText("systems")).toBeDefined();
  });

  it("calculates language percentages and triggers audit click", () => {
    const onRunAudit = vi.fn();
    render(
      <RepoHeroCard
        repoInfo={mockRepoInfo}
        languages={mockLanguages}
        isAnalyzing={false}
        onRunAudit={onRunAudit}
      />
    );

    expect(screen.getByText("Rust")).toBeDefined();
    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("Shell")).toBeDefined();
    expect(screen.getByText("25%")).toBeDefined();

    const auditBtn = screen.getByText("Run Codebase Audit");
    fireEvent.click(auditBtn);
    expect(onRunAudit).toHaveBeenCalledTimes(1);
  });
});
