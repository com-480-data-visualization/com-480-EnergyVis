document.addEventListener('DOMContentLoaded', () => {

    // 1. General initialization
    // 1.1. Global State
    let processedData = null;
    let worldGeoJson = null;

    let highlightedCountryLayer = null; //(updated)

    let maps = {
        summary: null,
        distribution: null,
        growth: null
    };
    let geoJsonLayers = {
        summary: null,
        distribution: null,
        growth: null
    };

    // 1.2. Document Object Model Elements
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const growthFuelSelect = document.getElementById('growth-fuel-select');

    // 1.3. Map Options
    const mapOptions = {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: true
    };
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayerOptions = {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };

    // 1.4. Color & Size
    const fuelColors = {
        'Solar': '#f9d71c', 'Wind': '#add8e6', 'Hydro': '#4682b4', 'Gas': '#ffa500',
        'Coal': '#808080', 'Nuclear': '#ff69b4', 'Oil': '#a52a2a', 'Biomass': '#228b22',
        'Geothermal': '#dc143c', 'Unknown': '#d3d3d3'
    };
    const growthColorScale = { maxPositive: 1000, maxNegative: -500 };

    // 2. Functions to initialize the website
    // 2.1. Overall initial
    async function initialize() {
        const [processedResponse, geoJsonResponse] = await Promise.all([
            fetch('data/processed_data.json'),
            fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        ]);

        processedData = await processedResponse.json();
        worldGeoJson = await geoJsonResponse.json();

        console.log("Processed data loaded:", processedData);
        console.log("GeoJSON loaded.");

        setupTabs();
        initAllMaps();

        // Use Summary as the default tab (the user will see this right after go into the website)
        initSummaryTab();
    }

    // 2.2. Initialize all the three tabs
    function setupTabs() {
         tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const targetContentId = tab.id.replace('tab-', '') + '-content';
                document.getElementById(targetContentId).classList.add('active');

                switch (tab.id) {
                    case 'tab-summary':
                        initSummaryTab();
                        maps.summary?.invalidateSize();
                        break;
                    case 'tab-distribution':
                        initDistributionTab();
                        maps.distribution?.invalidateSize();
                        break;
                    case 'tab-growth':
                        initGrowthTab();
                        maps.growth?.invalidateSize();
                        break;
                }
            });
        });
    }

    // 2.3 Initialize the world maps
    function initAllMaps() {
        if (document.getElementById('map-summary') && !maps.summary) {
            maps.summary = L.map('map-summary', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.summary);
            console.log("Summary map object CREATED:", maps.summary); // <-- ADD THIS LOG
        }
         if (document.getElementById('map-distribution') && !maps.distribution) {
            maps.distribution = L.map('map-distribution', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.distribution);
        }
         if (document.getElementById('map-growth') && !maps.growth) {
            maps.growth = L.map('map-growth', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.growth);
        }
    }

    // 3. For the tab 'Summary'
    // 3.1. Initialize the summary page
    function initSummaryTab() {
        console.log("Initializing Summary Tab");
        const latestYear = processedData.years[processedData.years.length - 1];
        const globalData = processedData.global_summary[latestYear];

        // Reset highlighted country when switching back to summary tab
        highlightedCountry = null;
        hidePanel('country-info-summary');

        const statsContainer = document.getElementById('global-summary-stats');
         if (!statsContainer) return; // Exit if container not found
        statsContainer.innerHTML = `
            <h4>Global Stats (${latestYear})</h4>
            <p>Total Capacity: ${globalData?.total_capacity?.toLocaleString() || 0} MW</p>
            <div id="global-summary-chart"></div>
        `;

        // Summary Visualization
        const fuelData = Object.entries(globalData || {})
            .filter(([key]) => key !== 'total_capacity')
            .map(([fuel, capacity]) => ({ fuel, capacity }));

        const plotData = [{
            labels: fuelData.map(d => d.fuel), values: fuelData.map(d => d.capacity),
            type: 'pie', marker: { colors: fuelData.map(d => fuelColors[d.fuel] || fuelColors['Unknown']) },
            hole: .4, textinfo: 'percent', hoverinfo: 'label+value'
        }];

        const layout = {
            title: `Global Fuel Mix by Capacity (${latestYear})`, showlegend: true,
            margin: { l: 20, r: 20, t: 40, b: 20 }, height: 300
        };

        Plotly.newPlot('global-summary-chart', plotData, layout, {responsive: true});

        // Map Visualization: Color countries by Total Capacity with click handling
        if (geoJsonLayers.summary) maps.summary.removeLayer(geoJsonLayers.summary);

        geoJsonLayers.summary = L.geoJSON(worldGeoJson, {
            style: feature => getSummaryCountryStyle(feature, false),
            onEachFeature: (feature, layer) => {
                const countryName = getCountryNameFromFeature(feature);
                const countryData = processedData.country_summary[countryName]?.[latestYear];
                const capacity = countryData?.total_capacity || 0;
                
                layer.bindTooltip(`<b>${countryName}</b><br>Total Capacity: ${capacity.toLocaleString()} MW<br><i>Click for details</i>`);
                
                // Add click handler for country selection
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    // Remove focus from any element to prevent outline
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                    selectCountryInSummary(countryName, layer);
                });
            }
        }).addTo(maps.summary);
         maps.summary.invalidateSize();
    }
    
    // 3.2. Get country style for summary map
    function getSummaryCountryStyle(feature, isHighlighted) {
        const latestYear = processedData.years[processedData.years.length - 1];
        const countryName = getCountryNameFromFeature(feature);
        const countryData = processedData.country_summary[countryName]?.[latestYear];
        const capacity = countryData?.total_capacity || 0;

        let fillColor = '#d3d3d3';
        if (capacity > 1000) fillColor = '#bd0026';
        else if (capacity > 500) fillColor = '#f03b20';
        else if (capacity > 100) fillColor = '#fd8d3c';
        else if (capacity > 0) fillColor = '#fecc5c';

        return {
            fillColor: fillColor,
            weight: isHighlighted ? 4 : 1,
            opacity: 1,
            color: isHighlighted ? '#000000' : 'white',
            fillOpacity: isHighlighted ? 0.9 : 0.7,
            dashArray: isHighlighted ? '5, 5' : null
        };
    }

    // 3.3. Handle country selection in summary tab
    function selectCountryInSummary(countryName, clickedLayer) {
        console.log("Selected country in summary:", countryName);
        
        // Reset previous highlighting
        if (highlightedCountry && highlightedCountry.layer) {
            highlightedCountry.layer.setStyle(getSummaryCountryStyle(highlightedCountry.layer.feature, false));
        }

        // Highlight the new country
        clickedLayer.setStyle(getSummaryCountryStyle(clickedLayer.feature, true));
        highlightedCountry = { name: countryName, layer: clickedLayer };

        // Display country information
        displayCountrySummaryInfo(countryName);
    }

    // 3.4. Display country summary information with three pie charts
    function displayCountrySummaryInfo(countryName) {
        const latestYear = processedData.years[processedData.years.length - 1];
        const countryData = processedData.country_summary[countryName]?.[latestYear];
        
        if (!countryData) {
            console.log("No data available for:", countryName);
            return;
        }

        const panel = document.getElementById('country-info-summary');
        const nameDiv = document.getElementById('summary-country-name');
        
        if (!panel || !nameDiv) return;

        nameDiv.innerHTML = `
            <h4>${countryName}</h4>
            <p><strong>Total Capacity:</strong> ${countryData.total_capacity.toLocaleString()} MW</p>
            <p><strong>Green Energy:</strong> ${countryData.green_perc}% (${countryData.green_capacity.toLocaleString()} MW)</p>
            <p><strong>Renewable Energy:</strong> ${countryData.renewable_perc}% (${countryData.renewable_capacity.toLocaleString()} MW)</p>
        `;

        // Show the panel
        showPanel('country-info-summary');

        // Create fuel mix pie chart
        createCountryFuelMixChart(countryData, countryName, latestYear);
        
        // Create green energy pie chart
        createGreenEnergyChart(countryData, countryName);
        
        // Create renewable energy pie chart
        createRenewableEnergyChart(countryData, countryName);
    }

    // 3.5. Create fuel mix pie chart for country
    function createCountryFuelMixChart(countryData, countryName, year) {
        const chartDiv = document.getElementById('country-fuel-mix-chart');
        if (!chartDiv || !countryData.fuels) return;

        const fuelEntries = Object.entries(countryData.fuels);
        if (fuelEntries.length === 0) {
            chartDiv.innerHTML = '<p>No fuel data available</p>';
            return;
        }

        const plotData = [{
            labels: fuelEntries.map(([fuel]) => fuel),
            values: fuelEntries.map(([, capacity]) => capacity),
            type: 'pie',
            marker: { 
                colors: fuelEntries.map(([fuel]) => fuelColors[fuel] || fuelColors['Unknown'])
            },
            textinfo: 'percent',
            hoverinfo: 'label+value+percent'
        }];

        const layout = {
            title: `${countryName} - Fuel Mix (${year})`,
            showlegend: true,
            margin: { l: 60, r: 20, t: 40, b: 60 },
            height: 250
        };

        Plotly.newPlot(chartDiv, plotData, layout, {responsive: true});
    }

    // 3.6. Create green energy percentage pie chart
    function createGreenEnergyChart(countryData, countryName) {
        const chartDiv = document.getElementById('country-green-pie-chart');
        if (!chartDiv) return;

        const greenCapacity = countryData.green_capacity || 0;
        const nonGreenCapacity = (countryData.total_capacity || 0) - greenCapacity;

        if (countryData.total_capacity === 0) {
            chartDiv.innerHTML = '<p>No capacity data available</p>';
            return;
        }

        const plotData = [{
            labels: ['Green Energy', 'Non-Green Energy'],
            values: [greenCapacity, nonGreenCapacity],
            type: 'pie',
            marker: { 
                colors: ['#28a745', '#dc3545'] // Green and red colors
            },
            textinfo: 'percent',
            hoverinfo: 'label+value+percent'
        }];

        const layout = {
            title: `${countryName} - Green Energy (${countryData.green_perc}%)`,
            showlegend: true,
            margin: { l: 10, r: 10, t: 40, b: 10 },
            height: 250,
            legend: {
                orientation: 'h',   // Horizontal layout
                x: 0.5,              // Center horizontally
                y: -0.1,             // Below the plot
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 15 }
            }
        };

        Plotly.newPlot(chartDiv, plotData, layout, {responsive: true});
    }

    // 3.7. Create renewable energy percentage pie chart
    function createRenewableEnergyChart(countryData, countryName) {
        const chartDiv = document.getElementById('country-renewable-pie-chart');
        if (!chartDiv) return;

        const renewableCapacity = countryData.renewable_capacity || 0;
        const nonRenewableCapacity = (countryData.total_capacity || 0) - renewableCapacity;

        if (countryData.total_capacity === 0) {
            chartDiv.innerHTML = '<p>No capacity data available</p>';
            return;
        }

        const plotData = [{
            labels: ['Renewable Energy', 'Non-Renewable Energy'],
            values: [renewableCapacity, nonRenewableCapacity],
            type: 'pie',
            marker: { 
                colors: ['#17a2b8', '#6c757d'] // Blue and gray colors
            },
            textinfo: 'percent',
            hoverinfo: 'label+value+percent'
        }];

        const layout = {
            title: `${countryName} - Renewable Energy (${countryData.renewable_perc}%)`,
            showlegend: true,
            margin: { l: 10, r: 10, t: 40, b: 10 },
            height: 250,
            legend: {
                orientation: 'h',   // Horizontal layout
                x: 0.5,              // Center horizontally
                y: -0.1,             // Below the plot
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 15 }
            }
        };

        Plotly.newPlot(chartDiv, plotData, layout, {responsive: true});
    }

    // 4. For the tab 'Plant distribution'
    // 4.1. Initialize the plant distribution
    // Global array to store references to circle markers
    let plantMarkers = [];

    function initDistributionTab() {
        console.log("Initializing Distribution Tab");

        // Clear existing non-tile layers
        maps.distribution.eachLayer(layer => {
            if (!(layer instanceof L.TileLayer)) {
                maps.distribution.removeLayer(layer);
            }
        });
        geoJsonLayers.distribution = null;
        plantMarkers = []; // Reset marker storage

        const zoomLevel = maps.distribution.getZoom();

        // Add plant markers
        processedData.plants_latest.forEach(plant => {
            if (plant.lat != null && plant.lon != null) {
                const marker = L.circleMarker([plant.lat, plant.lon], {
                    radius: getPlantMarkerRadius_0(plant.cap, zoomLevel),
                    fillColor: fuelColors[plant.fuel] || fuelColors['Unknown'],
                    color: "#000",
                    weight: 0.5,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(maps.distribution)
                .bindTooltip(`<b>${plant.country || 'N/A'}</b><br>Fuel: ${plant.fuel || 'N/A'}<br>Capacity: ${plant.cap?.toLocaleString() || 'N/A'} MW`);

                marker._plantCap = plant.cap; // Store capacity for resizing later
                plantMarkers.push(marker);
            }
        });

        // Add GeoJSON country layer for click interaction
        geoJsonLayers.distribution = L.geoJSON(worldGeoJson, {
            style: { fillColor: 'transparent', weight: 0.5, opacity: 0.5, color: '#555' },
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    const countryName = getCountryNameFromFeature(feature);
                    console.log("Clicked on country:", countryName);

                    // Remove previous highlight
                    if (highlightedCountryLayer) {
                        geoJsonLayers.distribution.resetStyle(highlightedCountryLayer);
                    }

                    // Highlight current layer
                    layer.setStyle({
                        weight: 15,
                        color: '#40E0D0',
                        fillOpacity: 1.0
                    });

                    highlightedCountryLayer = layer;
                    displayCountryDistributionInfo(countryName);
                });
            }
        }).addTo(maps.distribution);

        // Attach zoom handler to resize markers
        maps.distribution.on('zoomend', () => {
            const currentZoom = maps.distribution.getZoom();
            plantMarkers.forEach(marker => {
                const newRadius = getPlantMarkerRadius_0(marker._plantCap, currentZoom);
                marker.setRadius(newRadius);
            });
        });

        maps.distribution.invalidateSize();
    }

    // Updated to be zoom-aware
    function getPlantMarkerRadius_0(capacity, zoomLevel = 2) {
        const baseSize = Math.sqrt(capacity / 10);
        const scale = zoomLevel / 3; // Adjust this scale factor as needed
        return Math.max(3, baseSize * scale * 0.5);
    }

    // 4.2. Disply the plant distrubution and country distribution (updated)
    function displayCountryDistributionInfo(countryName) {
        console.log("--- Entering displayCountryDistributionInfo ---");
        console.log("Function called with countryName:", countryName); // DEBUG LOG 1

        const latestYear = processedData.years[processedData.years.length - 1];
        console.log("Latest year from processedData:", latestYear); // DEBUG LOG 2

        const countryData = processedData.country_summary[countryName]?.[latestYear];
        console.log("Result of processedData.country_summary[countryName]?.[latestYear] for", countryName, ":", countryData); // DEBUG LOG 3

        const panel = document.getElementById('country-info-distribution');
        const nameDiv = document.getElementById('dist-country-name');
        const chartsDiv = document.getElementById('dist-charts');

        // Ensure the panel is visible
        showPanel('country-info-distribution');

        // Always update the country name in the panel
        nameDiv.textContent = countryName;

        // CRITICAL: Clear the chartsDiv content entirely first, before deciding what to put there
        chartsDiv.innerHTML = ''; // This ensures any previous content (like "No data" message) is removed

        if (!countryData) {
            console.warn("Condition: No data available for", countryName, "in", latestYear); // DEBUG LOG 4
            chartsDiv.innerHTML = `<p>No data available for ${countryName} in ${latestYear}.</p>`;
            console.log("--- Exiting displayCountryDistributionInfo (no data) ---");
            return;
        }

        // If we reach here, it means countryData IS available, so we prepare to draw charts
        chartsDiv.innerHTML = `
            <div id="dist-fuel-mix-chart"></div>
            <div id="dist-green-pie-chart"></div>
            <div id="dist-renewable-pie-chart"></div>
        `;
        console.log("Chart divs re-created for:", countryName); // DEBUG LOG 5

        // --- Fuel Mix Chart (Pie Chart) ---
        const fuelMixData = Object.entries(countryData.fuels || {})
            .map(([fuel, capacity]) => ({ fuel, capacity }));

        const fuelMixPlotData = [{
            labels: fuelMixData.map(d => d.fuel),
            values: fuelMixData.map(d => d.capacity),
            type: 'pie',
            marker: { colors: fuelMixData.map(d => fuelColors[d.fuel] || fuelColors['Unknown']) },
            hole: .4,
            textinfo: 'percent',
            hoverinfo: 'label+value',
            textposition: 'auto'
        }];

        const fuelMixLayout = {
            title: `Fuel Mix by Capacity (${latestYear})`,
            showlegend: true,
            margin: { l: 60, r: 20, t: 40, b: 60 },
            height: 300,
            legend: {
                orientation: 'v',   // Vertical layout
                x: 1,               // Far right of plot area
                xanchor: 'left',    // Anchor legend box to its left edge
                y: 0.5,             // Vertically center
                yanchor: 'middle',  // Align center vertically
                font: { size: 12 },
            }
        };

        Plotly.newPlot('dist-fuel-mix-chart', fuelMixPlotData, fuelMixLayout, { responsive: true });

        // --- Green Energy Mix Chart (Pie Chart) ---
        const greenCapacity = countryData.green_capacity || 0;
        const totalCapacity = countryData.total_capacity || 0;
        const nonGreenCapacity = totalCapacity - greenCapacity;

        const greenMixPlotData = [{
            labels: ['Green Energy', 'Non-Green Energy'],
            values: [greenCapacity, nonGreenCapacity],
            type: 'pie',
            marker: { colors: ['#28a745', '#dc3545'] },
            hole: .4,
            textinfo: 'percent',
            hoverinfo: 'label+value'
        }];

        const greenMixLayout = {
            title: `Green Energy Mix (${latestYear})`,
            showlegend: true,
            margin: { l: 20, r: 20, t: 40, b: 20 },
            height: 300,
            legend: {
                orientation: 'h',   // Horizontal layout
                x: 0.5,              // Center horizontally
                y: -0.1,             // Below the plot
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 15 }
            }
        };

        Plotly.newPlot('dist-green-pie-chart', greenMixPlotData, greenMixLayout, { responsive: true });

        // --- Renewable Energy Mix Chart (Pie Chart) ---
        const renewableCapacity = countryData.renewable_capacity || 0;
        const nonRenewableCapacity = totalCapacity - renewableCapacity;

        const renewableMixPlotData = [{
            labels: ['Renewable Energy', 'Non-Renewable Energy'],
            values: [renewableCapacity, nonRenewableCapacity],
            type: 'pie',
            marker: { colors: ['#007bff', '#6c757d'] },
            hole: .4,
            textinfo: 'percent',
            hoverinfo: 'label+value'
        }];

        const renewableMixLayout = {
            title: `Renewable Energy Mix (${latestYear})`,
            showlegend: true,
            margin: { l: 20, r: 20, t: 40, b: 20 },
            height: 300,
            legend: {
                orientation: 'h',   // Horizontal layout
                x: 0.5,              // Center horizontally
                y: -0.1,             // Below the plot
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 15 }
            }
        };

        Plotly.newPlot('dist-renewable-pie-chart', renewableMixPlotData, renewableMixLayout, { responsive: true });
        console.log("--- Exiting displayCountryDistributionInfo (charts drawn) ---");
    }
    
    // 5. For the tab 'Power growth'
    // 5.1. Initialize the Power growth tab
    function initGrowthTab() {
        if (!processedData || !worldGeoJson || !maps.growth) {
            console.log("Growth tab init skipped: data or map not ready.");
            return;
        }
        console.log("Initializing Growth Tab");
        updateGrowthMapColors();
        plotGlobalGrowthChart();
        maps.growth.invalidateSize();
   }

   // 5.2. Get the global growth chart on the bottom of the page
   function plotGlobalGrowthChart() {
        // (Keep the plotGlobalGrowthChart function exactly as it was)
        if (!processedData) return;
        const chartDiv = document.getElementById('global-growth-chart');
        if (!chartDiv) return;
        const globalDataByYear = processedData.global_summary; const years = processedData.years; const plotTraces = [];
        processedData.fuel_types.forEach(fuel => {
            const capacityValues = years.map(year => globalDataByYear[year]?.[fuel] || 0);
            if (capacityValues.some(v => v > 0)) { plotTraces.push({ x: years, y: capacityValues, mode: 'lines+markers', name: fuel, marker: { color: fuelColors[fuel] || fuelColors['Unknown'] }, line: { shape: 'spline' } }); }
        });
        const totalCapacityValues = years.map(year => globalDataByYear[year]?.total_capacity || 0);
        plotTraces.push({ x: years, y: totalCapacityValues, mode: 'lines+markers', name: 'Global Total', marker: { color: '#000000' }, line: { dash: 'dashdot', width: 3 } });
        const layout = { xaxis: { title: 'Year' }, yaxis: { title: 'Capacity (MW)' }, margin: { t: 20, b: 40, l: 60, r: 20 }, height: 300, hovermode: 'x unified' };
        Plotly.newPlot(chartDiv, plotTraces, layout, {responsive: true});
    }


   // 5.3. Update the color after selecting the countries
   function updateGrowthMapColors() {
       if (!processedData || !worldGeoJson || !maps.growth) return;
       const selectedFuel = growthFuelSelect.value;

       if (geoJsonLayers.growth) maps.growth.removeLayer(geoJsonLayers.growth);

       geoJsonLayers.growth = L.geoJSON(worldGeoJson, {
           style: feature => {
               const countryName = getCountryNameFromFeature(feature);
               const growthData = processedData.country_growth_delta[countryName];
               const delta = growthData ? (growthData[selectedFuel] ?? 0) : 0;
               return { fillColor: getGrowthColor(delta), weight: 1, opacity: 1, color: 'white', fillOpacity: 0.8 };
           },
           onEachFeature: (feature, layer) => {
               const countryName = getCountryNameFromFeature(feature);
               const growthData = processedData.country_growth_delta[countryName];
               const delta = growthData ? (growthData[selectedFuel] ?? 0) : 0;
               const deltaText = delta !== null ? `<span class="math-inline">\{delta \>\= 0 ? '\+' \: ''\}</span>{delta.toLocaleString()} MW` : 'N/A';
               const fuelName = selectedFuel === '_total' ? 'Total' : selectedFuel;
               layer.bindTooltip(`<b><span class="math-inline">\{countryName\}</b\><br\></span>{fuelName} Growth: ${deltaText}`);
               layer.on('click', (e) => {
                   L.DomEvent.stopPropagation(e);
                   displayCountryGrowthInfo(countryName);
               });
           }
       }).addTo(maps.growth);
   }

   // 5.4. Update the power growth information after selecting the countries
   function displayCountryGrowthInfo(countryName) {
       const panel = document.getElementById('country-info-growth');
       const nameDiv = document.getElementById('growth-country-name');
       const chartDiv = document.getElementById('country-growth-chart');
       if (!panel || !nameDiv || !chartDiv) return;
   
       nameDiv.textContent = `Power Growth Trend for ${countryName}`;
       chartDiv.innerHTML = '<p>Coming soon...</p>';
       showPanel('country-info-growth');
   }
   
    // 6. Utils
    // 6.1. Function to set the color
    function getGrowthColor(value) {
        // (Keep the getGrowthColor function exactly as it was)
        if (value > 0) {
            const intensity = Math.min(1, value / (growthColorScale.maxPositive || 1));
            const red = 255;
            const greenBlue = 255 * (1 - intensity);
            return `rgb(${red}, ${Math.round(greenBlue)}, ${Math.round(greenBlue)})`;
        } else if (value < 0) {
            const intensity = Math.min(1, Math.abs(value) / (Math.abs(growthColorScale.maxNegative) || 1));
            const blue = 255;
            const redGreen = 255 * (1 - intensity);
            return `rgb(${Math.round(redGreen)}, ${Math.round(redGreen)}, ${blue})`;
        } else {
            return '#ffffff';
        }
    }

    // 6.2. Function to draw the radius
    function getPlantMarkerRadius(capacity) {
        return Math.max(3, Math.sqrt(capacity / 10));
    }

    function getCountryNameFromFeature(feature) {
        return feature.properties.ADMIN || feature.properties.name;
    }

    // 7. Panel Visibility
    window.showPanel = function(panelId) {
        const panel = document.getElementById(panelId); if (panel) panel.classList.remove('hidden');
    }
    window.hidePanel = function(panelId) {
        const panel = document.getElementById(panelId); if (panel) panel.classList.add('hidden');
    }

    // 8. Start the application
    initialize();

});
