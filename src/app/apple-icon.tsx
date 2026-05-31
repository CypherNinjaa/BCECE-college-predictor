import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "40px",
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: "-2px",
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
