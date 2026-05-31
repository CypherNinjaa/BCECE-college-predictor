import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "8px",
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        SWR
      </div>
    ),
    {
      ...size,
    }
  );
}
