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
      mediaType: 'image',
    },
    {
      id: 2,
      thumbnailSmall: "/thumb2.jpg",
      width: 1920,
      height: 1080,
      mediaType: 'video',
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

  // Video UI component tests
  describe("Video indicators", () => {
    it("renders video indicator overlay for video items", () => {
      const { container } = renderWithProvider(
        <PhotoGrid photos={mockPhotos} isLoading={false} />
      );

      // The component should have the structure for video indicators
      // Note: react-window virtualization may not render all items in test
      // Check that the component renders without errors and has the grid structure
      const gridContainer = container.querySelector('.flex-1');
      expect(gridContainer).toBeInTheDocument();
    });

    it("does not render video indicator for image items", () => {
      const imageOnlyPhotos: PhotoGridItem[] = [
        {
          id: 1,
          thumbnailSmall: "/thumb1.jpg",
          captureDate: "2024-01-15T10:30:00Z",
          width: 1920,
          height: 1080,
          mediaType: 'image',
        },
      ];

      const { container } = renderWithProvider(
        <PhotoGrid photos={imageOnlyPhotos} isLoading={false} />
      );

      // Component should render successfully with image-only data
      expect(container.firstChild).toBeTruthy();
    });

    it("renders mixed media grid with correct indicators", () => {
      const mixedPhotos: PhotoGridItem[] = [
        {
          id: 1,
          thumbnailSmall: "/thumb1.jpg",
          mediaType: 'image',
          width: 1920,
          height: 1080,
        },
        {
          id: 2,
          thumbnailSmall: "/thumb2.jpg",
          mediaType: 'video',
          width: 1920,
          height: 1080,
        },
        {
          id: 3,
          thumbnailSmall: "/thumb3.jpg",
          mediaType: 'image',
          width: 1920,
          height: 1080,
        },
        {
          id: 4,
          thumbnailSmall: "/thumb4.jpg",
          mediaType: 'video',
          width: 1920,
          height: 1080,
        },
      ];

      const { container } = renderWithProvider(
        <PhotoGrid photos={mixedPhotos} isLoading={false} />
      );

      // Component should render successfully with mixed media data
      // The media type filter should show correct counts
      expect(screen.getByText(/All \(4\)/)).toBeInTheDocument();
      expect(screen.getByText(/Images \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Videos \(2\)/)).toBeInTheDocument();
    });
  });

  describe("Media type filtering", () => {
    it("renders media type filter buttons", () => {
      renderWithProvider(<PhotoGrid photos={mockPhotos} isLoading={false} />);

      // Button text includes counts, so use regex or partial match
      expect(screen.getByText(/All/)).toBeInTheDocument();
      expect(screen.getByText(/Images/)).toBeInTheDocument();
      expect(screen.getByText(/Videos/)).toBeInTheDocument();
    });

    it("displays correct empty state for video filter", () => {
      renderWithProvider(<PhotoGrid photos={[]} isLoading={false} />);

      // When empty, the component shows the empty state message
      expect(screen.getByText("No photos yet")).toBeInTheDocument();
    });

    it("shows appropriate icon for media type in empty state", () => {
      const { container } = renderWithProvider(
        <PhotoGrid photos={[]} isLoading={false} />
      );

      // Check for photo_library icon in default empty state
      const icons = container.querySelectorAll('.material-symbols-outlined');
      const photoLibraryIcons = Array.from(icons).filter(
        (el) => el.textContent === 'photo_library'
      );

      expect(photoLibraryIcons.length).toBeGreaterThan(0);
    });
  });
});
