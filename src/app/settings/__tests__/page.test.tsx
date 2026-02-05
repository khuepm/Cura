import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import SettingsPage from '../page';
import { useSettings } from '@/lib/hooks/useSettings';

// Mock the useSettings hook
vi.mock('@/lib/hooks/useSettings');

// Mock FormatSelection component
vi.mock('@/components/FormatSelection', () => ({
  default: ({ currentConfig, onConfigChange }: any) => {
    return (
      <div data-testid="format-selection">
        <div>Image Formats: {currentConfig.imageFormats.join(', ')}</div>
        <div>Video Formats: {currentConfig.videoFormats.join(', ')}</div>
        <button
          onClick={() =>
            onConfigChange({
              imageFormats: ['jpg', 'png'],
              videoFormats: ['mp4'],
            })
          }
        >
          Change Formats
        </button>
      </div>
    );
  },
}));

describe('SettingsPage - Format Configuration', () => {
  const mockSaveSettings = vi.fn();
  const mockSettings = {
    thumbnailCachePath: '/test/path',
    aiModel: 'mobilenet' as const,
    syncConfig: {
      enabled: false,
      autoSync: false,
      syncInterval: 60,
      uploadQuality: 'high' as const,
      excludePatterns: [],
    },
    formatConfig: {
      imageFormats: ['jpg', 'jpeg', 'png', 'heic'],
      videoFormats: ['mp4', 'mov', 'avi'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSettings).mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null,
      saveSettings: mockSaveSettings,
      refreshSettings: vi.fn(),
    });
  });

  it('should load current format configuration on page load', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('format-selection')).toBeInTheDocument();
    });

    expect(screen.getByText(/Image Formats: jpg, jpeg, png, heic/)).toBeInTheDocument();
    expect(screen.getByText(/Video Formats: mp4, mov, avi/)).toBeInTheDocument();
  });

  it('should save format configuration changes', async () => {
    mockSaveSettings.mockResolvedValue(undefined);

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('format-selection')).toBeInTheDocument();
    });

    // Change formats
    const changeButton = screen.getByText('Change Formats');
    fireEvent.click(changeButton);

    // Wait for changes to be detected
    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    // Click save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          formatConfig: {
            imageFormats: ['jpg', 'png'],
            videoFormats: ['mp4'],
          },
        })
      );
    });
  });

  it('should display success message after saving', async () => {
    mockSaveSettings.mockResolvedValue(undefined);

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('format-selection')).toBeInTheDocument();
    });

    // Change formats
    const changeButton = screen.getByText('Change Formats');
    fireEvent.click(changeButton);

    // Wait for changes to be detected and save
    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });
  });

  it('should display error message on save failure', async () => {
    const errorMessage = 'Failed to save settings';
    mockSaveSettings.mockRejectedValue(new Error(errorMessage));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('format-selection')).toBeInTheDocument();
    });

    // Change formats
    const changeButton = screen.getByText('Change Formats');
    fireEvent.click(changeButton);

    // Wait for changes to be detected and save
    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show loading state while settings are loading', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      loading: true,
      error: null,
      saveSettings: mockSaveSettings,
      refreshSettings: vi.fn(),
    });

    render(<SettingsPage />);

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('should show error state when settings fail to load', () => {
    const errorMessage = 'Failed to load settings';
    vi.mocked(useSettings).mockReturnValue({
      settings: null,
      loading: false,
      error: errorMessage,
      saveSettings: mockSaveSettings,
      refreshSettings: vi.fn(),
    });

    render(<SettingsPage />);

    expect(screen.getByText(`Failed to load settings: ${errorMessage}`)).toBeInTheDocument();
  });
});
