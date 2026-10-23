import { getRedactionCropWindow, mapCropBoxToPage } from './redactionBoxCrop';

describe(getRedactionCropWindow, () => {
  it('scales a small box so its short side meets the Box minimum', () => {
    // A 150 DPI letter page. The box is about 25 by 33 px, so the 25% padded
    // crop is scaled up by one factor to reach 280 px on its short side.
    const window = getRedactionCropWindow({
      box: { minX: 0.5, minY: 0.5, maxX: 0.52, maxY: 0.52 },
      pageWidth: 1275,
      pageHeight: 1650,
      paddingScale: 1,
    });

    expect(window).toEqual({
      left: 631,
      top: 816,
      width: 39,
      height: 51,
      outputWidth: 280,
      outputHeight: 366,
    });
  });

  it('keeps a thin box in its shape when scaling it up', () => {
    // An 80 by 20 px box on a 1000 px page pads to 120 by 30 px, then scales
    // by 9.33 so the short side is 280 px.
    const window = getRedactionCropWindow({
      box: { minX: 0.5, minY: 0.5, maxX: 0.58, maxY: 0.52 },
      pageWidth: 1000,
      pageHeight: 1000,
      paddingScale: 1,
    });

    expect(window).toMatchObject({
      width: 120,
      height: 30,
      outputWidth: 1120,
      outputHeight: 280,
    });
  });

  it('scales a very wide box per side so it stays under the Box maximum', () => {
    // A 300 by 20 px box pads to 450 by 30 px. Scaling it uniformly to 280 px
    // tall would make it 4200 px wide, so only the height is scaled.
    const window = getRedactionCropWindow({
      box: { minX: 0.5, minY: 0.5, maxX: 0.8, maxY: 0.52 },
      pageWidth: 1000,
      pageHeight: 1000,
      paddingScale: 1,
    });

    expect(window).toMatchObject({
      width: 450,
      height: 30,
      outputWidth: 450,
      outputHeight: 280,
    });
  });

  it('returns null when the crop would be larger than the Box maximum', () => {
    const window = getRedactionCropWindow({
      box: { minX: 0, minY: 0, maxX: 0.9, maxY: 0.1 },
      pageWidth: 3000,
      pageHeight: 3300,
      paddingScale: 1,
    });

    expect(window).toBeNull();
  });
});

describe(mapCropBoxToPage, () => {
  it('maps crop-relative edges to normalized page coordinates', () => {
    const box = mapCropBoxToPage({
      cropBox: { top: 0, bottom: 0.5, left: 0.5, right: 1 },
      window: {
        left: 100,
        top: 200,
        width: 400,
        height: 300,
        outputWidth: 400,
        outputHeight: 300,
      },
      pageWidth: 1000,
      pageHeight: 1000,
    });

    expect(box).toEqual({ minX: 0.3, minY: 0.2, maxX: 0.5, maxY: 0.35 });
  });
});
