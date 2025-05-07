document.addEventListener("DOMContentLoaded", () => {
    const chart = d3.select("#chart");
    const viewModeSelect = document.getElementById("viewMode");
    const diagnosisFilterSelect = document.getElementById("diagnosisFilter");
    const minPatientsInput = document.getElementById("minPatients");
    const resetBtn = document.getElementById("resetBtn");
    
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    
    let svg = chart.append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 1000 600")
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    d3.csv("../data/participants_info.csv").then(data => {
      const cleanData = data.filter(d => {
        const reAcuity = parseFloat(d.va_re_logMar);
        const leAcuity = parseFloat(d.va_le_logMar);
        return !isNaN(reAcuity) && !isNaN(leAcuity) && d.diagnosis1 !== "";
      });
      
      function aggregateByDiagnosis(minPatients = 5) {
        const diagnosisData = {};
        for (let i = 1; i <= 3; i++) {
          const diagField = `diagnosis${i}`;
          
          cleanData.forEach(d => {
            const diagnosis = d[diagField];
            if (!diagnosis || diagnosis === "") return;
            
            if (!diagnosisData[diagnosis]) {
              diagnosisData[diagnosis] = {
                diagnosis: diagnosis,
                reAcuitySum: 0,
                leAcuitySum: 0,
                reAcuityValues: [],
                leAcuityValues: [],
                count: 0
              };
            }
            
            const reAcuity = parseFloat(d.va_re_logMar);
            const leAcuity = parseFloat(d.va_le_logMar);
            
            if (!isNaN(reAcuity) && !isNaN(leAcuity)) {
              diagnosisData[diagnosis].reAcuitySum += reAcuity;
              diagnosisData[diagnosis].leAcuitySum += leAcuity;
              diagnosisData[diagnosis].reAcuityValues.push(reAcuity);
              diagnosisData[diagnosis].leAcuityValues.push(leAcuity);
              diagnosisData[diagnosis].count += 1;
            }
          });
        }
        
        const result = Object.values(diagnosisData)
          .filter(d => d.count >= minPatients)
          .map(d => {
            const reAvg = d.reAcuitySum / d.count;
            const leAvg = d.leAcuitySum / d.count;
            const difference = reAvg - leAvg;
            const reStdDev = standardDeviation(d.reAcuityValues);
            const leStdDev = standardDeviation(d.leAcuityValues);
            const reStdErr = reStdDev / Math.sqrt(d.count);
            const leStdErr = leStdDev / Math.sqrt(d.count);
            
            return {
              diagnosis: d.diagnosis,
              reAcuity: reAvg,
              leAcuity: leAvg,
              difference: difference,
              count: d.count,
              reStdErr: reStdErr,
              leStdErr: leStdErr,
              reValues: d.reAcuityValues,
              leValues: d.leAcuityValues
            };
          })
          .sort((a, b) => b.count - a.count); 
        
        return result;
      }
      
      function standardDeviation(values) {
        const n = values.length;
        if (n <= 1) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
        return Math.sqrt(variance);
      }
      

      function populateDiagnosisFilter(data) {
        while (diagnosisFilterSelect.options.length > 1) {
          diagnosisFilterSelect.remove(1);
        }
        
        data.forEach(d => {
          const option = document.createElement("option");
          option.value = d.diagnosis;
          option.text = `${d.diagnosis} (${d.count} patients)`;
          diagnosisFilterSelect.appendChild(option);
        });
      }
      
      function drawPairedBarChart(data) {
        svg.selectAll("*").remove();
        
        const margin = { top: 40, right: 30, bottom: 160, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        
        const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const x0 = d3.scaleBand()
          .domain(data.map(d => d.diagnosis))
          .rangeRound([0, width])
          .paddingInner(0.2);
        
        const x1 = d3.scaleBand()
          .domain(["reAcuity", "leAcuity"])
          .rangeRound([0, x0.bandwidth()])
          .padding(0.05);
        
        const y = d3.scaleLinear()
          .domain([
            d3.min(data, d => Math.min(d.reAcuity, d.leAcuity) - Math.max(d.reStdErr, d.leStdErr)) * 0.9,
            d3.max(data, d => Math.max(d.reAcuity, d.leAcuity) + Math.max(d.reStdErr, d.leStdErr)) * 1.1
          ])
          .nice()
          .range([height, 0]);
        
        // Add reference line for 20/20 vision 
        g.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(0))
          .attr("y2", y(0))
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");
        
        g.append("text")
          .attr("x", 5)
          .attr("y", y(0) - 5)
          .attr("fill", "#666")
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .text("20/20 vision (0.0)");
        
        const color = d3.scaleOrdinal()
          .domain(["reAcuity", "leAcuity"])
          .range(["#4e79a7", "#f28e2c"]);
        
        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x0))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)");
        
        g.append("g")
          .call(d3.axisLeft(y))
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -40)
          .attr("x", -height / 2)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .text("Visual Acuity (logMAR)");
        
        const barGroup = g.append("g")
          .selectAll("g")
          .data(data)
          .enter().append("g")
          .attr("transform", d => `translate(${x0(d.diagnosis)},0)`);
        
        function formatNumber(num) {
          return Number.isInteger(num) ? num.toString() : num.toFixed(2);
        }
        
        barGroup.append("rect")
          .attr("x", x1("reAcuity"))
          .attr("y", d => y(Math.max(0, d.reAcuity)))
          .attr("width", x1.bandwidth())
          .attr("height", d => Math.abs(y(d.reAcuity) - y(0)))
          .attr("fill", color("reAcuity"))
          .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.8);
            
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            tooltip.html(`
              <strong>${d.diagnosis}</strong><br>
              Right Eye: ${formatNumber(d.reAcuity)} logMAR<br>
              (±${formatNumber(d.reStdErr)} SE)<br>
              ${d.count} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
        
        barGroup.append("rect")
          .attr("x", x1("leAcuity"))
          .attr("y", d => y(Math.max(0, d.leAcuity)))
          .attr("width", x1.bandwidth())
          .attr("height", d => Math.abs(y(d.leAcuity) - y(0)))
          .attr("fill", color("leAcuity"))
          .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.8);
            
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            tooltip.html(`
              <strong>${d.diagnosis}</strong><br>
              Left Eye: ${formatNumber(d.leAcuity)} logMAR<br>
              (±${formatNumber(d.leStdErr)} SE)<br>
              ${d.count} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
        
        barGroup.append("line")
          .attr("x1", x1("reAcuity") + x1.bandwidth() / 2)
          .attr("x2", x1("reAcuity") + x1.bandwidth() / 2)
          .attr("y1", d => y(d.reAcuity - d.reStdErr))
          .attr("y2", d => y(d.reAcuity + d.reStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        barGroup.append("line")
          .attr("x1", x1("leAcuity") + x1.bandwidth() / 2)
          .attr("x2", x1("leAcuity") + x1.bandwidth() / 2)
          .attr("y1", d => y(d.leAcuity - d.leStdErr))
          .attr("y2", d => y(d.leAcuity + d.leStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        barGroup.append("line")
          .attr("x1", x1("reAcuity") + x1.bandwidth() / 2 - 4)
          .attr("x2", x1("reAcuity") + x1.bandwidth() / 2 + 4)
          .attr("y1", d => y(d.reAcuity - d.reStdErr))
          .attr("y2", d => y(d.reAcuity - d.reStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        barGroup.append("line")
          .attr("x1", x1("reAcuity") + x1.bandwidth() / 2 - 4)
          .attr("x2", x1("reAcuity") + x1.bandwidth() / 2 + 4)
          .attr("y1", d => y(d.reAcuity + d.reStdErr))
          .attr("y2", d => y(d.reAcuity + d.reStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        barGroup.append("line")
          .attr("x1", x1("leAcuity") + x1.bandwidth() / 2 - 4)
          .attr("x2", x1("leAcuity") + x1.bandwidth() / 2 + 4)
          .attr("y1", d => y(d.leAcuity - d.leStdErr))
          .attr("y2", d => y(d.leAcuity - d.leStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        barGroup.append("line")
          .attr("x1", x1("leAcuity") + x1.bandwidth() / 2 - 4)
          .attr("x2", x1("leAcuity") + x1.bandwidth() / 2 + 4)
          .attr("y1", d => y(d.leAcuity + d.leStdErr))
          .attr("y2", d => y(d.leAcuity + d.leStdErr))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        svg.append("text")
          .attr("x", 500)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Visual Acuity by Diagnosis: Right Eye vs Left Eye");
      }
      
      function drawScatterPlot(data) {
        svg.selectAll("*").remove();
        
        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        
        const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const minValue = d3.min(data, d => Math.min(d.reAcuity, d.leAcuity)) * 0.9;
        const maxValue = d3.max(data, d => Math.max(d.reAcuity, d.leAcuity)) * 1.1;
        
        const x = d3.scaleLinear()
          .domain([minValue, maxValue])
          .nice()
          .range([0, width]);
        
        const y = d3.scaleLinear()
          .domain([minValue, maxValue])
          .nice()
          .range([height, 0]);
        
        g.append("line")
          .attr("x1", x(minValue))
          .attr("y1", y(minValue))
          .attr("x2", x(maxValue))
          .attr("y2", y(maxValue))
          .attr("stroke", "#ccc")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");
        
        // Add reference lines for 20/20 vision
        g.append("line")
          .attr("x1", x(0))
          .attr("x2", x(0))
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");
        
        g.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(0))
          .attr("y2", y(0))
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");
        
        g.append("text")
          .attr("x", x(0) + 5)
          .attr("y", 15)
          .attr("fill", "#666")
          .text("20/20 vision (RE)");
        
        g.append("text")
          .attr("x", 5)
          .attr("y", y(0) - 5)
          .attr("fill", "#666")
          .text("20/20 vision (LE)");
        
        const color = d3.scaleOrdinal(d3.schemeCategory10)
          .domain(data.map(d => d.diagnosis));
        
        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .append("text")
          .attr("x", width / 2)
          .attr("y", 40)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .text("Right Eye Visual Acuity (logMAR)");
        
        g.append("g")
          .call(d3.axisLeft(y))
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -40)
          .attr("x", -height / 2)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .text("Left Eye Visual Acuity (logMAR)");
        
        function formatNumber(num) {
          return Number.isInteger(num) ? num.toString() : num.toFixed(2);
        }
        
        g.selectAll(".point")
          .data(data)
          .enter().append("circle")
          .attr("class", "point")
          .attr("cx", d => x(d.reAcuity))
          .attr("cy", d => y(d.leAcuity))
          .attr("r", d => 5 + Math.sqrt(d.count))
          .attr("fill", d => color(d.diagnosis))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .on("mouseover", function(event, d) {
            d3.select(this)
              .attr("stroke", "#000")
              .attr("stroke-width", 2);
            
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            tooltip.html(`
              <strong>${d.diagnosis}</strong><br>
              Right Eye: ${formatNumber(d.reAcuity)} logMAR<br>
              Left Eye: ${formatNumber(d.leAcuity)} logMAR<br>
              Difference: ${formatNumber(d.difference)} logMAR<br>
              ${d.count} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1);
            
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });

        g.selectAll(".label")
          .data(data)
          .enter().append("text")
          .attr("class", "label")
          .attr("x", d => x(d.reAcuity))
          .attr("y", d => y(d.leAcuity) - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("fill", d => color(d.diagnosis))
          .style("font-weight", "bold")
          .text(d => d.diagnosis.length > 10 ? d.diagnosis.substring(0, 10) + "..." : d.diagnosis);
        
        svg.append("text")
          .attr("x", 500)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Visual Acuity Scatter Plot: Right Eye vs Left Eye");
        
        svg.append("text")
          .attr("x", 500)
          .attr("y", 580)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text("Points above the diagonal line indicate better vision in the right eye, points below indicate better vision in the left eye");
      }
      
      function drawDifferenceChart(data) {
        svg.selectAll("*").remove();
        
        const margin = { top: 40, right: 30, bottom: 160, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        
        const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const maxDiff = d3.max(data, d => Math.abs(d.difference)) * 1.2;
        
        const x = d3.scaleBand()
          .domain(data.map(d => d.diagnosis))
          .range([0, width])
          .padding(0.2);
        
        const y = d3.scaleLinear()
          .domain([-maxDiff, maxDiff])
          .nice()
          .range([height, 0]);
        
        g.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", y(0))
          .attr("y2", y(0))
          .attr("stroke", "#666")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-45)");
        
        g.append("g")
          .call(d3.axisLeft(y))
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -40)
          .attr("x", -height / 2)
          .attr("fill", "#000")
          .attr("text-anchor", "middle")
          .text("Difference in Visual Acuity (RE - LE)");
        
        g.append("text")
          .attr("x", 5)
          .attr("y", y(-maxDiff / 2))
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("fill", "#f28e2c")
          .text("Left eye worse →");
        
        g.append("text")
          .attr("x", 5)
          .attr("y", y(maxDiff / 2))
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("fill", "#4e79a7")
          .text("Right eye worse →");
        
        function formatNumber(num) {
          return Number.isInteger(num) ? num.toString() : num.toFixed(2);
        }
        
        g.selectAll(".bar")
          .data(data)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", d => x(d.diagnosis))
          .attr("y", d => d.difference > 0 ? y(d.difference) : y(0))
          .attr("width", x.bandwidth())
          .attr("height", d => Math.abs(y(d.difference) - y(0)))
          .attr("fill", d => d.difference > 0 ? "#4e79a7" : "#f28e2c") 
          .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 0.8);
            
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            const betterEye = d.difference > 0 ? "Left Eye" : (d.difference < 0 ? "Right Eye" : "Equal");
            
            tooltip.html(`
              <strong>${d.diagnosis}</strong><br>
              Right Eye: ${formatNumber(d.reAcuity)} logMAR<br>
              Left Eye: ${formatNumber(d.leAcuity)} logMAR<br>
              Difference: ${formatNumber(d.difference)} logMAR<br>
              Better Eye: ${betterEye}<br>
              ${d.count} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });

        const combinedStdErr = data.map(d => Math.sqrt(Math.pow(d.reStdErr, 2) + Math.pow(d.leStdErr, 2)));
        
        g.selectAll(".error-line")
          .data(data)
          .enter().append("line")
          .attr("class", "error-line")
          .attr("x1", d => x(d.diagnosis) + x.bandwidth() / 2)
          .attr("x2", d => x(d.diagnosis) + x.bandwidth() / 2)
          .attr("y1", (d, i) => y(d.difference - combinedStdErr[i]))
          .attr("y2", (d, i) => y(d.difference + combinedStdErr[i]))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        g.selectAll(".error-cap-top")
          .data(data)
          .enter().append("line")
          .attr("class", "error-cap-top")
          .attr("x1", d => x(d.diagnosis) + x.bandwidth() / 2 - 4)
          .attr("x2", d => x(d.diagnosis) + x.bandwidth() / 2 + 4)
          .attr("y1", (d, i) => y(d.difference + combinedStdErr[i]))
          .attr("y2", (d, i) => y(d.difference + combinedStdErr[i]))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        g.selectAll(".error-cap-bottom")
          .data(data)
          .enter().append("line")
          .attr("class", "error-cap-bottom")
          .attr("x1", d => x(d.diagnosis) + x.bandwidth() / 2 - 4)
          .attr("x2", d => x(d.diagnosis) + x.bandwidth() / 2 + 4)
          .attr("y1", (d, i) => y(d.difference - combinedStdErr[i]))
          .attr("y2", (d, i) => y(d.difference - combinedStdErr[i]))
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
        
        g.selectAll(".count-label")
          .data(data)
          .enter().append("text")
          .attr("class", "count-label")
          .attr("x", d => x(d.diagnosis) + x.bandwidth() / 2)
          .attr("y", d => d.difference > 0 
            ? y(d.difference) - 5 
            : y(d.difference) + 15)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .text(d => `n=${d.count}`);
        
        svg.append("text")
          .attr("x", 500)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text("Difference in Visual Acuity by Diagnosis: Right Eye vs Left Eye");
        
        svg.append("text")
          .attr("x", 500)
          .attr("y", 580)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text("Positive values (blue) indicate worse vision in the right eye, negative values (orange) indicate worse vision in the left eye");
      }
      
      function updateVisualization() {
        const viewMode = viewModeSelect.value;
        const diagnosisFilter = diagnosisFilterSelect.value;
        const minPatients = parseInt(minPatientsInput.value) || 5;
        
        let visualData = aggregateByDiagnosis(minPatients);
        
        if (diagnosisFilter !== "all") {
          visualData = visualData.filter(d => d.diagnosis === diagnosisFilter);
        }
        
        if (diagnosisFilter === "all" && visualData.length > 15) {
          visualData = visualData.slice(0, 15);
        }
        
        if (viewMode === "paired") {
          drawPairedBarChart(visualData);
        } else if (viewMode === "scatter") {
          drawScatterPlot(visualData);
        } else if (viewMode === "difference") {
          drawDifferenceChart(visualData);
        }
      }
      
      viewModeSelect.addEventListener("change", updateVisualization);
      diagnosisFilterSelect.addEventListener("change", updateVisualization);
      minPatientsInput.addEventListener("input", updateVisualization);
      resetBtn.addEventListener("click", () => {
        viewModeSelect.value = "paired";
        diagnosisFilterSelect.value = "all";
        minPatientsInput.value = "5";
        updateVisualization();
      });
      
      const initialData = aggregateByDiagnosis(5);
      populateDiagnosisFilter(initialData);
      updateVisualization();
      
    }).catch(error => {
      console.error("Error loading data:", error);
      chart.html("<p>Error loading data. Please check the console for details.</p>");
    });
  });