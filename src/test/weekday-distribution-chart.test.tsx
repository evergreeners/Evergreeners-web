import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  WeekdayDistributionChart,
  WeekdayCommitData,
} from "../components/WeekdayDistributionChart";

vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 200 }}>{children}</div>
    ),
  };
});

describe("WeekdayDistributionChart", () => {
  const sampleData: WeekdayCommitData[] = [
    { day: "Mon", commits: 10 },
    { day: "Tue", commits: 20 },
    { day: "Wed", commits: 50 },
    { day: "Thu", commits: 15 },
    { day: "Fri", commits: 5 },
    { day: "Sat", commits: 0 },
    { day: "Sun", commits: 0 },
  ];

  it("renders header with total commits and time range label", () => {
    render(<WeekdayDistributionChart data={sampleData} timeRange="month" />);

    expect(screen.getByText("Activity Distribution")).toBeDefined();
    expect(screen.getByText(/100 commits/i)).toBeDefined();
    expect(screen.getByText(/Past Month/i)).toBeDefined();
    expect(screen.getByText("Power Day")).toBeDefined();
    expect(screen.getByText("Mon – Fri")).toBeDefined();
    expect(screen.getByText("Sat – Sun")).toBeDefined();
  });

  it("identifies peak day Wed with 50 commits and 50% output", () => {
    render(<WeekdayDistributionChart data={sampleData} timeRange="month" />);

    expect(screen.getAllByText(/Wed/i).length).toBeGreaterThan(0);
    // Weekday split should be 100% and weekend 0%
    expect(screen.getByText(/100% Weekdays/i)).toBeDefined();
    expect(screen.getByText(/0% Weekends/i)).toBeDefined();
  });

  it("supports switching between Pillars and Wave view modes", () => {
    render(<WeekdayDistributionChart data={sampleData} />);

    const waveBtn = screen.getByRole("button", { name: /wave/i });
    expect(waveBtn).toBeDefined();

    fireEvent.click(waveBtn);

    const pillarsBtn = screen.getByRole("button", { name: /pillars/i });
    expect(pillarsBtn).toBeDefined();

    fireEvent.click(pillarsBtn);
  });

  it("handles empty data gracefully without throwing", () => {
    render(<WeekdayDistributionChart data={[]} timeRange="week" />);

    expect(screen.getByText("Activity Distribution")).toBeDefined();
    expect(screen.getByText(/0 commits/i)).toBeDefined();
    expect(screen.getByText(/No commit activity recorded in the past 7 days/i)).toBeDefined();
  });
});
