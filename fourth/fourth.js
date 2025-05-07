document.addEventListener("DOMContentLoaded", () => {
    const viz = d3.select("#viz");
    const selectedDiagnosisSelect = document.getElementById("selectedDiagnosis");
    const resetBtn = document.getElementById("resetBtn");
    
    const svg = viz.append("svg")
      .attr("viewBox", "0 0 900 600")
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    const networkGroup = svg.append("g")
      .attr("class", "network");
    
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        networkGroup.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    
    d3.csv("../data/participants_info.csv").then(data => {
      const validRows = data.filter(d => d.diagnosis1 && d.diagnosis1 !== "");
      
      const diagnosisCounts = {};
      validRows.forEach(row => {
        [row.diagnosis1, row.diagnosis2, row.diagnosis3].forEach(diagnosis => {
          if (diagnosis && diagnosis !== "") {
            diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
          }
        });
      });
      
      const coOccurrences = {};
      validRows.forEach(row => {
        const diagnoses = [row.diagnosis1, row.diagnosis2, row.diagnosis3]
          .filter(d => d && d !== "");
        
        if (diagnoses.length > 1) {
          for (let i = 0; i < diagnoses.length; i++) {
            for (let j = i + 1; j < diagnoses.length; j++) {
              const pair = [diagnoses[i], diagnoses[j]].sort().join("___");
              coOccurrences[pair] = (coOccurrences[pair] || 0) + 1;
            }
          }
        }
      });
      
      const diagnosesList = Object.keys(diagnosisCounts)
        .sort((a, b) => diagnosisCounts[b] - diagnosisCounts[a])
        .filter(d => diagnosisCounts[d] >= 3);
      
      diagnosesList.forEach(diagnosis => {
        const option = document.createElement("option");
        option.value = diagnosis;
        option.text = `${diagnosis} (${diagnosisCounts[diagnosis]})`;
        selectedDiagnosisSelect.appendChild(option);
      });
      
      function createNetworkData() {
        const nodes = diagnosesList
          .map(diagnosis => ({
            id: diagnosis,
            count: diagnosisCounts[diagnosis]
          }));
        
        const links = Object.entries(coOccurrences)
          .filter(([pair, count]) => {
            const [source, target] = pair.split("___");
            return count >= 2 && 
                   diagnosesList.includes(source) && 
                   diagnosesList.includes(target);
          })
          .map(([pair, count]) => {
            const [source, target] = pair.split("___");
            return {
              source,
              target,
              value: count
            };
          });
        
        return { nodes, links };
      }
      
      function updateVisualization() {
        networkGroup.selectAll("*").remove();
        
        let networkData = createNetworkData();
        const selectedDiagnosis = selectedDiagnosisSelect.value;
        
        if (selectedDiagnosis) {
          const connectedLinks = networkData.links.filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === selectedDiagnosis || targetId === selectedDiagnosis;
          });
          
          const connectedNodes = new Set();
          connectedNodes.add(selectedDiagnosis);
          
          connectedLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            connectedNodes.add(sourceId);
            connectedNodes.add(targetId);
          });
          
          networkData.nodes = networkData.nodes.filter(node => 
            connectedNodes.has(node.id)
          );
          
          networkData.links = connectedLinks;
        }
        
        if (networkData.links.length === 0) {
          networkGroup.append("text")
            .attr("x", 450)
            .attr("y", 300)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("No connections found for this diagnosis.");
          return;
        }
        
        const nodeScale = d3.scaleSqrt()
          .domain([1, d3.max(networkData.nodes, d => d.count)])
          .range([5, 25]);
        
        const linkScale = d3.scaleLinear()
          .domain([1, d3.max(networkData.links, d => d.value)])
          .range([1, 8]);
        
        const nodeColor = d3.scaleOrdinal(d3.schemeCategory10);
        
        const simulation = d3.forceSimulation(networkData.nodes)
          .force("link", d3.forceLink(networkData.links)
            .id(d => d.id)
            .distance(100))
          .force("charge", d3.forceManyBody().strength(-200))
          .force("collide", d3.forceCollide().radius(d => nodeScale(d.count) + 5))
          .force("center", d3.forceCenter(450, 300));
        
        const link = networkGroup.append("g")
          .selectAll("line")
          .data(networkData.links)
          .enter().append("line")
          .attr("stroke-width", d => linkScale(d.value))
          .attr("stroke", "#999")
          .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#ff0000");
            
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            tooltip.html(`
              <strong>${d.source.id || d.source}</strong> and <strong>${d.target.id || d.target}</strong><br>
              Co-occur in ${d.value} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            d3.select(this).attr("stroke", "#999");
            
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
        
        const node = networkGroup.append("g")
          .selectAll("circle")
          .data(networkData.nodes)
          .enter().append("circle")
          .attr("r", d => nodeScale(d.count))
          .attr("fill", (d, i) => nodeColor(i % 10))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("class", "node")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
          .on("mouseover", function(event, d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);
            
            tooltip.html(`
              <strong>${d.id}</strong><br>
              Appears in ${d.count} patients
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          })
          .on("click", function(event, d) {
            selectedDiagnosisSelect.value = d.id;
            updateVisualization();
            event.stopPropagation(); 
          });
        
        const labels = networkGroup.append("g")
          .selectAll("text")
          .data(networkData.nodes)
          .enter().append("text")
          .text(d => d.id)
          .attr("font-size", 10)
          .attr("text-anchor", "middle")
          .attr("dy", d => -nodeScale(d.count) - 5);
        
        simulation.on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
          
          node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
          
          labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        });
        
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        
        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }
        
        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      }
      
      resetBtn.addEventListener("click", () => {
        selectedDiagnosisSelect.value = "";
        updateVisualization();
        
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });
      
      svg.on("dblclick", () => {
        selectedDiagnosisSelect.value = "";
        updateVisualization();
   
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });
      
      updateVisualization();
    }).catch(error => {
      console.error("Error loading data:", error);
      d3.select("#viz").append("p")
        .text("Error loading data. Please check the console for details.");
    });
  });