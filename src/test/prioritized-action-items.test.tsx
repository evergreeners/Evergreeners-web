import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrioritizedActionItems } from "@/components/repo/PrioritizedActionItems";

describe("PrioritizedActionItems", () => {
  const mockItems = [
    {
      title: "Add GitHub Actions Workflow",
      description: "Automate continuous integration checks on push.",
      priority: "high",
      timeEstimate: "~15 mins",
    },
    {
      title: "Introduce TypeScript Strict Mode",
      description: "Eliminate implicit any types across the core codebase.",
      priority: "medium",
      timeEstimate: "~45 mins",
    },
  ];

  it("renders priority badges, time estimates, and titles", () => {
    render(<PrioritizedActionItems items={mockItems} />);

    expect(screen.getByText("Prioritized Action Items")).toBeDefined();
    expect(screen.getByText("Add GitHub Actions Workflow")).toBeDefined();
    expect(screen.getByText("HIGH")).toBeDefined();
    expect(screen.getByText("~15 mins")).toBeDefined();

    expect(screen.getByText("Introduce TypeScript Strict Mode")).toBeDefined();
    expect(screen.getByText("MEDIUM")).toBeDefined();
    expect(screen.getByText("~45 mins")).toBeDefined();
  });

  it("renders empty state message when no action items are passed", () => {
    render(<PrioritizedActionItems items={[]} />);

    expect(
      screen.getByText(
        "No pending action items identified. Codebase architecture is in prime shape."
      )
    ).toBeDefined();
  });
});
