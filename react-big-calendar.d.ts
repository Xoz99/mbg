declare module 'react-big-calendar' {
  import * as React from 'react';

  export type View = 'month' | 'week' | 'day' | 'agenda';

  export interface DateLocalizer {
    format(value: Date | number, format: string, culture?: string): string;
    parse(str: string, format: string, culture?: string): Date;
    startOf(date: Date, unit: string, culture?: string): Date;
    endOf(date: Date, unit: string, culture?: string): Date;
    range(start: Date, end: Date, unit: string, culture?: string): Date[];
    addHours(date: Date, hours: number): Date;
    addMinutes(date: Date, minutes: number): Date;
    addDays(date: Date, days: number): Date;
    addMonths(date: Date, months: number): Date;
    addYears(date: Date, years: number): Date;
    lt(a: Date, b: Date): boolean;
    lte(a: Date, b: Date): boolean;
    gt(a: Date, b: Date): boolean;
    gte(a: Date, b: Date): boolean;
    eq(a: Date, b: Date): boolean;
    inRange(date: Date, start: Date, end: Date, unit?: string): boolean;
  }

  export interface Event {
    id?: string | number;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    [key: string]: any;
  }

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: 'select' | 'click' | 'doubleClick';
  }

  export interface CalendarProps {
    events: Event[];
    localizer: DateLocalizer;
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    view?: View;
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    popup?: boolean;
    selectable?: boolean;
    components?: any;
    [key: string]: any;
  }

  export function dayjsLocalizer(dayjs: any): DateLocalizer;

  export const Calendar: React.ComponentType<CalendarProps>;
}
