import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotoDetail, { PhotoDetailData } from "../PhotoDetail";

describe("PhotoDetail", () => {
  const mockPhoto: PhotoDetailData = {
    id: 1,
    path: "/path/to/photo.jpg",
    thumbnailMedium: "/thumb.jpg",
    metadata: {
      captureDate: "2024-01-15T10:30:00Z",
      cameraMake: "Canon",
      cameraModel: "EOS R5",
      gpsCoordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      dimensions: {
        width: 4096,
        height: 2731,
      },
      fileSize: 5242880,
      fileModified: "2024-01-15T10:30:00Z",
    },
    tags: [
      { label: "landscape", confidence: 0.95 },
      { label: "nature", confidence: 0.87 },
    ],
  };

  it("renders photo metadata correctly", () => {
    render(<PhotoDetail photo={mockPhoto} />);

    expect(screen.getByText("Photo Information")).toBeInTheDocument();
    expect(screen.getByText("4096 × 2731")).toBeInTheDocument();
    expect(screen.getByText("5.0 MB")).toBeInTheDocument();
  });

  it("renders camera information when available", () => {
    render(<PhotoDetail photo={mockPhoto} />);

    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Canon")).toBeInTheDocument();
    expect(screen.getByText("EOS R5")).toBeInTheDocument();
  });

  it("renders GPS coordinates when available", () => {
    render(<PhotoDetail photo={mockPhoto} />);

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText(/37\.774900, -122\.419400/)).toBeInTheDocument();
  });

  it("renders AI-generated tags with confidence scores", () => {
    render(<PhotoDetail photo={mockPhoto} />);

    expect(screen.getByText("AI-Generated Tags")).toBeInTheDocument();
    expect(screen.getByText("landscape")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("nature")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("does not render camera section when camera info is missing", () => {
    const photoWithoutCamera = {
      ...mockPhoto,
      metadata: {
        ...mockPhoto.metadata,
        cameraMake: undefined,
        cameraModel: undefined,
      },
    };

    render(<PhotoDetail photo={photoWithoutCamera} />);
    expect(screen.queryByText("Camera")).not.toBeInTheDocument();
  });

  it("does not render location section when GPS is missing", () => {
    const photoWithoutGPS = {
      ...mockPhoto,
      metadata: {
        ...mockPhoto.metadata,
        gpsCoordinates: undefined,
      },
    };

    render(<PhotoDetail photo={photoWithoutGPS} />);
    expect(screen.queryByText("Location")).not.toBeInTheDocument();
  });
});
