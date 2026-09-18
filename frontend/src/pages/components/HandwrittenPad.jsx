import { useEffect, useRef, useState } from "react";
import { Button, Space, Typography, Slider } from "antd";
import { UndoOutlined, ClearOutlined } from "@ant-design/icons";

const { Text } = Typography;

// Fixed drawing surface size (CSS pixels). Kept 4:3-ish and wide enough to
// hold a full Rx worth of writing without scrolling. The canvas backing
// store is scaled up by devicePixelRatio so strokes stay crisp on
// high-DPI screens (Surface, iPad, most modern laptops) instead of looking
// soft the way an un-scaled canvas would.
const PAD_WIDTH = 760;
const PAD_HEIGHT = 420;

/**
 * A blank ink pad for handwriting a prescription with a stylus, finger, or
 * mouse, in place of picking medicines from the structured fields.
 *
 * Captures input via Pointer Events, which fire identically for mouse,
 * touch, and pen — so this needs no device-specific branching and works on
 * any touchscreen laptop, tablet, or interactive display without extra
 * drivers. A plain mouse works too, but is not legible for real writing;
 * this is meant for hardware with an actual touch/pen surface.
 *
 * Exports its content as a base64 PNG data URL via onChange, called after
 * every completed stroke and after Clear/Undo. `value` (if passed) seeds the
 * canvas with a previously saved drawing, for editing an existing
 * handwritten prescription.
 */
const HandwrittenPad = ({ value, onChange, disabled = false }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [penWidth, setPenWidth] = useState(2.2);

  // Set up the backing store once. devicePixelRatio scaling keeps lines
  // sharp; everything else (drawing coordinates) stays in CSS-pixel space
  // via the ctx.scale below, so the rest of this component never has to
  // think about DPR again.
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PAD_WIDTH * dpr;
    canvas.height = PAD_HEIGHT * dpr;
    canvas.style.width = `${PAD_WIDTH}px`;
    canvas.style.height = `${PAD_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctxRef.current = ctx;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAD_WIDTH, PAD_HEIGHT);

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, PAD_WIDTH, PAD_HEIGHT);
      img.src = value;
    }
    // Intentionally only on mount — re-running this would blank a drawing
    // in progress every time a prop unrelated to the image changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshotForUndo = () => {
    setHistoryStack((prev) => [...prev, canvasRef.current.toDataURL("image/png")].slice(-20));
  };

  const emitChange = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    onChange?.(isEmpty ? null : dataUrl);
  };

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.target.setPointerCapture(e.pointerId);
    snapshotForUndo();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
    setIsEmpty(false);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current || disabled) return;
    const ctx = ctxRef.current;
    const point = getPoint(e);
    // Pressure-sensitive pens report e.pressure (0-1); mouse/touch report 0
    // or 0.5, so fall back to the fixed pen width for those.
    const pressureWidth =
      e.pressure && e.pressure > 0 ? penWidth * (0.5 + e.pressure) : penWidth;

    ctx.lineWidth = pressureWidth;
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    emitChange();
  };

  const handleClear = () => {
    if (disabled) return;
    snapshotForUndo();
    const ctx = ctxRef.current;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
    setIsEmpty(true);
    onChange?.(null);
  };

  const handleUndo = () => {
    if (disabled || historyStack.length === 0) return;
    const prevState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    const ctx = ctxRef.current;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, PAD_WIDTH, PAD_HEIGHT);
      ctx.drawImage(img, 0, 0, PAD_WIDTH, PAD_HEIGHT);
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onChange?.(dataUrl);
    };
    img.src = prevState;
  };

  return (
    <div>
      <Space className="mb-2" wrap>
        <Button icon={<UndoOutlined />} onClick={handleUndo} disabled={disabled || historyStack.length === 0}>
          Undo
        </Button>
        <Button icon={<ClearOutlined />} danger onClick={handleClear} disabled={disabled}>
          Clear
        </Button>
        <Space align="center" className="ml-2">
          <Text type="secondary" className="text-xs">Pen width</Text>
          <Slider
            min={1}
            max={5}
            step={0.2}
            value={penWidth}
            onChange={setPenWidth}
            style={{ width: 100 }}
            disabled={disabled}
            tooltip={{ open: false }}
          />
        </Space>
      </Space>

      <div
        className="border border-gray-300 rounded overflow-hidden"
        style={{ width: PAD_WIDTH, maxWidth: "100%", touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ display: "block", cursor: disabled ? "not-allowed" : "crosshair", touchAction: "none" }}
        />
      </div>
      <Text type="secondary" className="text-xs">
        Write with a stylus, finger, or mouse. Works best on a touchscreen or pen-enabled device.
      </Text>
    </div>
  );
};

export default HandwrittenPad;
