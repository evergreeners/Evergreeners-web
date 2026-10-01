import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Analytics from "../pages/Analytics";
import { githubService } from "../lib/githubService";

vi.mock("@/components/Header", () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

vi.mock("@/components/FloatingNav", () => ({
  FloatingNav: () => <div data-testid="mock-floating-nav">Nav</div>,
}));

vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 200 }}>{children}</div>
    ),
  };
});

vi.mock("@/components/WeekdayDistributionChart", () => ({
  WeekdayDistributionChart: () => <div data-testid="weekday-chart">Weekday Chart</div>,
}));

vi.mock("@/components/ActivityGrid", () => ({
  ActivityGrid: () => <div data-testid="activity-grid">Activity Grid</div>,
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

describe("Analytics Page - Snappy Loading & Prefetch", () => {
  const mockUser = {
    id: "u123",
    name: "Test User",
    totalPullRequests: 14,
    contributionData: [
      { date: "2026-09-25", contributionCount: 5 },
      { date: "2026-09-26", contributionCount: 3 },
      { date: "2026-09-27", contributionCount: 8 },
      { date: "2026-09-28", contributionCount: 12 },
    ],
    languages: [
      { name: "TypeScript", value: 60, color: "#3178c6" },
      { name: "Rust", value: 40, color: "#dea584" },
    ],
  };

  const mockRepos = [
    {
      id: 1,
      name: "fast-engine",
      description: "Low-latency streaming platform",
      stargazers_count: 42,
      forks_count: 9,
      language: "TypeScript",
      owner: { login: "testowner" },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(githubService, "getUserRepos").mockResolvedValue(mockRepos);
  });

  it("renders immediately from pre-cached ['userProfile', 'me'] without blocking", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Seed cache as usePrefetchAppData does on app startup
    queryClient.setQueryData(["userProfile", "me"], mockUser);
    queryClient.setQueryData(["userRepos", "fake_token"], mockRepos);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/analytics"]}>
          <Routes>
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify key metric labels render immediately
    expect(screen.getByText("Commits")).toBeDefined();
    expect(screen.getByText("Pull Requests")).toBeDefined();
    expect(screen.getByText("Active Days")).toBeDefined();
    expect(screen.getByText("Avg. Daily")).toBeDefined();
    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.getByText("Repositories")).toBeDefined();
  });

  it("displays skeleton loaders when cache is empty and data is fetching", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mock fetch that hangs or delays
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/analytics"]}>
          <Routes>
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Skeleton elements are present while loading
    const skeletons = container.querySelectorAll(".animate-pulse, [data-slot='skeleton'], .h-24, .h-64");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("switches to Repositories tab with instant cached repositories list", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(["userProfile", "me"], mockUser);
    queryClient.setQueryData(["userRepos", "fake_token"], mockRepos);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/analytics"]}>
          <Routes>
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const reposTab = screen.getByRole("tab", { name: /repositories/i });
    fireEvent.mouseDown(reposTab, { button: 0, ctrlKey: false });
    fireEvent.keyDown(reposTab, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("fast-engine")).toBeDefined();
      expect(screen.getByText("Low-latency streaming platform")).toBeDefined();
      expect(screen.getByText("42")).toBeDefined();
    });
  });
});
