import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RepoStandardsChecklist } from "@/components/repo/RepoStandardsChecklist";

describe("RepoStandardsChecklist", () => {
  const mockItems = [
    {
      name: ".gitignore",
      description: "Excludes build artifacts and local secrets",
      present: true,
    },
    {
      name: "README.md",
      description: "Project documentation and quickstart guide",
      present: true,
    },
    {
      name: "CI/CD Workflows",
      description: "GitHub Actions automated build and test runner",
      present: false,
    },
  ];

  it("renders the standards header and satisfaction summary", () => {
    render(<RepoStandardsChecklist items={mockItems} />);

    expect(screen.getByText("Standards & Hygiene Checklist")).toBeDefined();
    expect(screen.getByText("2/3 Satisfied")).toBeDefined();
  });

  it("renders each item with appropriate presence indicator and description", () => {
    render(<RepoStandardsChecklist items={mockItems} />);

    expect(screen.getByText(".gitignore")).toBeDefined();
    expect(
      screen.getByText("Excludes build artifacts and local secrets")
    ).toBeDefined();

    expect(screen.getByText("README.md")).toBeDefined();
    expect(screen.getByText("CI/CD Workflows")).toBeDefined();

    const presentBadges = screen.getAllByText("Present");
    expect(presentBadges.length).toBe(2);

    const missingBadges = screen.getAllByText("Missing");
    expect(missingBadges.length).toBe(1);
  });
});
