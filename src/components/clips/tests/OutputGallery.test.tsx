import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OutputGallery from '../OutputGallery';

describe('OutputGallery', () => {
  it('filters transient/duplicate urls for video navigation counts', () => {
    render(
      <OutputGallery
        fileUrls={[
          '/media/render-a.mp4',
          'waiting',
          '/media/render-a.mp4',
          'pending',
          '/media/render-b.mp4',
        ]}
        clipStyle="standard"
      />
    );

    expect(screen.getByText(/Videos \(1\/2\)/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Videos \(2\/2\)/i)).toBeInTheDocument();
  });
});
