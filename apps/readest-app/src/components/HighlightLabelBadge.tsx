import React from 'react';
import { getHighlightLabelCenterStyle } from '@/app/reader/utils/annotatorUtil';

interface HighlightLabelBadgeProps {
  label: string;
  color: string;
  fontSize?: number;
}

const HighlightLabelBadge: React.FC<HighlightLabelBadgeProps> = ({ label, color, fontSize }) => (
  <span
    aria-hidden='true'
    className='pointer-events-none text-xs leading-none font-bold'
    style={{ color, fontSize, textBox: getHighlightLabelCenterStyle(label) }}
  >
    {label}
  </span>
);

export default HighlightLabelBadge;
