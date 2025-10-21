import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

function SoilAttentionChart({ data, color, widthByAttention, svgWidth = 800, svgHeight = 400, margin = { top: 40, right: 40, bottom: 40, left: 80 } }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !ref.current) return;

    ref.current.innerHTML = "";

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const x = d3
      .scaleBand()
      .domain(data[0] ? Object.keys(data[0].samples[0]) : [])
      .range([margin.left, svgWidth - margin.right]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.parcel))
      .range([margin.top, svgHeight - margin.bottom]);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left - 8},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .style("font", "12px sans-serif");

    svg
      .append("g")
      .attr("transform", `translate(0,${svgHeight - margin.bottom + 8})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font", "12px sans-serif")
      .style("text-anchor", "middle");

    const rowInner = y.bandwidth();
    const barHeight = Math.min(18, rowInner / 2.5);
    const overlapPad = 4;

    data.forEach((parcel) => {
      const samplesByParam = d3.group(parcel.samples, (s) => s.parameter);

      for (const [param, samples] of samplesByParam.entries()) {
        const cx = x(param) + x.bandwidth() / 2;

        samples.forEach((samp, i) => {
          const w = widthByAttention(samp.attention, samp.severity);
          const yTop =
            y(parcel.parcel) +
            rowInner / 2 -
            (samples.length * (barHeight + overlapPad) - overlapPad) / 2 +
            i * (barHeight + overlapPad);

          const leftX = cx - w;
          const rightX = cx;
          const singleW = w;

          let rectX = rightX;
          let rectW = singleW;

          if (samp.direction === "left") {
            rectX = cx - singleW;
          } else if (samp.direction === "center") {
            rectX = leftX;
            rectW = w * 2;
          }

          const g = svg.append("g");

          g.append("rect")
            .attr("x", rectX)
            .attr("y", yTop)
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", rectW)
            .attr("height", barHeight)
            .attr("fill", color[samp.attention] || "#999")
            .attr("opacity", 0.95)
            .attr("stroke-dasharray", "4,4")
            .append("title")
            .text(() => {
              const meta = [
                `Parcel: ${parcel.parcel}`,
                `Parameter: ${param}`,
                `Attention: ${samp.attention}`,
                samp.direction === "center"
                  ? "Bull's-eye (ideal)"
                  : `Direction: ${samp.direction}`,
                samp.date ? `Date: ${samp.date}` : null,
                samp.note ? `Note: ${samp.note}` : null,
              ].filter(Boolean);
              return meta.join("\n");
            });
        });
      }
    });
  }, [data, color, widthByAttention, svgWidth, svgHeight, margin]);

  return (
    <div
      style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}
    >
      <div ref={ref} />
    </div>
  );
}

export default SoilAttentionChart;
