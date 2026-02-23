import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import FormatSelection from '../FormatSelection';
import type { FormatConfig } from '@/lib/types';

describe('FormatSelection Component', () => {
  const defaultConfig: FormatConfig = {
    imageFormats: ['jpg', 'jpeg', 'png', 'heic'],
    videoFormats: ['mp4', 'mov', 'avi'],
  };

  describe('Loading format configuration', () => {
    it('should display current image formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Check that selected formats are checked
      const jpgCheckbox = screen.getByRole('checkbox', { name: /\.jpg/i });
      const pngCheckbox = screen.getByRole('checkbox', { name: /\.png/i });

      expect(jpgCheckbox).toBeChecked();
      expect(pngCheckbox).toBeChecked();
    });

    it('should display current video formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Check that selected formats are checked
      const mp4Checkbox = screen.getByRole('checkbox', { name: /\.mp4/i });
      const movCheckbox = screen.getByRole('checkbox', { name: /\.mov/i });

      expect(mp4Checkbox).toBeChecked();
      expect(movCheckbox).toBeChecked();
    });

    it('should display format counts correctly', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      expect(screen.getByText(/4 of 13 image formats selected/i)).toBeInTheDocument();
      expect(screen.getByText(/3 of 11 video formats selected/i)).toBeInTheDocument();
    });

    it('should update when currentConfig prop changes', async () => {
      const onConfigChange = vi.fn();
      const { rerender } = render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const newConfig: FormatConfig = {
        imageFormats: ['jpg', 'png'],
        videoFormats: ['mp4'],
      };

      rerender(
        <FormatSelection
          currentConfig={newConfig}
          onConfigChange={onConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 of 13 image formats selected/i)).toBeInTheDocument();
        expect(screen.getByText(/1 of 11 video formats selected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Saving format configuration changes', () => {
    it('should call onConfigChange when image format is toggled', async () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Toggle off an image format
      const heicCheckbox = screen.getByRole('checkbox', { name: /\.heic/i });
      fireEvent.click(heicCheckbox);

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.arrayContaining(['jpg', 'jpeg', 'png']),
          videoFormats: expect.arrayContaining(['mp4', 'mov', 'avi']),
        });
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.not.arrayContaining(['heic']),
          videoFormats: expect.any(Array),
        });
      });
    });

    it('should call onConfigChange when video format is toggled', async () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Toggle on a video format
      const mkvCheckbox = screen.getByRole('checkbox', { name: /\.mkv/i });
      fireEvent.click(mkvCheckbox);

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.any(Array),
          videoFormats: expect.arrayContaining(['mp4', 'mov', 'avi', 'mkv']),
        });
      });
    });

    it('should call onConfigChange when Select All Images is clicked', async () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const selectAllButton = screen.getAllByText('Select All')[0];
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.arrayContaining([
            'jpg', 'jpeg', 'png', 'heic', 'raw', 'cr2', 'nef', 'dng',
            'arw', 'webp', 'gif', 'bmp', 'tiff'
          ]),
          videoFormats: expect.any(Array),
        });
      });
    });

    it('should call onConfigChange when Select All Videos is clicked', async () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const selectAllButton = screen.getAllByText('Select All')[1];
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.any(Array),
          videoFormats: expect.arrayContaining([
            'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
            'm4v', 'mpg', 'mpeg', '3gp'
          ]),
        });
      });
    });

    it('should call onConfigChange when Deselect All Images is clicked', async () => {
      const onConfigChange = vi.fn();
      const fullConfig: FormatConfig = {
        imageFormats: ['jpg', 'jpeg', 'png', 'heic', 'raw'],
        videoFormats: ['mp4', 'mov'],
      };

      render(
        <FormatSelection
          currentConfig={fullConfig}
          onConfigChange={onConfigChange}
        />
      );

      const deselectAllButton = screen.getAllByText('Deselect All')[0];
      fireEvent.click(deselectAllButton);

      await waitFor(() => {
        // Should keep at least one format (the first one)
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: ['jpg'],
          videoFormats: expect.any(Array),
        });
      });
    });

    it('should call onConfigChange when Deselect All Videos is clicked', async () => {
      const onConfigChange = vi.fn();
      const fullConfig: FormatConfig = {
        imageFormats: ['jpg', 'png'],
        videoFormats: ['mp4', 'mov', 'avi', 'mkv'],
      };

      render(
        <FormatSelection
          currentConfig={fullConfig}
          onConfigChange={onConfigChange}
        />
      );

      const deselectAllButton = screen.getAllByText('Deselect All')[1];
      fireEvent.click(deselectAllButton);

      await waitFor(() => {
        // Should keep at least one format (the first one)
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: expect.any(Array),
          videoFormats: ['mp4'],
        });
      });
    });
  });

  describe('Validation of format selections', () => {
    it('should prevent deselecting the last image format', () => {
      const onConfigChange = vi.fn();
      const singleImageConfig: FormatConfig = {
        imageFormats: ['jpg'],
        videoFormats: ['mp4', 'mov'],
      };

      render(
        <FormatSelection
          currentConfig={singleImageConfig}
          onConfigChange={onConfigChange}
        />
      );

      const jpgCheckbox = screen.getByRole('checkbox', { name: /\.jpg/i });

      // Checkbox should be disabled
      expect(jpgCheckbox).toBeDisabled();

      // Try to click it anyway
      fireEvent.click(jpgCheckbox);

      // onConfigChange should not be called with empty image formats
      expect(onConfigChange).not.toHaveBeenCalledWith({
        imageFormats: [],
        videoFormats: expect.any(Array),
      });
    });

    it('should prevent deselecting the last video format', () => {
      const onConfigChange = vi.fn();
      const singleVideoConfig: FormatConfig = {
        imageFormats: ['jpg', 'png'],
        videoFormats: ['mp4'],
      };

      render(
        <FormatSelection
          currentConfig={singleVideoConfig}
          onConfigChange={onConfigChange}
        />
      );

      const mp4Checkbox = screen.getByRole('checkbox', { name: /\.mp4/i });

      // Checkbox should be disabled
      expect(mp4Checkbox).toBeDisabled();

      // Try to click it anyway
      fireEvent.click(mp4Checkbox);

      // onConfigChange should not be called with empty video formats
      expect(onConfigChange).not.toHaveBeenCalledWith({
        imageFormats: expect.any(Array),
        videoFormats: [],
      });
    });

    it('should allow toggling formats when more than one is selected', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // All checkboxes should be enabled when multiple formats are selected
      const jpgCheckbox = screen.getByRole('checkbox', { name: /\.jpg/i });
      const pngCheckbox = screen.getByRole('checkbox', { name: /\.png/i });

      expect(jpgCheckbox).not.toBeDisabled();
      expect(pngCheckbox).not.toBeDisabled();
    });

    it('should display validation message for image formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      expect(screen.getByText(/At least one image format must be selected/i)).toBeInTheDocument();
    });

    it('should display validation message for video formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      expect(screen.getByText(/At least one video format must be selected/i)).toBeInTheDocument();
    });

    it('should show format examples', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Check for image format examples
      expect(screen.getByText(/\.jpg, \.jpeg, \.png, \.heic, \.raw/i)).toBeInTheDocument();

      // Check for video format examples
      expect(screen.getByText(/\.mp4, \.mov, \.avi, \.mkv/i)).toBeInTheDocument();
    });

    it('should maintain at least one format when toggling multiple times', async () => {
      const onConfigChange = vi.fn();
      const twoFormatConfig: FormatConfig = {
        imageFormats: ['jpg', 'png'],
        videoFormats: ['mp4', 'mov'],
      };

      const { rerender } = render(
        <FormatSelection
          currentConfig={twoFormatConfig}
          onConfigChange={onConfigChange}
        />
      );

      // Deselect jpg
      const jpgCheckbox = screen.getByRole('checkbox', { name: /\.jpg/i });
      fireEvent.click(jpgCheckbox);

      await waitFor(() => {
        expect(onConfigChange).toHaveBeenCalledWith({
          imageFormats: ['png'],
          videoFormats: expect.any(Array),
        });
      });

      // Now rerender with png as the only format
      rerender(
        <FormatSelection
          currentConfig={{ imageFormats: ['png'], videoFormats: ['mp4', 'mov'] }}
          onConfigChange={onConfigChange}
        />
      );

      // png should now be disabled since it's the last one
      const pngCheckbox = screen.getByRole('checkbox', { name: /\.png/i });
      expect(pngCheckbox).toBeDisabled();
    });
  });

  describe('UI rendering', () => {
    it('should render all available image formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const expectedFormats = [
        'jpg', 'jpeg', 'png', 'heic', 'raw', 'cr2', 'nef', 'dng',
        'arw', 'webp', 'gif', 'bmp', 'tiff'
      ];

      expectedFormats.forEach(format => {
        expect(screen.getByRole('checkbox', { name: new RegExp(`\\.${format}`, 'i') })).toBeInTheDocument();
      });
    });

    it('should render all available video formats', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const expectedFormats = [
        'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
        'm4v', 'mpg', 'mpeg', '3gp'
      ];

      expectedFormats.forEach(format => {
        expect(screen.getByRole('checkbox', { name: new RegExp(`\\.${format}`, 'i') })).toBeInTheDocument();
      });
    });

    it('should render section headers', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      expect(screen.getByText('Image Formats')).toBeInTheDocument();
      expect(screen.getByText('Video Formats')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      const onConfigChange = vi.fn();
      render(
        <FormatSelection
          currentConfig={defaultConfig}
          onConfigChange={onConfigChange}
        />
      );

      const selectAllButtons = screen.getAllByText('Select All');
      const deselectAllButtons = screen.getAllByText('Deselect All');

      expect(selectAllButtons).toHaveLength(2); // One for images, one for videos
      expect(deselectAllButtons).toHaveLength(2); // One for images, one for videos
    });
  });
});
