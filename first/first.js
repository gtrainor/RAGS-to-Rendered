// document.addEventListener("DOMContentLoaded", () => {
//     d3.csv("../data/participants_info.csv").then(data => {
//       // Parse and preprocess data
//       data.forEach(d => {
//         d.age = +d.age_years;
//         d.sex = d.sex.trim().toLowerCase();
//         d.acuity = (+d.va_re_logMar + +d.va_le_logMar) / 2; // average of both eyes
//       });
  
//       // Group into 5-year buckets by sex and age
//       function getAgeBucket(age) {
//         const bucketStart = Math.floor(age / 5) * 5;
//         return `${bucketStart}-${bucketStart + 4}`;
//       }
  
//       const grouped = d3.groups(data, d => d.sex, d => getAgeBucket(d.age))
//         .map(([sex, ageGroup]) => ({
//           sex,
//           values: ageGroup.map(([bucket, records]) => {
//             const ages = records.map(r => r.age);
//             return {
//               bucket,
//               midAge: d3.mean(ages),
//               avgAcuity: d3.mean(records, r => r.acuity)
//             };
//           }).sort((a, b) => a.midAge - b.midAge)
//         }));
  
//       const width = 700;
//       const height = 400;
//       const margin = { top: 40, right: 40, bottom: 40, left: 50 };
  
//       const svg = d3.select("#viz")
//         .append("svg")
//         .attr("width", width)
//         .attr("height", height);
  
//       const x = d3.scaleLinear()
//         .domain([d3.min(data, d => d.age), d3.max(data, d => d.age)])
//         .range([margin.left, width - margin.right]);
  
//       const y = d3.scaleLinear()
//         .range([height - margin.bottom, margin.top])
//         .domain([
//           d3.min(grouped.flatMap(d => d.values.map(v => v.avgAcuity))),
//           d3.max(grouped.flatMap(d => d.values.map(v => v.avgAcuity)))
//         ]);
  
//       const color = d3.scaleOrdinal()
//         .domain(["male", "female"])
//         .range(["steelblue", "hotpink"]);
  
//       const line = d3.line()
//         .x(d => x(d.midAge))
//         .y(d => y(d.avgAcuity));
  
//       // Draw lines for each sex group
//       grouped.forEach(group => {
//         const cleanValues = group.values.filter(v => !isNaN(v.avgAcuity));
  
//         svg.append("path")
//           .datum(cleanValues)
//           .attr("fill", "none")
//           .attr("stroke", color(group.sex))
//           .attr("stroke-width", 2)
//           .attr("d", line);
  
//         const last = cleanValues[cleanValues.length - 1];
//         if (last) {
//           svg.append("text")
//             .attr("x", x(last.midAge) + 5)
//             .attr("y", y(last.avgAcuity))
//             .attr("fill", color(group.sex))
//             .text(group.sex)
//             .style("font-size", "12px")
//             .attr("dominant-baseline", "middle");
//         }
//       });
  
//       // X-axis
//       svg.append("g")
//         .attr("transform", `translate(0,${height - margin.bottom})`)
//         .call(d3.axisBottom(x).tickFormat(d3.format("d")))
//         .append("text")
//         .attr("x", width / 2)
//         .attr("y", 35)
//         .attr("fill", "black")
//         .text("Age")
//         .attr("text-anchor", "middle");
  
//       // Y-axis
//       svg.append("g")
//         .attr("transform", `translate(${margin.left},0)`)
//         .call(d3.axisLeft(y))
//         .append("text")
//         .attr("x", -margin.left)
//         .attr("y", margin.top - 10)
//         .attr("fill", "black")
//         .text("Average Visual Acuity")
//         .attr("text-anchor", "start");
  
//       // User interaction for input
//       d3.select("#showBtn").on("click", () => {
//         const userAge = +d3.select("#ageInput").property("value");
//         const userSex = d3.select("#sexInput").property("value").trim().toLowerCase();
//         const userAcuity = +d3.select("#acuityInput").property("value");
//         const userBucket = getAgeBucket(userAge);
  
//         const group = grouped.find(g => g.sex === userSex);
//         if (!group) return;
  
//         const point = group.values.find(v => v.bucket === userBucket);
//         if (!point) return;
  
//         svg.selectAll(".user-marker").remove(); // Remove old markers
  
//         // Predicted acuity marker
//         svg.append("circle")
//           .attr("class", "user-marker")
//           .attr("cx", x(point.midAge))
//           .attr("cy", y(point.avgAcuity))
//           .attr("r", 5)
//           .attr("fill", "orange");
  
//         svg.append("text")
//           .attr("class", "user-marker")
//           .attr("x", x(point.midAge) + 8)
//           .attr("y", y(point.avgAcuity))
//           .attr("fill", "orange")
//           .text(` Others(${point.avgAcuity.toFixed(2)})`)
//           .attr("dominant-baseline", "middle")
//           .style("font-size", "12px");
  
//         // If user provided their own acuity, show it
//         if (!isNaN(userAcuity)) {
//           svg.append("circle")
//             .attr("class", "user-marker")
//             .attr("cx", x(point.midAge))
//             .attr("cy", y(userAcuity))
//             .attr("r", 5)
//             .attr("fill", "limegreen");
  
//           svg.append("text")
//             .attr("class", "user-marker")
//             .attr("x", x(point.midAge) + 8)
//             .attr("y", y(userAcuity))
//             .attr("fill", "limegreen")
//             .text(`You (${userAcuity.toFixed(2)})`)
//             .attr("dominant-baseline", "middle")
//             .style("font-size", "12px");
//         }
//       });
    
//     });
//   });

document.addEventListener("DOMContentLoaded", () => {
    d3.csv("../data/participants_info.csv").then(data => {
      // Parse and preprocess data
      data.forEach(d => {
        d.age = +d.age_years;
        d.sex = d.sex.trim().toLowerCase();
        d.acuity = (+d.va_re_logMar + +d.va_le_logMar) / 2; // average of both eyes
      });
  
      // Group into 5-year buckets by sex and age
      function getAgeBucket(age) {
        const bucketStart = Math.floor(age / 5) * 5;
        return `${bucketStart}-${bucketStart + 4}`;
      }
  
      const grouped = d3.groups(data, d => d.sex, d => getAgeBucket(d.age))
        .map(([sex, ageGroup]) => ({
          sex,
          values: ageGroup.map(([bucket, records]) => {
            const ages = records.map(r => r.age);
            return {
              bucket,
              midAge: d3.mean(ages),
              avgAcuity: d3.mean(records, r => r.acuity)
            };
          }).sort((a, b) => a.midAge - b.midAge)
        }));
  
      const width = 700;
      const height = 400;
      const margin = { top: 40, right: 40, bottom: 40, left: 50 };
  
      const svg = d3.select("#viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
  
      const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.age), d3.max(data, d => d.age)])
        .range([margin.left, width - margin.right]);
  
      const y = d3.scaleLinear()
        .range([height - margin.bottom, margin.top])
        .domain([
          d3.min(grouped.flatMap(d => d.values.map(v => v.avgAcuity))),
          d3.max(grouped.flatMap(d => d.values.map(v => v.avgAcuity)))
        ]);
  
      const color = d3.scaleOrdinal()
        .domain(["male", "female"])
        .range(["steelblue", "hotpink"]);
  
      const line = d3.line()
        .x(d => x(d.midAge))
        .y(d => y(d.avgAcuity));
  
      // Draw lines for each sex group
      grouped.forEach(group => {
        const cleanValues = group.values.filter(v => !isNaN(v.avgAcuity));
  
        svg.append("path")
          .datum(cleanValues)
          .attr("fill", "none")
          .attr("stroke", color(group.sex))
          .attr("stroke-width", 2)
          .attr("d", line);
  
        // Add label with background at the end of each line
        const last = cleanValues[cleanValues.length - 1];
        if (last) {
          // First add a background rectangle for the text
          const labelText = group.sex;
          const textPadding = 3; // Padding around text
          
          // Create a group for the label
          const labelGroup = svg.append("g")
            .attr("transform", `translate(${x(last.midAge) + 5}, ${y(last.avgAcuity)})`);
          
          // Add text to measure its dimensions
          const textElement = labelGroup.append("text")
            .text(labelText)
            .style("font-size", "12px")
            .attr("fill", color(group.sex))
            .attr("dominant-baseline", "middle");
          
          // Get the text's bounding box
          const bbox = textElement.node().getBBox();
          
          // Add background rectangle before text (so it appears behind)
          labelGroup.insert("rect", "text")
            .attr("x", bbox.x - textPadding)
            .attr("y", bbox.y - textPadding)
            .attr("width", bbox.width + (textPadding * 2))
            .attr("height", bbox.height + (textPadding * 2))
            .attr("fill", "white")
            .attr("fill-opacity", 0.7)
            .attr("rx", 2) // Rounded corners
            .attr("ry", 2);
        }
      });
  
      // X-axis
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .text("Age")
        .attr("text-anchor", "middle");
  
      // Y-axis
      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .append("text")
        .attr("x", -margin.left)
        .attr("y", margin.top - 10)
        .attr("fill", "black")
        .text("Average Visual Acuity")
        .attr("text-anchor", "start");
  
      // User interaction for input
      d3.select("#showBtn").on("click", () => {
        const userAge = +d3.select("#ageInput").property("value");
        const userSex = d3.select("#sexInput").property("value").trim().toLowerCase();
        const userAcuity = +d3.select("#acuityInput").property("value");
        const userBucket = getAgeBucket(userAge);
  
        const group = grouped.find(g => g.sex === userSex);
        if (!group) return;
  
        const point = group.values.find(v => v.bucket === userBucket);
        if (!point) return;
  
        svg.selectAll(".user-marker").remove(); // Remove old markers
  
        // Create a function to add markers with background boxes
        function addMarkerWithLabel(x, y, color, text) {
          // Add circle marker
          svg.append("circle")
            .attr("class", "user-marker")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 5)
            .attr("fill", color);
          
          // Create a group for the label
          const labelGroup = svg.append("g")
            .attr("class", "user-marker")
            .attr("transform", `translate(${x + 8}, ${y})`);
          
          // Add text to measure its dimensions
          const textElement = labelGroup.append("text")
            .text(text)
            .attr("fill", color)
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px");
          
          // Get the text's bounding box
          const bbox = textElement.node().getBBox();
          const textPadding = 3;
          
          // Add background rectangle before text (so it appears behind)
          labelGroup.insert("rect", "text")
            .attr("x", bbox.x - textPadding)
            .attr("y", bbox.y - textPadding)
            .attr("width", bbox.width + (textPadding * 2))
            .attr("height", bbox.height + (textPadding * 2))
            .attr("fill", "white")
            .attr("fill-opacity", 0.7)
            .attr("rx", 2)
            .attr("ry", 2);
        }
  
        // Predicted acuity marker
        addMarkerWithLabel(
          x(point.midAge), 
          y(point.avgAcuity), 
          "orange", 
          ` Others(${point.avgAcuity.toFixed(2)})`
        );
  
        // If user provided their own acuity, show it
        if (!isNaN(userAcuity)) {
          addMarkerWithLabel(
            x(point.midAge),
            y(userAcuity),
            "limegreen",
            `You (${userAcuity.toFixed(2)})`
          );
        }
      });
    });
  });