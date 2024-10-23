import * as fabric from "./fabric.6.3.0";

class CurvedText extends fabric.FabricObject {
  constructor(options) {
    super(options);
    this.diameter = options.diameter || 250;
    this.kerning = options.kerning || 0;
    this.text = options.text || "";
    this.flipped = options.flipped || false;
    this.fill = options.fill || "#000";
    this.fontFamily = options.fontFamily || "Times New Roman";
    this.fontSize = options.fontSize || 24;
    this.fontWeight = options.fontWeight || "normal";
    this.fontStyle = options.fontStyle || "";
    this.strokeStyle = options.strokeStyle || null;
    this.strokeWidth = options.strokeWidth || 0;
    this.lockUniScaling = true;
    this.type = "curved-text";
    this._updateCanvasDimensions();
  }

  setText(text) {
    this.set("text", text);
    this._updateCanvasDimensions();
    return this;
  }

  _updateCanvasDimensions() {
    const canvas = this.getCircularText();
    this._trimCanvas(canvas);
    this.set({ width: canvas.width, height: canvas.height });
  }

  _getFontDeclaration() {
    return [
      this.fontStyle,
      this.fontWeight,
      `${this.fontSize}px`,
      this.fontFamily,
    ].join(" ");
  }

  _trimCanvas(canvas) {
    try {
      var ctx = canvas.getContext("2d", { willReadFrequently: true }),
        w = canvas.width,
        h = canvas.height,
        pix = {
          x: [],
          y: [],
        },
        n,
        imageData = ctx.getImageData(0, 0, w, h),
        fn = function (a, b) {
          return a - b;
        };

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          if (imageData.data[(y * w + x) * 4 + 3] > 0) {
            pix.x.push(x);
            pix.y.push(y);
          }
        }
      }
      pix.x.sort(fn);
      pix.y.sort(fn);
      n = pix.x.length - 1;

      w = pix.x[n] - pix.x[0];
      h = pix.y[n] - pix.y[0];
      var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);

      canvas.width = w;
      canvas.height = h;
      ctx.putImageData(cut, 0, 0);
    } catch (error) {
      console.log(error);
    }
  }

  getCircularText() {
    var text = this.text,
      diameter = this.diameter,
      flipped = this.flipped,
      kerning = this.kerning,
      fill = this.fill,
      inwardFacing = true,
      startAngle = 0,
      canvas = fabric.util.createCanvasElement(),
      ctx = canvas.getContext("2d", { willReadFrequently: true }),
      cw, // character-width
      x, // iterator
      clockwise = -1; // draw clockwise for aligned right. Else Anticlockwise
    if (flipped) {
      startAngle = 180;
      inwardFacing = false;
    }

    startAngle *= Math.PI / 180; // convert to radians

    // Calc heigt of text in selected font:
    var d = document.createElement("div");
    d.style.position = "relative";
    d.style.zIndex = 1111111111111;
    d.style.fontFamily = this.fontFamily;
    d.style.whiteSpace = "nowrap";
    d.style.fontSize = this.fontSize + "px";
    d.style.fontWeight = this.fontWeight;
    d.style.fontStyle = this.fontStyle;
    d.textContent = text;
    document.body.appendChild(d);
    var textHeight = d.offsetHeight;
    document.body.removeChild(d);

    canvas.width = canvas.height = diameter;

    ctx.font = this._getFontDeclaration();

    // Reverse letters for center inward.
    if (inwardFacing) {
      text = text.split("").reverse().join("");
    }

    // Setup letters and positioning
    ctx.translate(diameter / 2, diameter / 2); // Move to center
    startAngle += Math.PI * !inwardFacing; // Rotate 180 if outward
    ctx.textBaseline = "middle"; // Ensure we draw in exact center
    ctx.textAlign = "center"; // Ensure we draw in exact center

    // rotate 50% of total angle for center alignment
    for (x = 0; x < text.length; x++) {
      cw = ctx.measureText(text[x]).width;
      startAngle +=
        ((cw + (x == text.length - 1 ? 0 : kerning)) /
          (diameter / 2 - textHeight) /
          2) *
        -clockwise;
    }

    // Phew... now rotate into final start position
    ctx.rotate(startAngle);

    // Now for the fun bit: draw, rotate, and repeat
    for (x = 0; x < text.length; x++) {
      cw = ctx.measureText(text[x]).width; // half letter
      // rotate half letter
      ctx.rotate((cw / 2 / (diameter / 2 - textHeight)) * clockwise);
      // Stroke
      if (this.strokeStyle && this.strokeWidth) {
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineWidth = this.strokeWidth;
        ctx.miterLimit = 2;
        ctx.strokeText(
          text[x],
          0,
          (inwardFacing ? 1 : -1) * (0 - diameter / 2 + textHeight / 2)
        );
      }

      // Actual text
      ctx.fillStyle = fill;
      ctx.fillText(
        text[x],
        0,
        (inwardFacing ? 1 : -1) * (0 - diameter / 2 + textHeight / 2)
      );

      ctx.rotate(
        ((cw / 2 + kerning) / (diameter / 2 - textHeight)) * clockwise
      ); // rotate half letter
    }
    return canvas;
  }

  _render(ctx) {
    const canvas = this.getCircularText();
    this._trimCanvas(canvas);
    this.set({ width: canvas.width, height: canvas.height });
    ctx.drawImage(
      canvas,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    this.setCoords();
  }

  toObject(propertiesToInclude) {
    return super.toObject(
      [
        "text",
        "diameter",
        "kerning",
        "flipped",
        "fill",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "strokeStyle",
        "strokeWidth",
        "textAlign",
        "isObjectcenter",
        "isTextwidthmdfy",
        "textWidth",
        "iswimdfybymcontrol",
        "minWidth",
        "isBold",
        "isUserfont",
      ].concat(propertiesToInclude)
    );
  }

  static fromObject(object, callback, forceAsync) {
    return new Promise((resolve) => {
      resolve(new CurvedText(object));
    });
  }
}
fabric.classRegistry.setClass(CurvedText, "curved-text");
fabric.classRegistry.setSVGClass(CurvedText, "curved-text");

function setupFabricCanvas() {
  console.log(fabric.version);
  const canvas = new fabric.Canvas("fabricCanvas", {
    width: 650,
    height: 800,
  });

  const objectRender = [
    {
      text: "aaaaaaaaaa",
      diameter: 544,
      kerning: 0,
      flipped: false,
      fill: "#000000",
      fontFamily: "Arial",
      fontSize: 93,
      fontWeight: "normal",
      fontStyle: "",
      strokeStyle: null,
      strokeWidth: 0,
      textAlign: "left",
      isObjectcenter: false,
      isTextwidthmdfy: true,
      textWidth: 650.501379506565,
      iswimdfybymcontrol: false,
      minWidth: 650.501379506565,
      isBold: true,
      isUserfont: false,
      type: "curved-text",
      version: "6.3.0",
      originX: "left",
      originY: "top",
      left: 93,
      top: 169,
      width: 493,
      height: 491,
      stroke: null,
      strokeDashArray: null,
      strokeLineCap: "butt",
      strokeDashOffset: 0,
      strokeLineJoin: "miter",
      strokeUniform: false,
      strokeMiterLimit: 4,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      shadow: {
        color: "#000000",
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
        nonScaling: false,
        type: "shadow",
      },
      visible: true,
      backgroundColor: "",
      fillRule: "nonzero",
      paintFirst: "fill",
      globalCompositeOperation: "source-over",
      skewX: 0,
      skewY: 0,
      customSourceType: "text_json",
      id: 651147,
      bg_image: "",
      texture_image: "",
      direction: "ltr",
      excludeFromExport: false,
      isLocked: false,
      index: 1,
      case: "upper",
      textLines: ["ADD HEADING TEXT"],
      __lineWidths: [648.9965808687526],
      objectCaching: false,
      font_name: "Bold",
      font_family_name: "Arial",
    },
  ];

  let FabricText = new CurvedText({
    diameter: 544,
    kerning: 0,
    flipped: false,
    fontSize: 100,
    fontFamily: "Arial",
    left: 93,
    top: 169,
    fill: "#000000",
    opacity: 1,
    angle: 0,
    hasRotatingPoint: true,
    objectCaching: false,
    dirty: true,
    text: "ADD HEADING TEXT",
    fontWeight: "bold",
    charSpacing: 0,
    type: "curve-text",
  });
  canvas.add(FabricText);
  canvas.renderAll();
  console.log(canvas.toJSON(), "-- JSON");
}
setupFabricCanvas();
