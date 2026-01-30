import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotoGrid, { PhotoGridItem } from "../PhotoGrid";
import { AppProvider } from "@/lib/store/AppContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Helper to render with AppProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>);
};

describe("PhotoGrid", () => {
  const mockPhotos: PhotoGridItem[] = [
    {
      id: 1,
      thumbnailSmall: "/thumb1.jpg",
      captureDate: "2024-01-15T10:30:00Z",
      width: 1920,
      height: 1080,
    },
    {
      id: 2,
      thumbnailSmall: "/thumb2.jpg",
      width: 1920,
      height: 1080,
    },
  ];

  it("renders empty state when no photos provided", () => {
    renderWithProvider(<PhotoGrid photos={[]} isLoading={false} />);
    expect(screen.getByText("No photos yet")).toBeInTheDocument();
    expect(
      screen.getByText("Select a folder to start importing your photos")
    ).toBeInTheDocument();
  });

  it("renders skeleton loader when loading", () => {
    renderWithProvider(<PhotoGrid photos={[]} isLoading={true} />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders photos when provided", () => {
    const { container } = renderWithProvider(<PhotoGrid photos={mockPhotos} isLoading={false} />);
    // Component should render without errors
    expect(container.firstChild).toBeTruthy();
  });
});
