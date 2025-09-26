'use client';

import * as React from 'react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  TooltipProps,
  LegendProps 
} from 'recharts';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: string;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          data-chart={chartId}
          ref={ref}
          className={cn(
            "flex aspect-video justify-center text-xs",
            className
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <ResponsiveContainer width="100%" height="100%">
            {React.cloneElement(children)}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = 'ChartContainer';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  );
};

// Simplified Tooltip component
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value: any;
    name: string;
    dataKey: string;
    color: string;
    payload: any;
  }>;
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}

const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({
  active,
  payload,
  label,
  formatter
}) => {
  const { config } = useChart();

  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      {label && <div className="font-medium mb-2">{label}</div>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const itemConfig = config[entry.dataKey] || config[entry.name];
          let displayValue = entry.value;
          let displayName = itemConfig?.label || entry.name;

          if (formatter) {
            const formatted = formatter(entry.value, entry.name);
            displayValue = formatted[0];
            displayName = formatted[1];
          }

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{displayName}</span>
              </div>
              <span className="font-medium">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simplified Legend component
interface ChartLegendContentProps {
  payload?: Array<{
    value: string;
    dataKey: string;
    color: string;
  }>;
}

const ChartLegendContent: React.FC<ChartLegendContentProps> = ({ payload }) => {
  const { config } = useChart();

  if (!payload || !payload.length) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 pt-3">
      {payload.map((entry, index) => {
        const itemConfig = config[entry.dataKey];
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{itemConfig?.label || entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export {
  ChartContainer,
  Tooltip as ChartTooltip,
  ChartTooltipContent,
  Legend as ChartLegend,
  ChartLegendContent,
  ChartStyle,
};