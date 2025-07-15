declare module 'react-calendar-heatmap' {
  import React from 'react';

  export interface ReactCalendarHeatmapValue<T = any> {
    date: string | Date;
    count?: number;
    [key: string]: any;
  }

  export interface TooltipDataAttrs {
    [key: string]: string;
  }

  export interface Props<T = any> {
    values: ReactCalendarHeatmapValue<T>[];
    startDate: string | Date;
    endDate: string | Date;
    classForValue?: (value: ReactCalendarHeatmapValue<T> | null) => string;
    titleForValue?: (value: ReactCalendarHeatmapValue<T> | null) => string;
    tooltipDataAttrs?: 
      | TooltipDataAttrs 
      | ((value: ReactCalendarHeatmapValue<T> | null) => TooltipDataAttrs);
    onClick?: (value: ReactCalendarHeatmapValue<T> | null) => void;
    onMouseOver?: (event: React.MouseEvent, value: ReactCalendarHeatmapValue<T> | null) => void;
    onMouseLeave?: (event: React.MouseEvent, value: ReactCalendarHeatmapValue<T> | null) => void;
    transformDayElement?: (element: React.ReactElement, value: ReactCalendarHeatmapValue<T> | null, index: number) => React.ReactElement;
    horizontal?: boolean;
    showMonthLabels?: boolean;
    showWeekdayLabels?: boolean;
    showOutOfRangeDays?: boolean;
    weekdayLabels?: string[];
    monthLabels?: string[];
    gutterSize?: number;
    squareSize?: number;
  }

  export default class ReactCalendarHeatmap<T = any> extends React.Component<Props<T>> {}
} 