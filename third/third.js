// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// const svg = d3.select("#chart"),
//       width = +svg.attr("width"),
//       height = +svg.attr("height"),
//       margin = { top: 30, right: 30, bottom: 50, left: 60 },
//       innerWidth = width - margin.left - margin.right,
//       innerHeight = height - margin.top - margin.bottom;

// const chart = svg.append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

// const xScale = d3.scaleTime().range([0, innerWidth]);
// const yScale = d3.scaleLinear().range([innerHeight, 0]);

// const xAxis = chart.append("g").attr("transform", `translate(0,${innerHeight})`);
// const yAxis = chart.append("g");

// let fullData = [];
// let selectedEye = "right";  // default

// d3.csv("../data/participants_info.csv", d => ({
//   date: d3.timeParse("%Y-%m-%d")(d.date),
//   visual_acuity_right: +d.va_re_logMar,
//   visual_acuity_left: +d.va_le_logMar,
//   diagnosis_1: d.diagnosis1,
//   diagnosis_2: d.diagnosis2,
//   diagnosis_3: d.diagnosis3
// })).then(data => {
//   fullData = data;

//   // Collect all unique diseases across all diagnosis fields
//   const diseaseCounts = {};
// data.forEach(d => {
//   [d.diagnosis_1, d.diagnosis_2, d.diagnosis_3].forEach(diag => {
//     if (diag) diseaseCounts[diag] = (diseaseCounts[diag] || 0) + 1;
//   });
// });

// const threshold = 5; // Minimum occurrences to be included separately
// const commonDiseases = Object.entries(diseaseCounts)
//   .filter(([_, count]) => count > threshold)
//   .map(([name, _]) => name)
//   .sort();

// const diseases = [...commonDiseases, "Other"];

//   // Populate dropdown
//   const dropdown = d3.select("#disease-select");
//   dropdown.selectAll("option")
//     .data(diseases)
//     .enter()
//     .append("option")
//     .text(d => d)
//     .attr("value", d => d)
//     .property("selected", d => d === "Normal");

//   // Dropdown change listener
//   dropdown.on("change", updateFilteredData);

//   // Eye toggle listener
//   d3.selectAll("input[name='eye-select']").on("change", function() {
//     selectedEye = this.value;
//     updateFilteredData();
//   });

//   // Initial render
//   updateFilteredData();

//   function updateFilteredData() {
//     const selectedDisease = dropdown.property("value") || diseases[0];
//     const filtered = fullData.filter(d => {
//         const diags = [d.diagnosis_1, d.diagnosis_2, d.diagnosis_3];
//         if (selectedDisease === "Other") {
//           return diags.some(diag => !commonDiseases.includes(diag));
//         } else {
//           return diags.includes(selectedDisease);
//         }
//       });
//     updateChart(filtered, selectedEye);
//   }
// });

// function updateChart(filteredData, eye) {
//   const yAccessor = eye === "left"
//     ? d => d.visual_acuity_left
//     : d => d.visual_acuity_right;

//   // Remove invalid rows
//   const validData = filteredData.filter(d =>
//     d.date instanceof Date &&
//     !isNaN(d.date) &&
//     !isNaN(yAccessor(d))
//   );

//   if (validData.length === 0) {
//     console.warn("No valid data to display.");
//     chart.selectAll(".line").remove();
//     return;
//   }

//   // Group by year and compute average
//   const dataByYear = d3.rollups(
//     validData,
//     values => d3.mean(values, yAccessor),
//     d => d.date.getFullYear()
//   );

//   const aggregatedData = dataByYear
//     .map(([year, avg]) => ({
//       date: new Date(year, 0, 1),
//       visual_acuity: avg
//     }))
//     .sort((a, b) => a.date - b.date);

//   xScale.domain(d3.extent(aggregatedData, d => d.date));
//   yScale.domain([0, d3.max(aggregatedData, d => d.visual_acuity)]);

//   xAxis.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")));
//   yAxis.call(d3.axisLeft(yScale));

//   const line = d3.line()
//     .x(d => xScale(d.date))
//     .y(d => yScale(d.visual_acuity));

//   const path = chart.selectAll(".line").data([aggregatedData]);

//   path.enter()
//     .append("path")
//     .attr("class", "line")
//     .merge(path)
//     .transition()
//     .duration(500)
//     .attr("fill", "none")
//     .attr("stroke", "steelblue")
//     .attr("stroke-width", 2)
//     .attr("d", line);

//   path.exit().remove();
// }

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const svg = d3.select("#chart"),
      width = +svg.attr("width"),
      height = +svg.attr("height"),
      margin = { top: 30, right: 30, bottom: 60, left: 70 }, // Increased margins for labels
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleTime().range([0, innerWidth]);
const yScale = d3.scaleLinear().range([0, innerHeight]); // Reversed range for y-axis (0 at top)

const xAxis = chart.append("g").attr("transform", `translate(0,${innerHeight})`);
const yAxis = chart.append("g");

chart.append("text")
    .attr("class", "x-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .text("Year");

chart.append("text")
    .attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("Visual Acuity (logMAR)");

let fullData = [];
let selectedEye = "right"; 

d3.csv("../data/participants_info.csv", d => ({
  date: d3.timeParse("%Y-%m-%d")(d.date),
  visual_acuity_right: +d.va_re_logMar,
  visual_acuity_left: +d.va_le_logMar,
  diagnosis_1: d.diagnosis1,
  diagnosis_2: d.diagnosis2,
  diagnosis_3: d.diagnosis3
})).then(data => {
  fullData = data;

  const diseaseCounts = {};
  data.forEach(d => {
    [d.diagnosis_1, d.diagnosis_2, d.diagnosis_3].forEach(diag => {
      if (diag) diseaseCounts[diag] = (diseaseCounts[diag] || 0) + 1;
    });
  });

  const threshold = 5; 
  const commonDiseases = Object.entries(diseaseCounts)
    .filter(([_, count]) => count > threshold)
    .map(([name, _]) => name)
    .sort();

  const diseases = [...commonDiseases, "Other"];

  const dropdown = d3.select("#disease-select");
  dropdown.selectAll("option")
    .data(diseases)
    .enter()
    .append("option")
    .text(d => d)
    .attr("value", d => d)
    .property("selected", d => d === "Normal");

  dropdown.on("change", updateFilteredData);

  d3.selectAll("input[name='eye-select']").on("change", function() {
    selectedEye = this.value;
    updateFilteredData();
  });

  updateFilteredData();

  function updateFilteredData() {
    const selectedDisease = dropdown.property("value") || diseases[0];
    const filtered = fullData.filter(d => {
        const diags = [d.diagnosis_1, d.diagnosis_2, d.diagnosis_3];
        if (selectedDisease === "Other") {
          return diags.some(diag => !commonDiseases.includes(diag));
        } else {
          return diags.includes(selectedDisease);
        }
      });
    updateChart(filtered, selectedEye);
  }
});

function updateChart(filteredData, eye) {
  const yAccessor = eye === "left"
    ? d => d.visual_acuity_left
    : d => d.visual_acuity_right;

  const validData = filteredData.filter(d =>
    d.date instanceof Date &&
    !isNaN(d.date) &&
    !isNaN(yAccessor(d))
  );

  if (validData.length === 0) {
    console.warn("No valid data to display.");
    chart.selectAll(".line").remove();
    return;
  }

  const dataByYear = d3.rollups(
    validData,
    values => d3.mean(values, yAccessor),
    d => d.date.getFullYear()
  );

  const aggregatedData = dataByYear
    .map(([year, avg]) => ({
      date: new Date(year, 0, 1),
      visual_acuity: avg
    }))
    .sort((a, b) => a.date - b.date);

  xScale.domain(d3.extent(aggregatedData, d => d.date));
  

  const yMin = d3.min(aggregatedData, d => d.visual_acuity);
  const yMax = d3.max(aggregatedData, d => d.visual_acuity);
  
  const yPadding = (yMax - yMin) * 0.1;
  yScale.domain([yMax + yPadding, yMin - yPadding]); 

  xAxis.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y")));
  yAxis.call(d3.axisLeft(yScale));

  const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.visual_acuity));

  const path = chart.selectAll(".line").data([aggregatedData]);

  path.enter()
    .append("path")
    .attr("class", "line")
    .merge(path)
    .transition()
    .duration(500)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  path.exit().remove();

  d3.select(".y-label")
    .text(`${eye.charAt(0).toUpperCase() + eye.slice(1)} Eye Visual Acuity (logMAR)`);
}