import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/+esm";

// const svg = d3.select("svg");
// const width = +svg.attr("width");
// const height = +svg.attr("height");
// const margin = { top: 40, right: 30, bottom: 100, left: 60 };
// const innerWidth = width - margin.left - margin.right;
// const innerHeight = height - margin.top - margin.bottom;

// const chart = svg.append("g")
//   .attr("transform", `translate(${margin.left},${margin.top})`);

// const tooltip = d3.select("body").append("div")
//   .attr("class", "tooltip")
//   .style("opacity", 0);

// d3.csv("../data/participants_info.csv").then(data => {
//   const counts = {};
//   const categories = ['diagnosis1', 'diagnosis2'];

//   data.forEach(d => {
//     categories.forEach(cat => {
//       const diag = d[cat]?.trim();
//       if (diag) {
//         counts[diag] = counts[diag] || { diagnosis1: 0, diagnosis2: 0 };
//         counts[diag][cat]++;
//       }
//     });
//   });

//   const diagnoses = Object.keys(counts);
//   const groupedData = diagnoses.map(name => ({
//     name,
//     ...counts[name]
//   }));

//   const x0 = d3.scaleBand()
//     .domain(diagnoses)
//     .range([0, innerWidth])
//     .padding(0.2);

//   const x1 = d3.scaleBand()
//     .domain(categories)
//     .range([0, x0.bandwidth()])
//     .padding(0.05);

//   const y = d3.scaleLinear()
//     .domain([0, d3.max(groupedData, d => Math.max(d.diagnosis1, d.diagnosis2))])
//     .nice()
//     .range([innerHeight, 0]);

//   const color = d3.scaleOrdinal()
//     .domain(categories)
//     .range(["#69b3a2", "#4C9BE8"]);

//   chart.append("g")
//     .selectAll("g")
//     .data(groupedData)
//     .join("g")
//     .attr("transform", d => `translate(${x0(d.name)},0)`)
//     .selectAll("rect")
//     .data(d => categories.map(key => ({ key, value: d[key], name: d.name })))
//     .join("rect")
//     .attr("x", d => x1(d.key))
//     .attr("y", d => y(d.value))
//     .attr("width", x1.bandwidth())
//     .attr("height", d => innerHeight - y(d.value))
//     .attr("fill", d => color(d.key))
//     .attr("class", "bar")
//     .on("mouseenter", (event, d) => {
//       tooltip.transition().duration(200).style("opacity", 0.9);
//       tooltip.html(`<strong>${d.name}</strong><br>${d.key}: ${d.value}`)
//         .style("left", (event.pageX + 10) + "px")
//         .style("top", (event.pageY - 28) + "px");
//     })
//     .on("mouseleave", () => {
//       tooltip.transition().duration(500).style("opacity", 0);
//     });

//   chart.append("g")
//     .attr("transform", `translate(0,${innerHeight})`)
//     .call(d3.axisBottom(x0))
//     .selectAll("text")
//     .attr("transform", "rotate(-40)")
//     .style("text-anchor", "end");

//   chart.append("g").call(d3.axisLeft(y));

//   svg.append("text")
//     .attr("x", width / 2)
//     .attr("y", margin.top / 2)
//     .attr("text-anchor", "middle")
//     .attr("font-size", "16px")
//     .text("Diagnosis1 vs Diagnosis2 Frequency");

//   const legend = svg.append("g")
//     .attr("transform", `translate(${width - 150},${margin.top})`);

//   categories.forEach((key, i) => {
//     const g = legend.append("g").attr("transform", `translate(0,${i * 20})`);
//     g.append("rect")
//       .attr("width", 12)
//       .attr("height", 12)
//       .attr("fill", color(key));
//     g.append("text")
//       .attr("x", 18)
//       .attr("y", 10)
//       .text(key);
//   });
// });



//other interactive option

d3.csv("../data/participants_info.csv").then(function(data) {
  let nodes = [];
  let links = [];

  data.forEach(d => {
    const diagnoses = [d.diagnosis1, d.diagnosis2, d.diagnosis3].filter(Boolean);
    for (let i = 0; i < diagnoses.length; i++) {
      for (let j = i + 1; j < diagnoses.length; j++) {
        const source = diagnoses[i];
        const target = diagnoses[j];

        if (!nodes.find(n => n.name === source)) nodes.push({ name: source });
        if (!nodes.find(n => n.name === target)) nodes.push({ name: target });

        const existingLink = links.find(link => link.source === source && link.target === target);
        if (existingLink) {
          existingLink.value += 1;
        } else {
          links.push({ source, target, value: 1 });
        }
      }
    }
  });

  nodes.forEach((node, index) => {
    node.id = index;
  });

  links.forEach(link => {
    link.source = nodes.find(n => n.name === link.source).id;
    link.target = nodes.find(n => n.name === link.target).id;
  });

  const svg = d3.select("#viz")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);
  const marginTop = 60;
  const sankeyGen = sankey()
    .nodeWidth(7)
    .nodePadding(10)
    .extent([[1, marginTop], [800 - 1, 500 - 6]]);


  const graph = sankeyGen({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  });

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

  // Color scale for diagnosis2
  const diagnosis2Color = d3.scaleOrdinal()
    .domain(graph.nodes.map(n => n.name))
    .range(d3.schemeCategory10.concat(d3.schemeSet3));

  svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("class", "sankey-link")
    .attr("d", sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", "#00a1b3")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("stroke-opacity", 0.9)
        .attr("stroke", "#ff9900");

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>${graph.nodes[d.source].name} → ${graph.nodes[d.target].name}</strong><br>Connections: ${d.value}`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("stroke-opacity", 0.5)
        .attr("stroke", "#00a1b3");

      tooltip.transition().duration(500).style("opacity", 0);
    });

  const node = svg.append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  node.append("rect")
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", "#007acc")
    .on("mouseover", function (event, d) {
      const connectedLinks = graph.links.filter(link => link.source === d.index);

      connectedLinks.forEach(link => {
        const diagnosis2Name = graph.nodes[link.target].name;
        svg.selectAll(".sankey-link")
          .filter(l => l === link)
          .attr("stroke", diagnosis2Color(diagnosis2Name))
          .attr("stroke-opacity", 0.9);
      });

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`<strong>${d.name}</strong><br>${connectedLinks.length} different diagnosis2`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      svg.selectAll(".sankey-link")
        .attr("stroke", "#00a1b3")
        .attr("stroke-opacity", 0.5);

      tooltip.transition().duration(500).style("opacity", 0);
    });

  node.append("text")
    .attr("x", d => d.x0 < 800 / 2 ? 6 + sankeyGen.nodeWidth() : -6)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < 800 / 2 ? "start" : "end")
    .text(d => d.name);

 
// Add title group for better structure
const titleGroup = svg.append("g")
  .attr("transform", "translate(400, 20)"); // x=centered, y=top padding

// Main Title
titleGroup.append("text")
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-family", "sans-serif")
  .style("font-weight", "bold")
  .text("The Correlation between Diagosis 1 and Diagnosis 2");

// Subtitle
titleGroup.append("text")
  .attr("y", 25)
  .attr("text-anchor", "middle")
  .style("font-size", "14px")
  .style("font-family", "sans-serif")
  .style("fill", "#555")
  .text("Each link shows how often one diagnosis is followed by another");

});
