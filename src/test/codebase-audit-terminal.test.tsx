import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodebaseAuditTerminal } from "@/components/repo/CodebaseAuditTerminal";

describe("CodebaseAuditTerminal", () => {
  it("renders idle terminal with repo title, command, and feature checks", () => {
    const onRunAudit = vi.fn();
    render(
      <CodebaseAuditTerminal
        repoName="evergreeners-core"
        isAnalyzing={false}
        onRunAudit={onRunAudit}
      />
    );

    expect(screen.getByText("evergreeners audit — evergreeners-core")).toBeDefined();
    expect(screen.getByText("READY")).toBeDefined();
    expect(screen.getByText("Initiate Codebase Diagnostic")).toBeDefined();
    expect(
      screen.getByText("$ npx audit --target=evergreeners-core")
    ).toBeDefined();

    expect(screen.getByText("Hygiene & Safety")).toBeDefined();
    expect(screen.getByText("Modularity & Depth")).toBeDefined();
    expect(screen.getByText("Commit Lineage")).toBeDefined();
    expect(screen.getByText("Actionable Fixes")).toBeDefined();

    const runBtn = screen.getByText("Execute Architectural Diagnosis");
    fireEvent.click(runBtn);
    expect(onRunAudit).toHaveBeenCalledTimes(1);
  });

  it("renders active diagnostic mode and pipeline steps when isAnalyzing is true", () => {
    render(
      <CodebaseAuditTerminal
        repoName="evergreeners-core"
        isAnalyzing={true}
        onRunAudit={vi.fn()}
      />
    );

    expect(screen.getByText("DIAGNOSING")).toBeDefined();
    expect(screen.getByText("[DIAGNOSTIC PIPELINE ACTIVE]")).toBeDefined();
    expect(
      screen.getByText("Connecting to repository metadata and file tree...")
    ).toBeDefined();
  });
});
