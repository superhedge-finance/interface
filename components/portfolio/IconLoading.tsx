import * as React from "react"

const IconLoading = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 29.3 29.3"
    {...props}
  >
    <circle
      cx={14.8}
      cy={14.8}
      r={12.4}
      style={{
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 4.14,
        strokeMiterlimit: 8.28,
        strokeDasharray: "58.5279,23.6493",
      }}
    >
      <animateTransform
        attributeName="transform"
        dur="1.0s"
        keyTimes="0;1"
        repeatCount="indefinite"
        type="rotate"
        values="0 14.8 14.8;360 14.8 14.8"
      />
    </circle>
  </svg>
)
export default IconLoading