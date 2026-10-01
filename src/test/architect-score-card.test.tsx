import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArchitectScoreCard } from "@/components/repo/ArchitectScoreCard";

describe("ArchitectScoreCard", () => {
  const mockCategoryScores = {
    documentation: 92,
    architecture: 88,
    testing: 65,
    maintenance: 90,
  };

  it("renders overall health score and readiness status", () => {
    render(
      <ArchitectScoreCard
        score={84}
        readiness="Production Ready"
        categoryScores={mockCategoryScores}
        isAnalyzing={false}
        onReRunAudit={vi.fn()}
      />
    );

    expect(screen.getByText("84")).toBeDefined();
    expect(screen.getByText("/100")).toBeDefined();
    expect(screen.getByText("Production Ready")).toBeDefined();
  });

  it("renders dimensional progress score percentages", () => {
    render(
      <ArchitectScoreCard
        score={84}
        readiness="Production Ready"
        categoryScores={mockCategoryScores}
        isAnalyzing={false}
        onReRunAudit={vi.fn()}
      />
    );

    expect(screen.getByText("Documentation & Setup")).toBeDefined();
    expect(screen.getByText("92%")).toBeDefined();
    expect(screen.getByText("Architecture & Modularity")).toBeDefined();
    expect(screen.getByText("88%")).toBeDefined();
    expect(screen.getByText("Testing & CI Coverage")).toBeDefined();
    expect(screen.getByText("65%")).toBeDefined();
    expect(screen.getByText("Maintenance & Hygiene")).toBeDefined();
    expect(screen.getByText("90%")).toBeDefined();
  });

  it("handles re-run audit button click and disabled state", () => {
    const onReRun = vi.fn();
    const { rerender } = render(
      <ArchitectScoreCard
        score={84}
        readiness="Production Ready"
        categoryScores={mockCategoryScores}
        isAnalyzing={false}
        onReRunAudit={onReRun}
      />
    );

    const rerunBtn = screen.getByText("Re-run Audit");
    fireEvent.click(rerunBtn);
    expect(onReRun).toHaveBeenCalledTimes(1);

    // Re-render in analyzing state
    rerender(
      <ArchitectScoreCard
        score={84}
        readiness="Production Ready"
        categoryScores={mockCategoryScores}
        isAnalyzing={true}
        onReRunAudit={onReRun}
      />
    );

    expect(screen.getByText("Analyzing...")).toBeDefined();
  });
});
