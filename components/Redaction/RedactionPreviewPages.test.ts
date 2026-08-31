import {
  _clientRectToNormalizedBox,
  _getFitZoomPercent,
} from './RedactionPreviewPages';

describe(_clientRectToNormalizedBox, () => {
  it('converts a drag to normalized coordinates', () => {
    expect(
      _clientRectToNormalizedBox(
        { left: 100, top: 200, width: 1275, height: 1650 },
        { clientX: 355, clientY: 530 },
        { clientX: 865, clientY: 1190 }
      )
    ).toEqual({
      minX: 0.2,
      minY: 0.2,
      maxX: 0.6,
      maxY: 0.6,
    });
  });

  it('normalizes inverted drags on a landscape page', () => {
    expect(
      _clientRectToNormalizedBox(
        { left: 20, top: 40, width: 1020, height: 645 },
        { clientX: 734, clientY: 556 },
        { clientX: 224, clientY: 169 }
      )
    ).toEqual({
      minX: 0.2,
      minY: 0.2,
      maxX: 0.7,
      maxY: 0.8,
    });
  });

  it('clamps drags that extend beyond the image', () => {
    expect(
      _clientRectToNormalizedBox(
        { left: 0, top: 0, width: 100, height: 100 },
        { clientX: -10, clientY: 125 },
        { clientX: 60, clientY: 40 }
      )
    ).toEqual({
      minX: 0,
      minY: 0.4,
      maxX: 0.6,
      maxY: 1,
    });
  });
});

describe(_getFitZoomPercent, () => {
  it('fits to width above 100% when the pane is wider than the page', () => {
    expect(
      _getFitZoomPercent({
        type: 'fitToWidth',
        available: { width: 2000, height: 800 },
        pageSize: letterPageSize,
      })
    ).toBe(200);
  });

  it('fits to page above 100% when the pane is larger than the page', () => {
    expect(
      _getFitZoomPercent({
        type: 'fitToPage',
        available: { width: 2000, height: 3000 },
        pageSize: letterPageSize,
      })
    ).toBe(200);
  });

  it('floors the fit so rounding cannot overflow the viewport', () => {
    expect(
      _getFitZoomPercent({
        type: 'fitToWidth',
        available: { width: 999, height: 800 },
        pageSize: letterPageSize,
      })
    ).toBe(99);
  });

  it('clamps to the zoom input range', () => {
    expect(
      _getFitZoomPercent({
        type: 'fitToWidth',
        available: { width: 100_000, height: 800 },
        pageSize: letterPageSize,
      })
    ).toBe(2000);
    expect(
      _getFitZoomPercent({
        type: 'fitToWidth',
        available: { width: 1, height: 800 },
        pageSize: letterPageSize,
      })
    ).toBe(1);
  });

  const letterPageSize: { width: number; height: number } = {
    width: 1000,
    height: 1294,
  };
});
