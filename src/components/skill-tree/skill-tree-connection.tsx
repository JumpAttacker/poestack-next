import { memo } from "react";

/**
 * Props for the {@link SkillTreeConnection} component.
 */
export type SkillTreeConnectionProps = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  orbit: {
    radius: number,
    fromIndex: number,
    toIndex: number
  };
  skillsInOrbit: number;
  sweep: number;
  strokeColor: string;
  from: number;
  to: number;
  curved: boolean;
}

/**
 * Draw a connection between 2 nodes on the skill tree. 
 */
export function SkillTreeConnection({
  fromX,
  fromY,
  toX,
  toY,
  orbit,
  sweep,
  strokeColor,
  from,
  to,
  curved
}: SkillTreeConnectionProps) {
  if (curved) {
    return (
      <path
        stroke={strokeColor}
        strokeWidth={6}
        d={`M ${fromX} ${fromY} A ${orbit.radius} ${orbit.radius}, 0, 0 ${sweep}, ${toX} ${toY}`}
        fill="transparent"
        data-from={from}
        data-to={to}
      />
    );
  } else {
    return (
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={ strokeColor }
        strokeWidth={6}
        data-from={from}
        data-to={to}
      />
    );
  }
}

export const MemoisedSkillTreeConnection = memo(SkillTreeConnection);
