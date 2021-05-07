import { ElkLabel } from "elkjs/lib/elk.bundled";
import { Text } from "react-konva";
import React from "react";

import { FONT_SIZE, LINE_HEIGHT } from "../font";

export const Label = ({ label }: { label: ElkLabel }): JSX.Element => (
  <Text
    x={label.x}
    y={label.y}
    width={label.width}
    height={label.height}

    text={label.text}
    fontSize={FONT_SIZE}
    lineHeight={LINE_HEIGHT}
    align="center"
    // verticalAlign="middle"
  />
)
