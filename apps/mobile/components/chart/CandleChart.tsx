import { memo, useMemo } from 'react';
import Svg, {
    Defs,
    G,
    Line,
    LinearGradient,
    Path,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { formatAxisTime, priceTicks, viewport } from '@/lib/chart/geometry';
import { formatPrice } from '@/lib/format';
import type { Candle } from '@/store/candles';
import { Fonts, useTheme } from '@/theme';

export type ChartMode = 'line' | 'candles';

interface CandleChartProps {
    candles: Candle[];
    width: number;
    height: number;
    mode: ChartMode;
    intervalMs: number;
    slot?: number;
    endOffset?: number;
    axes?: boolean;
    reference?: number | null;
    crosshair?: number | null;
}

const AXIS_WIDTH = 64;
const TIME_HEIGHT = 20;
const PAD_Y = 14;
const TIME_LABELS = 4;

function CandleChartView({
    candles,
    width,
    height,
    mode,
    intervalMs,
    slot = 8,
    endOffset = 0,
    axes = false,
    reference = null,
    crosshair = null,
}: CandleChartProps) {
    const { colors } = useTheme();
    const plotWidth = axes ? width - AXIS_WIDTH : width;
    const plotHeight = axes ? height - TIME_HEIGHT : height;

    const view = useMemo(
        () => viewport(candles, plotWidth, plotHeight, slot, endOffset, PAD_Y, reference),
        [candles, plotWidth, plotHeight, slot, endOffset, reference],
    );

    const { visible, x, y } = view;
    const last = visible[visible.length - 1];
    const first = visible[0];
    const up = last && first ? last.close >= (reference ?? first.open) : true;
    const lineColor = up ? colors.profit : colors.loss;

    const linePath = useMemo(() => {
        if (mode !== 'line' || visible.length < 2) return null;
        const d = visible
            .map((c, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(c.close).toFixed(1)}`)
            .join(' ');
        const area = `${d} L${x(visible.length - 1).toFixed(1)},${plotHeight} L${x(0).toFixed(1)},${plotHeight} Z`;
        return { d, area };
    }, [mode, visible, x, y, plotHeight]);

    const ticks = axes ? priceTicks(view.min, view.max) : [];
    const timeEvery = Math.max(1, Math.floor(visible.length / TIME_LABELS));
    const bodyWidth = Math.max(1, slot * 0.68);
    const hover = crosshair !== null ? visible[crosshair] : undefined;
    const labelFont = { fontFamily: Fonts.medium, fontSize: 10 };

    return (
        <Svg width={width} height={height}>
            <Defs>
                <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
                    <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                </LinearGradient>
            </Defs>

            {ticks.map((t) => (
                <G key={t}>
                    <Line
                        x1={0}
                        x2={plotWidth}
                        y1={y(t)}
                        y2={y(t)}
                        stroke={colors.border}
                        strokeWidth={1}
                    />
                    <SvgText
                        x={plotWidth + 8}
                        y={y(t) + 3.5}
                        fill={colors.mutedForeground}
                        {...labelFont}
                    >
                        {formatPrice(t)}
                    </SvgText>
                </G>
            ))}

            {reference !== null && endOffset === 0 ? (
                <Line
                    x1={0}
                    x2={plotWidth}
                    y1={y(reference)}
                    y2={y(reference)}
                    stroke={colors.mutedForeground}
                    strokeOpacity={0.6}
                    strokeDasharray="4 5"
                    strokeWidth={1}
                />
            ) : null}

            {linePath ? (
                <>
                    <Path d={linePath.area} fill="url(#chartFill)" />
                    <Path
                        d={linePath.d}
                        stroke={lineColor}
                        strokeWidth={1.8}
                        fill="none"
                        strokeLinejoin="round"
                    />
                </>
            ) : null}

            {mode === 'candles'
                ? visible.map((c, i) => {
                      const color = c.close >= c.open ? colors.profit : colors.loss;
                      const top = y(Math.max(c.open, c.close));
                      const bottom = y(Math.min(c.open, c.close));
                      return (
                          <G key={c.time}>
                              <Line
                                  x1={x(i)}
                                  x2={x(i)}
                                  y1={y(c.high)}
                                  y2={y(c.low)}
                                  stroke={color}
                                  strokeWidth={1}
                              />
                              <Rect
                                  x={x(i) - bodyWidth / 2}
                                  y={top}
                                  width={bodyWidth}
                                  height={Math.max(1, bottom - top)}
                                  fill={color}
                                  rx={1}
                              />
                          </G>
                      );
                  })
                : null}

            {axes && last && endOffset === 0 ? (
                <G>
                    <Line
                        x1={0}
                        x2={plotWidth}
                        y1={y(last.close)}
                        y2={y(last.close)}
                        stroke={lineColor}
                        strokeWidth={1}
                    />
                    <Rect
                        x={plotWidth + 2}
                        y={y(last.close) - 9}
                        width={AXIS_WIDTH - 4}
                        height={18}
                        rx={4}
                        fill={lineColor}
                    />
                    <SvgText
                        x={plotWidth + 8}
                        y={y(last.close) + 3.5}
                        fill="#ffffff"
                        {...labelFont}
                    >
                        {formatPrice(last.close)}
                    </SvgText>
                </G>
            ) : null}

            {axes
                ? visible.map((c, i) =>
                      i % timeEvery === 0 && i > 0 ? (
                          <SvgText
                              key={`t${c.time}`}
                              x={x(i)}
                              y={height - 5}
                              fill={colors.mutedForeground}
                              textAnchor="middle"
                              {...labelFont}
                          >
                              {formatAxisTime(c.time, intervalMs)}
                          </SvgText>
                      ) : null,
                  )
                : null}

            {hover && crosshair !== null ? (
                <G>
                    <Line
                        x1={x(crosshair)}
                        x2={x(crosshair)}
                        y1={0}
                        y2={plotHeight}
                        stroke={colors.foreground}
                        strokeOpacity={0.5}
                        strokeDasharray="3 3"
                        strokeWidth={1}
                    />
                    <Line
                        x1={0}
                        x2={plotWidth}
                        y1={y(hover.close)}
                        y2={y(hover.close)}
                        stroke={colors.foreground}
                        strokeOpacity={0.5}
                        strokeDasharray="3 3"
                        strokeWidth={1}
                    />
                </G>
            ) : null}
        </Svg>
    );
}

export const CandleChart = memo(CandleChartView);

export const CHART_AXIS_WIDTH = AXIS_WIDTH;
