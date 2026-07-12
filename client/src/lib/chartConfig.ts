function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function getChartColors() {
  return {
    primary: cssVar('--chart-1'),
    teal: cssVar('--chart-2'),
    green: cssVar('--chart-3'),
    amber: cssVar('--chart-4'),
    red: cssVar('--chart-5'),
    grid: cssVar('--chart-grid'),
    text: cssVar('--chart-text'),
  }
}

export function getTooltipStyle() {
  return {
    contentStyle: {
      background: cssVar('--chart-tooltip-bg'),
      border: `1px solid ${cssVar('--chart-tooltip-border')}`,
      borderRadius: '8px',
      fontSize: '12px',
    },
    labelStyle: { color: cssVar('--text-primary'), fontSize: '12px' },
    itemStyle: { color: cssVar('--text-secondary'), fontSize: '11px' },
  }
}
